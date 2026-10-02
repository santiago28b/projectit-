import { WorkspaceView } from "@/client/views/candidate/WorkspaceView";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WorkspaceView projectId={id} />;
}
