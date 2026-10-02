import { describe, expect, it } from "vitest";

import { createMatchingService } from "./matching";
import { fakeMatchingRepository } from "./__fixtures__/fakeMatchingRepository";
import { candidate, evidence, job, project } from "./rules/fixtures";

const SUMMIT = "co-summit";
const OTHER = "co-other";

function world() {
  const bdt = project(); // Platform Project, public, sponsored by Summit
  const privateProj = project({ id: "proj-private", title: "Private Fix", visibility: "invite", skills: ["React"] });
  const otherCoProj = project({ id: "proj-other", title: "Other Co Task", type: "company", skills: ["Testing"] });
  const closed = project({ id: "proj-closed", title: "Old", status: "closed" });

  return fakeMatchingRepository({
    candidates: [
      { candidate: candidate(), name: "Maria Santos" }, // profile only: React, REST APIs
      { candidate: candidate({ id: "cand-alex", skills: [] }), name: "Alex Kim" },
      { candidate: candidate({ id: "cand-sam", skills: [] }), name: "Sam Lee" },
      { candidate: candidate({ id: "cand-nobody", skills: ["Marketing"] }), name: "No Fit" },
    ],
    jobs: [job(), job({ id: "job-other", companyId: OTHER, title: "Other Job" })],
    projects: [bdt, privateProj, otherCoProj, closed],
    submissions: { "sub-alex": "proj-bdt", "sub-sam": "proj-other" },
    evidence: [
      evidence({ candidateId: "cand-alex", submissionId: "sub-alex", skill: "Debugging", level: "strong" }),
      evidence({ candidateId: "cand-alex", submissionId: "sub-alex", skill: "Testing", level: "strong" }),
      evidence({ candidateId: "cand-sam", submissionId: "sub-sam", skill: "Testing", level: "partial" }),
    ],
    links: [
      { companyId: SUMMIT, projectId: "proj-bdt", relationshipType: "sponsor" },
      { companyId: OTHER, projectId: "proj-other", relationshipType: "owner" },
    ],
  });
}

describe("matchingService.recommendProjectsForCandidate", () => {
  it("recommends Broken Delivery Tracker to Maria, with reasons", async () => {
    const { repo } = world();
    const results = await createMatchingService(repo).recommendProjectsForCandidate("cand-maria");
    expect(results[0].item.id).toBe("proj-bdt");
    expect(results[0].reasons.length).toBeGreaterThan(0);
  });

  it("hides invite-only and closed Projects unless invited", async () => {
    const { repo } = world();
    const ids = (await createMatchingService(repo).recommendProjectsForCandidate("cand-maria")).map((r) => r.item.id);
    expect(ids).not.toContain("proj-private");
    expect(ids).not.toContain("proj-closed");
  });

  it("includes an invite-only Project once the Candidate is invited", async () => {
    const { repo, data } = world();
    data.invitations["cand-maria"] = ["proj-private"];
    const ids = (await createMatchingService(repo).recommendProjectsForCandidate("cand-maria")).map((r) => r.item.id);
    expect(ids).toContain("proj-private");
  });

  it("returns nothing for an unknown Candidate", async () => {
    const { repo } = world();
    expect(await createMatchingService(repo).recommendProjectsForCandidate("nope")).toEqual([]);
  });
});

describe("matchingService.candidatesForJob", () => {
  it("ranks the strongest Evidence first and leaves out Candidates with no fit", async () => {
    const { repo } = world();
    const results = await createMatchingService(repo).candidatesForJob("job-swe-intern");
    const names = results.map((r) => r.item.name);
    expect(names[0]).toBe("Alex Kim");
    expect(names).not.toContain("No Fit");
  });

  it("returns names and an Evidence summary, never a score", async () => {
    const { repo } = world();
    const [alex] = await createMatchingService(repo).candidatesForJob("job-swe-intern");
    expect(Object.keys(alex).sort()).toEqual(["item", "reasons"]);
    expect(alex.item.profile.map((e) => e.skill).sort()).toEqual(["Debugging", "Testing"]);
    expect(alex.item.profile[0].projectTitle).toBe("Broken Delivery Tracker");
  });

  it("returns nothing for an unknown Job", async () => {
    const { repo } = world();
    expect(await createMatchingService(repo).candidatesForJob("nope")).toEqual([]);
  });
});

describe("matchingService.projectsForJob", () => {
  it("lists open Projects that test the Job's skills", async () => {
    const { repo } = world();
    const ids = (await createMatchingService(repo).projectsForJob("job-swe-intern")).map((r) => r.item.id);
    expect(ids[0]).toBe("proj-bdt");
    expect(ids).not.toContain("proj-closed");
  });

  it("returns nothing for an unknown Job", async () => {
    const { repo } = world();
    expect(await createMatchingService(repo).projectsForJob("nope")).toEqual([]);
  });
});

describe("matchingService.jobOverview", () => {
  it("returns null for an unknown Job", async () => {
    const { repo } = world();
    expect(await createMatchingService(repo).jobOverview("nope")).toBeNull();
  });

  it("only offers Submissions on Projects the Company owns or Sponsors", async () => {
    const { repo } = world();
    const overview = await createMatchingService(repo).jobOverview("job-swe-intern");
    expect(overview?.reviewableSubmissions["cand-alex"]).toEqual([
      { submissionId: "sub-alex", projectTitle: "Broken Delivery Tracker" },
    ]);
    // Sam's Evidence came from another Company's Project: summary yes, Submission no.
    expect(overview?.reviewableSubmissions["cand-sam"]).toBeUndefined();
    const sam = overview?.candidates.find((c) => c.item.candidate.id === "cand-sam");
    expect(sam?.item.profile[0].projectTitle).toBe("Other Co Task");
    expect(sam?.item.profile[0].submissionId).toBeUndefined();
  });

  it("bundles the Job, Candidates and Projects together", async () => {
    const { repo } = world();
    const overview = await createMatchingService(repo).jobOverview("job-swe-intern");
    expect(overview?.job.title).toBe("Software Engineering Intern");
    expect(overview?.candidates.length).toBeGreaterThan(0);
    expect(overview?.projects.length).toBeGreaterThan(0);
  });
});

describe("matchingService.listJobsForCompany", () => {
  it("returns only that Company's Jobs", async () => {
    const { repo } = world();
    const jobs = await createMatchingService(repo).listJobsForCompany(SUMMIT);
    expect(jobs.map((j) => j.id)).toEqual(["job-swe-intern"]);
  });
});
