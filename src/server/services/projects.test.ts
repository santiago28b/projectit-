import { describe, expect, it, vi } from "vitest";

import type { ProjectsDao } from "@/server/database/dao/pg/projects";
import type { Candidate } from "@/shared/models/domain";
import type { ProjectCard } from "@/shared/models/projects";

import { createProjectsService } from "./projects";

vi.mock("server-only", () => ({}));
vi.mock("@/server/database/dao", () => ({
  projectsDao: {},
  candidatesDao: { findById: async () => null },
}));
vi.mock("@/server/lib/db", () => ({ db: {} }));
vi.mock("@/server/lib/supabase/admin", () => ({
  createAdminClient: () => ({}),
}));

const maria: Candidate = {
  id: "maria",
  userId: "maria-user",
  university: "University of Utah",
  location: "Salt Lake City, UT",
  region: "Mountain West",
  skills: ["TypeScript", "React"],
  createdAt: "2026-10-02T10:00:00Z",
  updatedAt: "2026-10-02T10:00:00Z",
};

function project(
  id: string,
  visibility: ProjectCard["visibility"],
  visibilityTarget: string | null = null,
): ProjectCard {
  return {
    id,
    title: id,
    scenario: "",
    description: "",
    instructions: "",
    type: "platform",
    visibility,
    visibilityTarget,
    expectedDurationMinutes: 60,
    difficulty: null,
    skills: ["React"],
    deliverables: [],
    deadline: null,
    status: "published",
    createdBy: "platform",
    createdAt: "2026-10-02T10:00:00Z",
    updatedAt: "2026-10-02T10:00:00Z",
    companies: [],
  };
}

const catalog = [
  project("public", "public"),
  project("my-university", "university", "University of Utah"),
  project("other-university", "university", "Arizona State University"),
  project("my-region", "region", "Mountain West"),
  project("other-region", "region", "Pacific Northwest"),
  project("invite-only", "invite"),
];

function fakeDao(options: {
  invited?: string[];
  submissionId?: string | null;
}): ProjectsDao {
  return {
    listPublishedCards: async () => catalog,
    findDetail: async (id: string) => {
      const found = catalog.find((p) => p.id === id);
      return found ? { ...found, resources: [] } : null;
    },
    rubric: async () => [],
    invitedProjectIds: async () => options.invited ?? [],
    submissionId: async () => options.submissionId ?? null,
  } as unknown as ProjectsDao;
}

describe("Marketplace Visibility", () => {
  it("never shows a Project restricted to another university, another region, or an Invitation the Candidate doesn't have", async () => {
    const service = createProjectsService(fakeDao({}));
    const ids = (await service.listMarketplace(maria)).map((p) => p.id);
    expect(ids).toEqual(["public", "my-university", "my-region"]);
  });

  it("shows an invite-only Project to an invited Candidate", async () => {
    const service = createProjectsService(fakeDao({ invited: ["invite-only"] }));
    const ids = (await service.listMarketplace(maria)).map((p) => p.id);
    expect(ids).toContain("invite-only");
  });
});

describe("Project detail", () => {
  it("is hidden when the Candidate isn't eligible, even by direct URL", async () => {
    const service = createProjectsService(fakeDao({}));
    expect(await service.getDetail("other-university", maria)).toBeNull();
    expect(await service.getDetail("invite-only", maria)).toBeNull();
  });

  it("includes the Candidate's Submission when they already submitted", async () => {
    const service = createProjectsService(fakeDao({ submissionId: "sub-1" }));
    const detail = await service.getDetail("public", maria);
    expect(detail?.mySubmissionId).toBe("sub-1");
  });
});

describe("more Visibility rules", () => {
  it("never lists an unpublished Project, even a public one", async () => {
    const draft = { ...project("draft", "public"), status: "draft" as const };
    const dao = { ...fakeDao({}), listPublishedCards: async () => [draft] };
    expect(await createProjectsService(dao).listMarketplace(maria)).toEqual([]);
  });

  it("matches university and region names regardless of case and spacing", async () => {
    const shouty = project("shouty", "university", "  UNIVERSITY OF UTAH ");
    const dao = { ...fakeDao({}), listPublishedCards: async () => [shouty] };
    const ids = (await createProjectsService(dao).listMarketplace(maria)).map((p) => p.id);
    expect(ids).toEqual(["shouty"]);
  });

  it("hides a university Project from a Candidate with no university", async () => {
    const service = createProjectsService(fakeDao({}));
    const ids = (await service.listMarketplace({ ...maria, university: null })).map((p) => p.id);
    expect(ids).not.toContain("my-university");
  });

  it("lets a Candidate reopen a Project they submitted to, even if no longer eligible", async () => {
    const service = createProjectsService(fakeDao({ submissionId: "sub-1" }));
    const detail = await service.getDetail("invite-only", maria);
    expect(detail?.mySubmissionId).toBe("sub-1");
  });

  it("returns null for a Project that doesn't exist", async () => {
    const service = createProjectsService(fakeDao({}));
    expect(await service.getDetail("missing", maria)).toBeNull();
  });

  it("includes the Rubric on the detail page", async () => {
    const rubric = [{ name: "Correctness", description: "Works" }];
    const dao = { ...fakeDao({}), rubric: async () => rubric };
    expect((await createProjectsService(dao).getDetail("public", maria))?.rubric).toEqual(rubric);
  });

  it("canStart follows the same rules as the Marketplace", async () => {
    const service = createProjectsService(fakeDao({ invited: ["invite-only"] }));
    const byId = (id: string) => catalog.find((p) => p.id === id)!;
    expect(await service.canStart(byId("public"), maria)).toBe(true);
    expect(await service.canStart(byId("invite-only"), maria)).toBe(true);
    expect(await service.canStart(byId("other-region"), maria)).toBe(false);
  });
});
