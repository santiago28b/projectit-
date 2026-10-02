import { RecommendedProjects } from "@/client/components/RecommendedProjects";
import { MarketplaceView } from "@/client/views/candidate/MarketplaceView";
import { getCurrentCandidate } from "@/server/lib/currentUser";

export default async function MarketplacePage() {
  const candidate = await getCurrentCandidate();
  const isGuest = !candidate;

  return (
    <MarketplaceView
      isGuest={isGuest}
      recommended={
        isGuest ? undefined : (
          <RecommendedProjects candidateId={candidate.id} />
        )
      }
    />
  );
}
