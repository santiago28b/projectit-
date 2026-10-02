import type { NextRequest } from "next/server";

import { matchingController } from "@/server/controllers/matchingController";

export async function GET(request: NextRequest) {
  return matchingController.recommendForCandidate(request);
}
