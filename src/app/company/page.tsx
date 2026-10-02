import { getCurrentUser } from "@/server/lib/currentUser";
import { CompanyPortalView } from "@/client/views/company/CompanyPortalView";

export default async function CompanyPage() {
  const current = await getCurrentUser();
  return (
    <CompanyPortalView
      name={current?.user.name ?? null}
      companyName={current?.company?.name ?? null}
    />
  );
}
