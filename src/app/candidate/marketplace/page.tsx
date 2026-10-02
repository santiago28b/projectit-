import { MarketplaceView } from "@/client/views/candidate/MarketplaceView";

// Ticket 04: pass <RecommendedProjects candidateId={...} /> as `recommended`,
// with the id from getCurrentCandidate() in @/server/lib/currentUser.
export default function MarketplacePage() {
  return <MarketplaceView />;
}
