import { MyEvidenceView } from "@/client/views/candidate/MyEvidenceView";

export default async function MyEvidencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MyEvidenceView submissionId={id} />;
}
