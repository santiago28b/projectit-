import { describe, expect, it } from "vitest";
import {
  buildEvidenceProfile,
  canViewSubmission,
  isEligible,
  projectsForJob,
  rankCandidatesForJob,
  rankProjectsForCandidate,
} from "./index";
import type { CreateProjectInput } from "@/shared/models/projects";
import { candidate, evidence, job, project } from "./fixtures";
import { normalizeJobInput } from "./jobInput";
import { validateCreateInput } from "./projectInput";

function validCreateInput(
  over: Partial<CreateProjectInput> = {},
): CreateProjectInput {
  return {
    title: "API Pagination",
    scenario: "Fix broken pagination.",
    instructions: "Reproduce, fix, and cover with tests.",
    skills: ["REST APIs", "Testing"],
    expectedDurationMinutes: 90,
    difficulty: "Intermediate",
    deliverables: ["Repository URL", "Walkthrough video"],
    deadline: null,
    visibility: "public",
    visibilityTarget: null,
    rubric: [
      { name: "Correctness", description: "Does the solution work?" },
      { name: "Communication", description: "Is the Walkthrough clear?" },
    ],
    ...over,
  };
}

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
    expect(testing?.projectId).toBe("proj-data");
    expect(testing?.submissionId).toBe("sub-2");
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

  it("treats skill names case-insensitively when picking a winner", () => {
    const profile = buildEvidenceProfile(
      [
        evidence({ submissionId: "sub-1", skill: "REST APIs", level: "partial" }),
        evidence({ submissionId: "sub-2", skill: "rest apis", level: "strong" }),
      ],
      projectsBySubmission,
    );
    expect(profile).toHaveLength(1);
    expect(profile[0]?.level).toBe("strong");
  });

  it("falls back when a Submission has no known Project", () => {
    const profile = buildEvidenceProfile(
      [evidence({ submissionId: "sub-missing", skill: "Testing", level: "strong" })],
      projectsBySubmission,
    );
    expect(profile[0]).toMatchObject({
      projectId: "",
      projectTitle: "Unknown Project",
    });
  });
});

describe("isEligible", () => {
  it("hides a university-only Project from Candidates at other universities", () => {
    const p = project({ visibility: "university", visibilityTarget: "Utah State" });
    expect(isEligible(p, candidate({ university: "BYU" }), [])).toBe(false);
    expect(isEligible(p, candidate({ university: "Utah State" }), [])).toBe(true);
  });

  it("hides a region-only Project from Candidates outside that region", () => {
    const p = project({ visibility: "region", visibilityTarget: "California" });
    expect(isEligible(p, candidate({ region: "Utah" }), [])).toBe(false);
    expect(isEligible(p, candidate({ region: "California" }), [])).toBe(true);
  });

  it("shows an invite-only Project only to invited Candidates", () => {
    const p = project({ id: "proj-private", visibility: "invite" });
    expect(isEligible(p, candidate(), [])).toBe(false);
    expect(isEligible(p, candidate(), ["proj-private"])).toBe(true);
  });

  it("hides draft and closed Projects even when they are public", () => {
    expect(isEligible(project({ status: "draft" }), candidate(), [])).toBe(false);
    expect(isEligible(project({ status: "closed" }), candidate(), [])).toBe(false);
    expect(isEligible(project({ status: "published" }), candidate(), [])).toBe(true);
  });

  it("lets an Invitation unlock a restricted Project", () => {
    const p = project({
      id: "proj-byu",
      visibility: "university",
      visibilityTarget: "BYU",
    });
    expect(
      isEligible(p, candidate({ university: "Utah State" }), ["proj-byu"]),
    ).toBe(true);
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

  it("never recommends a Project the Candidate is not eligible for", () => {
    const inviteOnly = project({
      id: "proj-private",
      title: "Private Screening",
      visibility: "invite",
      skills: ["React", "REST APIs"],
    });
    const results = rankProjectsForCandidate(candidate(), [], [inviteOnly, project()]);
    expect(results.map((r) => r.item.id)).toEqual(["proj-bdt"]);
  });

  it("ranks Evidence-backed skills above profile-only overlap", () => {
    const withEvidence = project({
      id: "proj-evidence",
      title: "Debugging Lab",
      skills: ["Debugging"],
    });
    const profileOnly = project({
      id: "proj-profile",
      title: "React Lab",
      skills: ["React"],
    });
    const results = rankProjectsForCandidate(
      candidate({ skills: ["React"] }),
      [
        {
          skill: "Debugging",
          level: "strong",
          source: "ai",
          projectId: "proj-bdt",
          projectTitle: "Broken Delivery Tracker",
        },
      ],
      [profileOnly, withEvidence],
    );
    expect(results.map((r) => r.item.id)).toEqual(["proj-evidence", "proj-profile"]);
    expect(results[0]?.reasons[0]).toMatch(/Strong Debugging Evidence/);
    expect(results[1]?.reasons[0]).toMatch(/from your profile/);
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

  it("drops Candidates with no skill fit and never returns a score", () => {
    const results = rankCandidatesForJob(job(), [
      { candidate: candidate({ id: "cand-none", skills: ["Marketing"] }), profile: [] },
      {
        candidate: candidate({ id: "cand-fit", skills: ["React"] }),
        profile: [],
      },
    ]);
    expect(results.map((r) => r.item.id)).toEqual(["cand-fit"]);
    expect(Object.keys(results[0] ?? {}).sort()).toEqual(["item", "reasons"]);
  });
});

describe("projectsForJob", () => {
  it("lists Projects that share skills with the Job, most overlap first", () => {
    const partial = project({ id: "proj-api", title: "API Pagination", skills: ["REST APIs"] });
    const none = project({ id: "proj-mkt", skills: ["Marketing"] });
    const results = projectsForJob(job(), [partial, none, project()]);
    expect(results.map((r) => r.item.id)).toEqual(["proj-bdt", "proj-api"]);
  });

  it("skips closed Projects", () => {
    const closed = project({ id: "proj-old", status: "closed" });
    const results = projectsForJob(job(), [closed, project()]);
    expect(results.map((r) => r.item.id)).toEqual(["proj-bdt"]);
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

describe("validateCreateInput", () => {
  it("accepts a complete Company Project", () => {
    expect(() => validateCreateInput(validCreateInput())).not.toThrow();
  });

  it("requires title, scenario, instructions, skills, deliverables, and Rubric", () => {
    expect(() => validateCreateInput(validCreateInput({ title: "  " }))).toThrow(
      /Title is required/,
    );
    expect(() => validateCreateInput(validCreateInput({ skills: [] }))).toThrow(
      /skill/,
    );
    expect(() => validateCreateInput(validCreateInput({ rubric: [] }))).toThrow(
      /Rubric/,
    );
  });

  it("requires a Visibility target for university and region Projects", () => {
    expect(() =>
      validateCreateInput(
        validCreateInput({ visibility: "university", visibilityTarget: null }),
      ),
    ).toThrow(/Visibility target/);
    expect(() =>
      validateCreateInput(
        validCreateInput({
          visibility: "region",
          visibilityTarget: "Utah",
        }),
      ),
    ).not.toThrow();
  });
});

describe("normalizeJobInput", () => {
  const valid = {
    title: " Data Analyst Intern ",
    description: " Dashboards ",
    requiredSkills: ["SQL", " Python "],
    preferredSkills: ["Data Visualization"],
  };

  it("accepts a Job with a title and a required skill, trimming text", () => {
    expect(normalizeJobInput(valid)).toEqual({
      title: "Data Analyst Intern",
      description: "Dashboards",
      requiredSkills: ["SQL", "Python"],
      preferredSkills: ["Data Visualization"],
    });
  });

  it("requires a title and at least one required skill", () => {
    expect(() => normalizeJobInput({ ...valid, title: "  " })).toThrow("Title");
    expect(() => normalizeJobInput({ ...valid, requiredSkills: [" ", ""] })).toThrow(
      "required skill",
    );
  });

  it("de-duplicates skills and drops preferred skills that are already required", () => {
    const result = normalizeJobInput({
      ...valid,
      requiredSkills: ["SQL", "sql", "Python"],
      preferredSkills: ["python", "Testing", "Testing"],
    });
    expect(result.requiredSkills).toEqual(["SQL", "Python"]);
    expect(result.preferredSkills).toEqual(["Testing"]);
  });
});
