import { describe, expect, it } from "vitest";

import {
  buildEvidenceProfile,
  canViewSubmission,
  isEligible,
  projectsForJob,
  rankCandidatesForJob,
  rankProjectsForCandidate,
  type EvidenceProfileEntry,
} from "./index";
import { candidate, evidence, job, project } from "./fixtures";

const entry = (over: Partial<EvidenceProfileEntry>): EvidenceProfileEntry => ({
  skill: "Debugging",
  level: "strong",
  source: "ai",
  projectId: "proj-bdt",
  projectTitle: "Broken Delivery Tracker",
  ...over,
});

describe("buildEvidenceProfile edge cases", () => {
  it("returns an empty profile when there is no Evidence", () => {
    expect(buildEvidenceProfile([], {})).toEqual([]);
  });

  it("records which Submission each level came from", () => {
    const [e] = buildEvidenceProfile(
      [evidence({ submissionId: "sub-9", skill: "Testing", level: "strong" })],
      { "sub-9": { id: "proj-x", title: "X" } },
    );
    expect(e).toMatchObject({ skill: "Testing", projectId: "proj-x", submissionId: "sub-9" });
  });

  it("labels Evidence from an unknown Submission as Unknown Project", () => {
    const [e] = buildEvidenceProfile([evidence({ submissionId: "missing" })], {});
    expect(e.projectTitle).toBe("Unknown Project");
  });

  it("keeps the stronger of two rows from the same source on one Submission", () => {
    const [e] = buildEvidenceProfile(
      [
        evidence({ skill: "Testing", level: "partial", source: "ai" }),
        evidence({ skill: "Testing", level: "strong", source: "ai" }),
      ],
      { "sub-1": { id: "p", title: "P" } },
    );
    expect(e.level).toBe("strong");
  });

  it("treats skill names case- and space-insensitively", () => {
    const profile = buildEvidenceProfile(
      [
        evidence({ submissionId: "sub-1", skill: "REST APIs", level: "partial" }),
        evidence({ submissionId: "sub-2", skill: " rest apis ", level: "strong" }),
      ],
      { "sub-1": { id: "a", title: "A" }, "sub-2": { id: "b", title: "B" } },
    );
    expect(profile).toHaveLength(1);
    expect(profile[0].level).toBe("strong");
  });

  it("a Company-reviewed downgrade on one Submission doesn't hide a strong level elsewhere", () => {
    const profile = buildEvidenceProfile(
      [
        evidence({ submissionId: "sub-1", skill: "Testing", level: "strong", source: "ai" }),
        evidence({ submissionId: "sub-1", skill: "Testing", level: "not_shown", source: "company" }),
        evidence({ submissionId: "sub-2", skill: "Testing", level: "strong", source: "ai" }),
      ],
      { "sub-1": { id: "a", title: "A" }, "sub-2": { id: "b", title: "B" } },
    );
    expect(profile[0]).toMatchObject({ level: "strong", projectTitle: "B" });
  });
});

describe("isEligible edge cases", () => {
  it("matches a region-only Project on the Candidate's region, ignoring case", () => {
    const p = project({ visibility: "region", visibilityTarget: "utah" });
    expect(isEligible(p, candidate({ region: "Utah" }), [])).toBe(true);
    expect(isEligible(p, candidate({ region: "Idaho" }), [])).toBe(false);
    expect(isEligible(p, candidate({ region: null }), [])).toBe(false);
  });

  it("never shows draft or closed Projects, even to invited Candidates", () => {
    expect(isEligible(project({ status: "draft" }), candidate(), ["proj-bdt"])).toBe(false);
    expect(isEligible(project({ status: "closed" }), candidate(), [])).toBe(false);
  });

  it("an Invitation opens a restricted Project to a Candidate outside its university", () => {
    const p = project({ visibility: "university", visibilityTarget: "Utah State" });
    expect(isEligible(p, candidate({ university: "BYU" }), ["proj-bdt"])).toBe(true);
  });

  it("a university-only Project with no target is hidden", () => {
    const p = project({ visibility: "university", visibilityTarget: null });
    expect(isEligible(p, candidate(), [])).toBe(false);
  });
});

describe("rankProjectsForCandidate edge cases", () => {
  it("returns nothing for a Candidate with no skills and no Evidence", () => {
    expect(rankProjectsForCandidate(candidate({ skills: [] }), [], [project()])).toEqual([]);
  });

  it("matches profile skills regardless of case", () => {
    const results = rankProjectsForCandidate(
      candidate({ skills: ["react"] }),
      [],
      [project({ skills: ["React"] })],
    );
    expect(results[0]?.reasons).toEqual(["Uses React from your profile"]);
  });

  it("ranks Evidence above profile-only skills and explains both", () => {
    const evidenceBacked = project({ id: "p-ev", title: "Debug It", skills: ["Debugging"] });
    const profileOnly = project({ id: "p-prof", title: "React It", skills: ["React"] });
    const results = rankProjectsForCandidate(
      candidate({ skills: ["React"] }),
      [entry({ skill: "Debugging", level: "strong" })],
      [profileOnly, evidenceBacked],
    );
    expect(results.map((r) => r.item.id)).toEqual(["p-ev", "p-prof"]);
    expect(results[0].reasons[0]).toBe(
      "Strong Debugging Evidence (Broken Delivery Tracker, AI-assessed)",
    );
  });

  it("does not count not_shown Evidence as a reason", () => {
    const results = rankProjectsForCandidate(
      candidate({ skills: [] }),
      [entry({ skill: "Debugging", level: "not_shown" })],
      [project({ skills: ["Debugging"] })],
    );
    expect(results).toEqual([]);
  });

  it("includes invite-only Projects only for invited Candidates", () => {
    const priv = project({ id: "proj-private", visibility: "invite" });
    expect(rankProjectsForCandidate(candidate(), [], [priv])).toEqual([]);
    expect(rankProjectsForCandidate(candidate(), [], [priv], ["proj-private"])).toHaveLength(1);
  });

  it("breaks ties alphabetically by title so the order is stable", () => {
    const b = project({ id: "b", title: "Beta", skills: ["React"] });
    const a = project({ id: "a", title: "Alpha", skills: ["React"] });
    const results = rankProjectsForCandidate(candidate({ skills: ["React"] }), [], [b, a]);
    expect(results.map((r) => r.item.title)).toEqual(["Alpha", "Beta"]);
  });
});

describe("rankCandidatesForJob edge cases", () => {
  it("weights required skills double compared with preferred skills", () => {
    const j = job({ requiredSkills: ["Debugging"], preferredSkills: ["SQL"] });
    const results = rankCandidatesForJob(j, [
      // strong on preferred only: 3 × 1 = 3
      { candidate: candidate({ id: "pref", skills: [] }), profile: [entry({ skill: "SQL", level: "strong" })] },
      // partial on required: 2 × 2 = 4
      { candidate: candidate({ id: "req", skills: [] }), profile: [entry({ skill: "Debugging", level: "partial" })] },
    ]);
    expect(results.map((r) => r.item.id)).toEqual(["req", "pref"]);
  });

  it("leaves out Candidates with nothing relevant", () => {
    const results = rankCandidatesForJob(job(), [
      { candidate: candidate({ id: "none", skills: ["Marketing"] }), profile: [] },
    ]);
    expect(results).toEqual([]);
  });

  it("explains profile-only fits as having no Evidence yet", () => {
    const [r] = rankCandidatesForJob(job(), [
      { candidate: candidate({ skills: ["React"] }), profile: [] },
    ]);
    expect(r.reasons).toEqual(["Lists React on profile (no Evidence yet)"]);
  });

  it("labels Company-reviewed Evidence in the reason", () => {
    const [r] = rankCandidatesForJob(job(), [
      { candidate: candidate({ skills: [] }), profile: [entry({ skill: "Testing", source: "company" })] },
    ]);
    expect(r.reasons[0]).toContain("Company-reviewed");
  });

  it("counts a skill listed as both required and preferred only once", () => {
    const j = job({ requiredSkills: ["React"], preferredSkills: ["react"] });
    const [r] = rankCandidatesForJob(j, [{ candidate: candidate({ skills: ["React"] }), profile: [] }]);
    expect(r.reasons).toEqual(["Lists React on profile (no Evidence yet)"]);
  });
});

describe("projectsForJob edge cases", () => {
  it("skips closed Projects", () => {
    expect(projectsForJob(job(), [project({ status: "closed" })])).toEqual([]);
  });

  it("counts preferred skills and names the shared skills", () => {
    const [r] = projectsForJob(
      job({ requiredSkills: [], preferredSkills: ["SQL"] }),
      [project({ skills: ["SQL", "Marketing"] })],
    );
    expect(r.reasons).toEqual(["Tests SQL"]);
  });
});

describe("canViewSubmission edge cases", () => {
  it("is false when the Company has no links at all", () => {
    expect(canViewSubmission("co-summit", "proj-bdt", [])).toBe(false);
  });
});
