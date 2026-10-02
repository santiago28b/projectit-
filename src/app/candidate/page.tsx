import { getCurrentUser } from "@/server/lib/currentUser";
import { CandidatePortalView } from "@/client/views/candidate/CandidatePortalView";

export default async function CandidatePage() {
  const current = await getCurrentUser();
  return <CandidatePortalView name={current?.user.name ?? null} />;
}
