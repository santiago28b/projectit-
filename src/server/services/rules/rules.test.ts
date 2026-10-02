import { describe, expect, it } from "vitest";
import {
  buildEvidenceProfile,
  canViewSubmission,
  isEligible,
  projectsForJob,
  rankCandidatesForJob,
  rankProjectsForCandidate,
} from "./index";
import { candidate, evidence, job, project } from "./fixtures";

const projectsBySubmission = {
  "sub-1": { id: "proj-bdt", title: "Broken Delivery Tracker" },
  "sub-2": { id: "proj-data", title: "Sales Data Insights" },
};

describe("buildEvidenceProfile", () => {
  it("keeps the strongest level per skill across Submissions", () => {
    const profile = buildEvidenceProfile(
      [
        evidence({ submissionId: "sub-1", skill: "Testing", level: "partial" }),
        evidence({ submissionId: "sub-2", skill: "Testing", level: "strong" }),
      ],
      projectsBySubmission,
    );
    const testing = profile.find((e) => e.skill === "Testing");
    expect(testing?.level).toBe("strong");
    expect(testing?.projectTitle).toBe("Sales Data Insights");
  });

  it("lets Company-reviewed beat AI-assessed on the same Submission", () => {
    const profile = buildEvidenceProfile(
      [
        evidence({ submissionId: "sub-1", skill: "Debugging", level: "strong", source: "ai" }),
        evidence({ submissionId: "sub-1", skill: "Debugging", level: "partial", source: "company" }),
      ],
      projectsBySubmission,
    );
    const debugging = profile.find((e) => e.skill === "Debugging");
    expect(debugging?.level).toBe("partial");
    expect(debugging?.source).toBe("company");
  });
});

describe("isEligible", () => {
  it("hides a university-only Project from Candidates at other universities", () => {
    const p = project({ visibility: "university", visibilityTarget: "Utah State" });
    expect(isEligible(p, candidate({ university: "BYU" }), [])).toBe(false);
    expect(isEligible(p, candidate({ university: "Utah State" }), [])).toBe(true);
  });

  it("shows an invite-only Project only to invited Candidates", () => {
    const p = project({ id: "proj-private", visibility: "invite" });
    expect(isEligible(p, candidate(), [])).toBe(false);
    expect(isEligible(p, candidate(), ["proj-private"])).toBe(true);
  });
});

describe("rankProjectsForCandidate", () => {
  it("recommends Broken Delivery Tracker to Maria, with reasons", () => {
    const unrelated = project({ id: "proj-mkt", title: "Campaign Test Plan", skills: ["Marketing"] });
    const results = rankProjectsForCandidate(candidate(), [], [unrelated, project()]);
    expect(results[0]?.item.title).toBe("Broken Delivery Tracker");
    expect(results.find((r) => r.item.id === "proj-mkt")).toBeUndefined();
    for (const r of results) expect(r.reasons.length).toBeGreaterThan(0);
  });

  it("never returns a score to the caller", () => {
    const [first] = rankProjectsForCandidate(candidate(), [], [project()]);
    expect(Object.keys(first ?? {}).sort()).toEqual(["item", "reasons"]);
  });
});

describe("rankCandidatesForJob", () => {
  it("ranks a strong Candidate above an average one, with reasons", () => {
    const strong = candidate({ id: "cand-strong", skills: [] });
    const average = candidate({ id: "cand-avg", skills: [] });
    const results = rankCandidatesForJob(job(), [
      {
        candidate: average,
        profile: [{ skill: "Debugging", level: "partial", source: "ai", projectId: "proj-bdt", projectTitle: "Broken Delivery Tracker" }],
      },
      {
        candidate: strong,
        profile: [
          { skill: "Debugging", level: "strong", source: "ai", projectId: "proj-bdt", projectTitle: "Broken Delivery Tracker" },
          { skill: "Testing", level: "strong", source: "company", projectId: "proj-bdt", projectTitle: "Broken Delivery Tracker" },
        ],
      },
    ]);
    expect(results.map((r) => r.item.id)).toEqual(["cand-strong", "cand-avg"]);
    for (const r of results) expect(r.reasons.length).toBeGreaterThan(0);
  });
});

describe("projectsForJob", () => {
  it("lists Projects that share skills with the Job, most overlap first", () => {
    const partial = project({ id: "proj-api", title: "API Pagination", skills: ["REST APIs"] });
    const none = project({ id: "proj-mkt", skills: ["Marketing"] });
    const results = projectsForJob(job(), [partial, none, project()]);
    expect(results.map((r) => r.item.id)).toEqual(["proj-bdt", "proj-api"]);
  });
});

describe("canViewSubmission", () => {
  const links = [
    { companyId: "co-summit", projectId: "proj-bdt", relationshipType: "sponsor" as const },
    { companyId: "co-other", projectId: "proj-other", relationshipType: "owner" as const },
  ];

  it("allows the owner or a Sponsor", () => {
    expect(canViewSubmission("co-summit", "proj-bdt", links)).toBe(true);
    expect(canViewSubmission("co-other", "proj-other", links)).toBe(true);
  });

  it("blocks a Company that neither owns nor Sponsors the Project", () => {
    expect(canViewSubmission("co-summit", "proj-other", links)).toBe(false);
  });
});
