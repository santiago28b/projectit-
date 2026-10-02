import { describe, expect, it } from "vitest";

import { createEvidenceService } from "./evidence";
import { fakeMatchingRepository } from "./__fixtures__/fakeMatchingRepository";
import { evidence, project } from "./rules/fixtures";

function world() {
  return fakeMatchingRepository({
    projects: [project(), project({ id: "proj-data", title: "Sales Data Insights" })],
    submissions: { "sub-1": "proj-bdt", "sub-2": "proj-data" },
    evidence: [
      evidence({ id: "ev-debug", submissionId: "sub-1", skill: "Debugging", level: "strong" }),
      evidence({ id: "ev-test-1", submissionId: "sub-1", skill: "Testing", level: "partial" }),
      evidence({ id: "ev-test-2", submissionId: "sub-2", skill: "Testing", level: "strong" }),
    ],
  });
}

describe("evidenceService.getProfile", () => {
  it("builds the strongest level per skill with the Project it came from", async () => {
    const { repo } = world();
    const profile = await createEvidenceService(repo).getProfile("cand-maria");
    const testing = profile.find((e) => e.skill === "Testing");
    expect(testing).toMatchObject({ level: "strong", projectTitle: "Sales Data Insights" });
  });

  it("is empty for a Candidate with no Submissions", async () => {
    const { repo } = world();
    expect(await createEvidenceService(repo).getProfile("cand-new")).toEqual([]);
  });
});

describe("evidenceService.override", () => {
  it("saves a Company-reviewed row and keeps the AI row", async () => {
    const { repo, data } = world();
    const saved = await createEvidenceService(repo).override("ev-debug", "partial", "reviewer-1");
    expect(saved).toMatchObject({ source: "company", level: "partial", skill: "Debugging", submissionId: "sub-1" });
    expect(data.evidence.find((e) => e.id === "ev-debug")?.level).toBe("strong");
  });

  it("updates the same Company row when overridden twice", async () => {
    const { repo, data } = world();
    const service = createEvidenceService(repo);
    await service.override("ev-debug", "partial", "r");
    await service.override("ev-debug", "not_shown", "r");
    const companyRows = data.evidence.filter((e) => e.skill === "Debugging" && e.source === "company");
    expect(companyRows).toHaveLength(1);
    expect(companyRows[0].level).toBe("not_shown");
  });

  it("throws for unknown Evidence", async () => {
    const { repo } = world();
    await expect(createEvidenceService(repo).override("nope", "strong", "r")).rejects.toThrow("not found");
  });

  it("changes the Candidate's profile when a reviewer downgrades their only Evidence", async () => {
    const { repo } = world();
    const service = createEvidenceService(repo);
    await service.override("ev-debug", "partial", "r");
    const debugging = (await service.getProfile("cand-maria")).find((e) => e.skill === "Debugging");
    expect(debugging).toMatchObject({ level: "partial", source: "company" });
  });
});

describe("evidenceService.listForSubmission", () => {
  it("returns one row per skill, preferring the Company-reviewed one", async () => {
    const { repo } = world();
    const service = createEvidenceService(repo);
    await service.override("ev-test-1", "strong", "r");
    const rows = await service.listForSubmission("sub-1");
    expect(rows).toHaveLength(2);
    expect(rows.find((e) => e.skill === "Testing")).toMatchObject({ source: "company", level: "strong" });
  });
});
