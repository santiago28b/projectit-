import { RecommendedProjects } from "@/client/components/RecommendedProjects";
import { MarketplaceView } from "@/client/views/candidate/MarketplaceView";
import { getCurrentCandidate } from "@/server/lib/currentUser";

export default async function MarketplacePage() {
  const candidate = await getCurrentCandidate();

  return (
    <MarketplaceView
      recommended={
        <RecommendedProjects
          candidateId={candidate?.id ?? null}
          projectHref={(id) => `/candidate/projects/${id}`}
        />
      }
    />
  );
}
