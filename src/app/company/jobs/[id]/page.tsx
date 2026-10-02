import { JobMatchesView } from "@/client/views/company/JobMatchesView";

export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <JobMatchesView jobId={id} />;
}
