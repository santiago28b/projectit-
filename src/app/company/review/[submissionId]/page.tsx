import { ReviewView } from "@/client/views/company/ReviewView";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  return <ReviewView submissionId={submissionId} />;
}
