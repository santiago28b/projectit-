import type { NextRequest } from "next/server";

import { submissionsController } from "@/server/controllers/submissionsController";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return submissionsController.getMine(request, id);
}
