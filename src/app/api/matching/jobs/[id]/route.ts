import type { NextRequest } from "next/server";

import { matchingController } from "@/server/controllers/matchingController";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return matchingController.jobOverview(id);
}
