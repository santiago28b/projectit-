import type {
  CompanyProjectRelationship,
  Project,
  ProjectStatus,
  ProjectVisibility,
  RubricCriterion,
  SubmissionStatus,
} from "@/shared/models/domain";

/** Form / API payload to create a Company Project. */
export interface CreateProjectInput {
  title: string;
  scenario: string;
  description?: string;
  instructions: string;
  skills: string[];
  expectedDurationMinutes: number | null;
  difficulty: string | null;
  deliverables: string[];
  deadline: string | null;
  visibility: ProjectVisibility;
  visibilityTarget: string | null;
  rubric: RubricCriterion[];
  /** When true, status is published immediately. */
  publish?: boolean;
}

export interface CompanyProjectListItem {
  project: Project;
  relationshipType: CompanyProjectRelationship;
  sponsorNames: string[];
  invitedCount: number;
  submittedCount: number;
}

export interface ProjectSubmissionEntry {
  id: string;
  candidateName: string;
  submittedAt: string;
  status: SubmissionStatus;
}

export interface ProjectDashboard {
  project: Project;
  relationshipType: CompanyProjectRelationship;
  sponsorNames: string[];
  invitedCount: number;
  submittedCount: number;
  rubric: RubricCriterion[];
  submissions: ProjectSubmissionEntry[];
}

export interface SponsorableProject {
  project: Project;
  existingSponsorNames: string[];
}

export type { ProjectStatus };
