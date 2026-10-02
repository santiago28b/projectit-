import type { NextRequest } from "next/server";

import { reviewController } from "@/server/controllers/reviewController";

export async function POST(request: NextRequest) {
  return reviewController.addToShortlist(request);
}
