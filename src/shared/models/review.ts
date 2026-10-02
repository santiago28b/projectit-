import type {
  Candidate,
  Company,
  Evidence,
  Evaluation,
  EvidenceLevel,
  Project,
  RubricCriterion,
  Shortlist,
  Submission,
  User,
} from "./domain";

export const evidenceLevels: EvidenceLevel[] = [
  "strong",
  "partial",
  "not_shown",
  "not_assessed",
];

export interface ReviewScreenData {
  submission: Submission;
  candidate: Candidate;
  candidateName: string;
  project: Project;
  company: Company;
  reviewer: Pick<User, "id" | "name">;
  rubric: RubricCriterion[];
  evidence: Evidence[];
  evaluation: Evaluation | null;
  followUpQuestions: string[];
  shortlist: Shortlist | null;
}

export interface SaveEvaluationInput {
  submissionId: string;
  reviewerId: string;
  rubricResults: Record<string, unknown>;
  notes: string;
  interviewRecommended: boolean;
}

export interface ShortlistInput {
  companyId: string;
  candidateId: string;
  jobId?: string;
  submissionId?: string;
}

export function effectiveEvidence(rows: Evidence[]): Evidence[] {
  const bySkill = new Map<string, Evidence>();
  for (const row of rows) {
    const current = bySkill.get(row.skill);
    if (
      !current ||
      (row.source === "company" && current.source === "ai") ||
      (row.source === current.source && row.updatedAt > current.updatedAt)
    ) {
      bySkill.set(row.skill, row);
    }
  }
  return [...bySkill.values()];
}

export function safeExternalUrl(value: string | null): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
