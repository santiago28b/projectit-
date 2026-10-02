import { describe, expect, it, vi } from "vitest";
import { effectiveEvidence, safeExternalUrl } from "../../shared/models/review";
import type { Evidence } from "../../shared/models/domain";
import type { reviewDao } from "../database/dao/review";
import { createReviewService } from "./review";

vi.mock("../database/dao/review", () => ({ reviewDao: {} }));

const ai: Evidence = {
  id: "ai",
  candidateId: "candidate",
  submissionId: "submission",
  skill: "SQL",
  level: "strong",
  source: "ai",
  rationale: "Query works",
  createdAt: "2026-10-02T10:00:00Z",
  updatedAt: "2026-10-02T10:00:00Z",
};

describe("review Evidence", () => {
  it("Company-reviewed Evidence replaces a stronger AI level in either order", () => {
    const company: Evidence = {
      ...ai,
      id: "company",
      source: "company",
      level: "partial",
    };
    expect(effectiveEvidence([ai, company])).toEqual([company]);
    expect(effectiveEvidence([company, ai])).toEqual([company]);
  });

  it("keeps the latest Company review and independent skills", () => {
    const earlier: Evidence = {
      ...ai,
      id: "earlier",
      source: "company",
      level: "not_shown",
    };
    const latest: Evidence = {
      ...earlier,
      id: "latest",
      level: "partial",
      updatedAt: "2026-10-02T11:00:00Z",
    };
    const other = { ...ai, id: "other", skill: "TypeScript" };
    expect(effectiveEvidence([latest, ai, earlier, other])).toEqual([
      latest,
      other,
    ]);
  });

  it("rejects executable deliverable URLs", () => {
    expect(safeExternalUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeExternalUrl("https://github.com/example/project")).toBe(
      "https://github.com/example/project",
    );
  });
});

function fakeDao() {
  return {
    submission: vi
      .fn()
      .mockResolvedValue({
        id: "submission",
        projectId: "project",
        candidateId: "candidate",
      }),
    companyIds: vi.fn().mockResolvedValue(["company"]),
    user: vi
      .fn()
      .mockResolvedValue({
        id: "reviewer",
        role: "company_admin",
        profileData: { companyId: "company" },
      }),
    listEvidence: vi.fn().mockResolvedValue([ai]),
    saveOverride: vi
      .fn()
      .mockImplementation(async (row, level, rationale) => ({
        ...row,
        source: "company",
        level,
        rationale,
      })),
    shortlist: vi.fn().mockResolvedValue(null),
    insertShortlist: vi
      .fn()
      .mockImplementation(async (input) => ({ id: "shortlist", ...input })),
    removeShortlist: vi.fn().mockResolvedValue(true),
    listSubmissions: vi.fn().mockResolvedValue([
      { id: "mine", projectId: "project", candidateId: "candidate", submittedAt: "2026-10-02" },
      { id: "theirs", projectId: "other-project", candidateId: "candidate", submittedAt: "2026-10-02" },
    ]),
    candidate: vi.fn().mockResolvedValue({ id: "candidate", userId: "candidate-user" }),
    project: vi.fn().mockResolvedValue({ id: "project", title: "Broken Delivery Tracker", skills: [] }),
    rubric: vi
      .fn()
      .mockResolvedValue([{ name: "Testing", description: "Test coverage" }]),
    saveEvaluation: vi
      .fn()
      .mockImplementation(async (input) => ({ id: "evaluation", ...input })),
  };
}

describe("review persistence", () => {
  it("saves overrides as Company-reviewed without changing the AI row", async () => {
    const dao = fakeDao();
    const service = createReviewService(dao as unknown as typeof reviewDao);
    const result = await service.override({
      submissionId: "submission",
      reviewerId: "reviewer",
      skill: "SQL",
      level: "partial",
      rationale: "Missing edge case",
    });
    expect(dao.saveOverride).toHaveBeenCalledWith(
      ai,
      "partial",
      "Missing edge case",
    );
    expect(result.source).toBe("company");
    expect(ai.source).toBe("ai");
  });

  it("saves the Candidate to the correct Company's Shortlist", async () => {
    const dao = fakeDao();
    const input = {
      companyId: "company",
      candidateId: "candidate",
      submissionId: "submission",
    };
    const service = createReviewService(dao as unknown as typeof reviewDao);
    expect(await service.addToShortlist(input, "reviewer")).toEqual({
      id: "shortlist",
      ...input,
    });
    expect(dao.insertShortlist).toHaveBeenCalledWith(input);
  });

  it("returns an existing Shortlist rather than inserting a duplicate", async () => {
    const dao = fakeDao();
    const existing = { id: "existing" };
    dao.shortlist.mockResolvedValue(existing);
    const service = createReviewService(dao as unknown as typeof reviewDao);
    expect(
      await service.addToShortlist({
        companyId: "company",
        candidateId: "candidate",
        submissionId: "submission",
      }, "reviewer"),
    ).toEqual(existing);
    expect(dao.insertShortlist).not.toHaveBeenCalled();
  });

  it("rejects another Company's Shortlist and a different Candidate", async () => {
    const dao = fakeDao();
    const service = createReviewService(dao as unknown as typeof reviewDao);
    await expect(
      service.addToShortlist({
        companyId: "other",
        candidateId: "candidate",
        submissionId: "submission",
      }, "reviewer"),
    ).rejects.toThrow("does not match");
    await expect(
      service.addToShortlist({
        companyId: "company",
        candidateId: "other",
        submissionId: "submission",
      }, "reviewer"),
    ).rejects.toThrow("does not match");
    expect(dao.insertShortlist).not.toHaveBeenCalled();
  });

  it("saves qualitative Rubric results and notes", async () => {
    const dao = fakeDao();
    const input = {
      submissionId: "submission",
      reviewerId: "reviewer",
      rubricResults: { Testing: "partial" },
      notes: "Discuss boundary cases",
      interviewRecommended: true,
    };
    const service = createReviewService(dao as unknown as typeof reviewDao);
    await service.saveEvaluation(input);
    expect(dao.saveEvaluation).toHaveBeenCalledWith(input);
    await expect(
      service.saveEvaluation({ ...input, rubricResults: { Testing: 90 } }),
    ).rejects.toThrow("Invalid Rubric");
  });

  it("rejects review writes from a Company that neither owns nor Sponsors the Project", async () => {
    const dao = fakeDao();
    dao.companyIds.mockResolvedValue(["another-company"]);
    const service = createReviewService(dao as unknown as typeof reviewDao);
    await expect(
      service.override({
        submissionId: "submission",
        reviewerId: "reviewer",
        skill: "SQL",
        level: "partial",
        rationale: "",
      }),
    ).rejects.toThrow("owns or Sponsors");
    await expect(
      service.saveEvaluation({
        submissionId: "submission",
        reviewerId: "reviewer",
        rubricResults: {},
        notes: "",
        interviewRecommended: false,
      }),
    ).rejects.toThrow("owns or Sponsors");
    expect(dao.saveOverride).not.toHaveBeenCalled();
    expect(dao.saveEvaluation).not.toHaveBeenCalled();
  });

  it("does not save unknown Evidence levels", async () => {
    const dao = fakeDao();
    const service = createReviewService(dao as unknown as typeof reviewDao);
    await expect(
      service.override({
        submissionId: "submission",
        reviewerId: "reviewer",
        skill: "SQL",
        level: "excellent" as Evidence["level"],
        rationale: "",
      }),
    ).rejects.toThrow("Invalid Evidence");
    expect(dao.saveOverride).not.toHaveBeenCalled();
  });

  it("rejects review by a Candidate even with a valid reviewer id", async () => {
    const dao = fakeDao();
    dao.user.mockResolvedValue({ id: "maria", role: "candidate", profileData: {} });
    const service = createReviewService(dao as unknown as typeof reviewDao);
    await expect(
      service.override({
        submissionId: "submission",
        reviewerId: "maria",
        skill: "SQL",
        level: "strong",
        rationale: "self-review",
      }),
    ).rejects.toThrow("owns or Sponsors");
    expect(dao.saveOverride).not.toHaveBeenCalled();
  });
});

describe("review list privacy", () => {
  it("lists only Submissions to Projects the reviewer's Company owns or Sponsors", async () => {
    const dao = fakeDao();
    dao.companyIds.mockImplementation(async (projectId: string) =>
      projectId === "project" ? ["company"] : ["another-company"],
    );
    dao.user.mockImplementation(async (id: string) =>
      id === "reviewer"
        ? { id, role: "company_admin", profileData: { companyId: "company" } }
        : { id, name: "Maria Santos", role: "candidate", profileData: {} },
    );
    const service = createReviewService(dao as unknown as typeof reviewDao);
    const list = await service.listSubmissions("reviewer");
    expect(list.map((entry) => entry.id)).toEqual(["mine"]);
  });

  it("lists nothing for a user who isn't a Company admin", async () => {
    const dao = fakeDao();
    dao.user.mockResolvedValue({ id: "maria", role: "candidate", profileData: {} });
    const service = createReviewService(dao as unknown as typeof reviewDao);
    expect(await service.listSubmissions("maria")).toEqual([]);
  });
});

describe("removing from the Shortlist", () => {
  it("removes the Company's own entry", async () => {
    const dao = fakeDao();
    const service = createReviewService(dao as unknown as typeof reviewDao);
    await service.removeFromShortlist("shortlist", "company");
    expect(dao.removeShortlist).toHaveBeenCalledWith("shortlist", "company");
  });

  it("treats another Company's entry as not found", async () => {
    const dao = fakeDao();
    dao.removeShortlist.mockResolvedValue(false);
    const service = createReviewService(dao as unknown as typeof reviewDao);
    await expect(
      service.removeFromShortlist("shortlist", "another-company"),
    ).rejects.toThrow("not found");
  });
});
