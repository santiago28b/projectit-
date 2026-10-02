import { CompanyJobsList } from "@/client/components/CompanyJobsList";
import { CompanyPortalView } from "@/client/views/company/CompanyPortalView";
import { getCurrentUser } from "@/server/lib/currentUser";
import { matchingService } from "@/server/services/matching";

export default async function CompanyPage() {
  const current = await getCurrentUser();
  const jobs = current?.company
    ? await matchingService.listJobsForCompany(current.company.id)
    : [];

  return (
    <CompanyPortalView
      name={current?.user.name ?? null}
      companyName={current?.company?.name ?? null}
    >
      <CompanyJobsList jobs={jobs} />
    </CompanyPortalView>
  );
}
