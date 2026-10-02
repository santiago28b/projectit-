import type { NextRequest } from "next/server";

import { assessmentController } from "@/server/controllers/assessmentController";

/** Retry a failed Assessment (reviewing Company only). */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return assessmentController.retry(request, id);
}
