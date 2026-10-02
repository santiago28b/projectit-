import { describe, expect, it, vi } from "vitest";

import type { ProjectsDao } from "@/server/database/dao/pg/projects";
import type { Candidate } from "@/shared/models/domain";
import type { ProjectCard } from "@/shared/models/projects";

import { createProjectsService } from "./projects";

vi.mock("@/server/database/dao", () => ({ projectsDao: {} }));

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
    findDetail: async (id) => {
      const found = catalog.find((p) => p.id === id);
      return found ? { ...found, resources: [] } : null;
    },
    rubric: async () => [],
    invitedProjectIds: async () => options.invited ?? [],
    submissionId: async () => options.submissionId ?? null,
  };
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
