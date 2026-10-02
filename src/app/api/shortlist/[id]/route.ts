import type { NextRequest } from "next/server";

import { reviewController } from "@/server/controllers/reviewController";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return reviewController.removeFromShortlist(request, id);
}
