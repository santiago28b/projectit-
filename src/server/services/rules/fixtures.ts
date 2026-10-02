import type {
  Candidate,
  Evidence,
  Job,
  Project,
} from "@/shared/models/domain";

const NOW = "2026-10-02T00:00:00Z";

export function candidate(over: Partial<Candidate> = {}): Candidate {
  return {
    id: "cand-maria",
    userId: "user-maria",
    university: "BYU",
    location: "Provo, UT",
    region: "Utah",
    skills: ["React", "REST APIs"],
    createdAt: NOW,
    updatedAt: NOW,
    ...over,
  };
}

export function project(over: Partial<Project> = {}): Project {
  return {
    id: "proj-bdt",
    title: "Broken Delivery Tracker",
    scenario: "",
    description: "",
    instructions: "",
    type: "platform",
    visibility: "public",
    visibilityTarget: null,
    expectedDurationMinutes: 90,
    difficulty: "medium",
    skills: ["TypeScript", "React", "REST APIs", "Debugging", "Testing"],
    deliverables: [],
    deadline: null,
    status: "published",
    createdBy: "platform",
    createdAt: NOW,
    updatedAt: NOW,
    ...over,
  };
}

export function job(over: Partial<Job> = {}): Job {
  return {
    id: "job-swe-intern",
    companyId: "co-summit",
    title: "Software Engineering Intern",
    description: "",
    requiredSkills: ["TypeScript", "React", "REST APIs", "Debugging", "Testing"],
    preferredSkills: [],
    status: "open",
    createdAt: NOW,
    updatedAt: NOW,
    ...over,
  };
}

let n = 0;
export function evidence(over: Partial<Evidence> = {}): Evidence {
  n += 1;
  return {
    id: `ev-${n}`,
    candidateId: "cand-maria",
    submissionId: "sub-1",
    skill: "Debugging",
    level: "partial",
    source: "ai",
    rationale: "",
    createdAt: NOW,
    updatedAt: NOW,
    ...over,
  };
}
