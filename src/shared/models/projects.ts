import type {
  CompanyProjectRelationship,
  Evidence,
  Project,
  RubricCriterion,
  Submission,
} from "./domain";

/** A starter file or reference link shown in the workspace. */
export interface ProjectResource {
  label: string;
  url: string;
  kind: "starter" | "reference";
}

/** A Company that owns or Sponsors a Project. */
export interface ProjectCompany {
  id: string;
  name: string;
  relationship: CompanyProjectRelationship;
}

/** A Marketplace card: the Project plus who owns or Sponsors it. */
export interface ProjectCard extends Project {
  companies: ProjectCompany[];
}

/** Project detail and workspace data for one Candidate. */
export interface ProjectDetail extends ProjectCard {
  resources: ProjectResource[];
  rubric: RubricCriterion[];
  /** The Candidate's Submission to this Project, if they already submitted. */
  mySubmissionId: string | null;
}

/** One row on the Candidate dashboard's Submitted list. */
export interface MySubmissionSummary {
  id: string;
  projectId: string;
  projectTitle: string;
  submittedAt: string;
}

/**
 * What a Candidate sees about their own Submission. Follow-up questions are
 * left out on purpose: they're for the Company's interview.
 */
export interface MySubmissionView {
  submission: Omit<Submission, "followUpQuestions">;
  project: Pick<Project, "id" | "title" | "skills">;
  evidence: Evidence[];
}

/** Input from the workspace form. The Candidate comes from the session. */
export interface SubmitProjectInput {
  projectId: string;
  writtenResponse: string;
  repositoryUrl?: string;
  fileUrls?: string[];
  videoUrl: string;
}
