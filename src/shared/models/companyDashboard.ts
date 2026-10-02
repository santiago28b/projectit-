import type { Job } from "@/shared/models/domain";
import type { CompanyProjectListItem } from "@/shared/models/projects";

export interface DashboardSubmission {
  id: string;
  candidateName: string;
  projectTitle: string;
  submittedAt: string;
}

export interface DashboardShortlistEntry {
  id: string;
  candidateName: string;
  jobTitle: string | null;
}

export interface CompanyDashboard {
  companyName: string;
  userName: string;
  projects: CompanyProjectListItem[];
  sponsorableCount: number;
  jobs: Job[];
  submissions: DashboardSubmission[];
  shortlist: DashboardShortlistEntry[];
}
