import type {
  Candidate,
  Evidence,
  Job,
  Project,
} from "@/shared/models/domain";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Row = Record<string, any>;

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : String(value ?? "");
}

export function toCandidate(r: Row): Candidate {
  return {
    id: r.id,
    userId: r.user_id,
    university: r.university ?? null,
    location: r.location ?? null,
    region: r.region ?? null,
    skills: r.skills ?? [],
    createdAt: toIso(r.created_at),
    updatedAt: toIso(r.updated_at),
  };
}

export function toProject(r: Row): Project {
  return {
    id: r.id,
    title: r.title,
    scenario: r.scenario ?? "",
    description: r.description ?? "",
    instructions: r.instructions ?? "",
    type: r.type,
    visibility: r.visibility,
    visibilityTarget: r.visibility_target ?? null,
    expectedDurationMinutes: r.expected_duration_minutes ?? null,
    difficulty: r.difficulty ?? null,
    skills: r.skills ?? [],
    deliverables: r.deliverables ?? [],
    deadline: r.deadline == null ? null : toIso(r.deadline),
    status: r.status,
    createdBy: r.created_by,
    createdAt: toIso(r.created_at),
    updatedAt: toIso(r.updated_at),
  };
}

export function toJob(r: Row): Job {
  return {
    id: r.id,
    companyId: r.company_id,
    title: r.title,
    description: r.description ?? "",
    requiredSkills: r.required_skills ?? [],
    preferredSkills: r.preferred_skills ?? [],
    status: r.status,
    createdAt: toIso(r.created_at),
    updatedAt: toIso(r.updated_at),
  };
}

export function toEvidence(r: Row): Evidence {
  return {
    id: r.id,
    candidateId: r.candidate_id,
    submissionId: r.submission_id,
    skill: r.skill,
    level: r.level,
    source: r.source,
    rationale: r.rationale ?? "",
    createdAt: toIso(r.created_at),
    updatedAt: toIso(r.updated_at),
  };
}
