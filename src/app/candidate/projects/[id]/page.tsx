import { ProjectDetailView } from "@/client/views/candidate/ProjectDetailView";
import { getCurrentCandidate } from "@/server/lib/currentUser";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = await getCurrentCandidate();
  return <ProjectDetailView projectId={id} isGuest={!candidate} />;
}
