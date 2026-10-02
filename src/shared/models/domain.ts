/** Domain types — names from CONTEXT.md */

export type UserRole = "candidate" | "company_admin" | "platform_admin";

export type ProjectType = "company" | "platform";

export type ProjectVisibility = "public" | "university" | "region" | "invite";

export type ProjectStatus = "draft" | "published" | "closed";

export type CompanyProjectRelationship = "owner" | "sponsor";

export type JobStatus = "open" | "closed";

export type SubmissionStatus = "submitted" | "under_review" | "completed";

/** Progress of the AI's background Assessment (separate from the human review). */
export type AssessmentStatus = "pending" | "running" | "done" | "failed";

/** The background Assessment hasn't finished yet. */
export function isAssessing(status: AssessmentStatus | undefined): boolean {
  return status === "pending" || status === "running";
}

export type EvidenceLevel =
  | "strong"
  | "partial"
  | "not_shown"
  | "not_assessed";

export type EvidenceSource = "ai" | "company";

export type InvitationStatus = "pending" | "accepted" | "expired";

export type MatchType =
  | "candidate_project"
  | "job_candidate"
  | "job_project";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Set for company_admin users; null for Candidates */
  companyId: string | null;
  profileData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Who the role switcher says is looking (cookie-based demo identity). */
export interface CurrentUser {
  user: User;
  candidate: Candidate | null;
  company: Company | null;
}

/** One row in the role switcher dropdown. */
export interface SwitcherAccount {
  userId: string;
  name: string;
  role: UserRole;
  companyName: string | null;
}

export interface Company {
  id: string;
  name: string;
  description: string;
  logoUrl: string | null;
  website: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
  id: string;
  userId: string;
  university: string | null;
  location: string | null;
  region: string | null;
  skills: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RubricCriterion {
  name: string;
  description: string;
}

export interface Project {
  id: string;
  title: string;
  scenario: string;
  description: string;
  instructions: string;
  type: ProjectType;
  visibility: ProjectVisibility;
  visibilityTarget: string | null;
  expectedDurationMinutes: number | null;
  difficulty: string | null;
  skills: string[];
  deliverables: string[];
  deadline: string | null;
  status: ProjectStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  companyId: string;
  title: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  projectId: string;
  candidateId: string;
  writtenResponse: string;
  repositoryUrl: string | null;
  fileUrls: string[];
  /** Walkthrough video URL — required to submit */
  videoUrl: string;
  followUpQuestions: string[];
  status: SubmissionStatus;
  /** What the Candidate says in their Walkthrough, once transcribed. */
  transcript: string | null;
  assessmentStatus: AssessmentStatus;
  assessedAt: string | null;
  /** Short, reviewer-safe reason the last Assessment failed. */
  assessmentError: string | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Evidence {
  id: string;
  candidateId: string;
  submissionId: string;
  skill: string;
  level: EvidenceLevel;
  source: EvidenceSource;
  rationale: string;
  createdAt: string;
  updatedAt: string;
}

export interface Evaluation {
  id: string;
  submissionId: string;
  reviewerId: string;
  rubricResults: Record<string, unknown>;
  notes: string;
  interviewRecommended: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  id: string;
  projectId: string;
  candidateId: string;
  invitedBy: string;
  status: InvitationStatus;
  createdAt: string;
  updatedAt: string;
}

/** Qualitative reasons only — never a percentage */
export interface Match {
  id: string;
  type: MatchType;
  sourceId: string;
  targetId: string;
  reasons: string[];
  createdAt: string;
}

export interface Shortlist {
  id: string;
  companyId: string;
  candidateId: string;
  jobId: string | null;
  submissionId: string | null;
  createdAt: string;
}
