import { MarketplaceView } from "@/client/views/candidate/MarketplaceView";
import { getCurrentUser } from "@/server/lib/currentUser";

export default async function MarketplacePage() {
  const current = await getCurrentUser();
  return <MarketplaceView candidateId={current?.candidate?.id ?? null} />;
}
