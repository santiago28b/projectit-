import type { NextRequest } from "next/server";

import { reviewController } from "@/server/controllers/reviewController";

type RouteContext = { params: Promise<{ submissionId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { submissionId } = await context.params;
  return reviewController.getReviewScreen(request, submissionId);
}
