import "server-only";

import { getCurrentUser } from "@/server/lib/currentUser";
import {
  listJobsForCompany,
  listShortlistForCompany,
} from "@/server/repositories/companyDashboard";
import { projectsService } from "@/server/services/projects";
import { reviewService } from "@/server/services/review";
import type { CompanyDashboard } from "@/shared/models/companyDashboard";

export async function getCompanyDashboard(): Promise<CompanyDashboard | null> {
  const current = await getCurrentUser();
  if (!current || current.user.role !== "company_admin" || !current.company) {
    return null;
  }

  const companyId = current.company.id;
  const [projects, sponsorable, submissions, jobs, shortlist] =
    await Promise.all([
      projectsService.listForCompany(companyId),
      projectsService.listSponsorable(companyId),
      reviewService.listSubmissions(current.user.id),
      listJobsForCompany(companyId),
      listShortlistForCompany(companyId),
    ]);

  return {
    companyName: current.company.name,
    userName: current.user.name,
    projects,
    sponsorableCount: sponsorable.length,
    jobs,
    submissions: submissions.slice(0, 8),
    shortlist: shortlist.slice(0, 8),
  };
}
