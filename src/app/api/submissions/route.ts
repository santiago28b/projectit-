import type { NextRequest } from "next/server";

import { submissionsController } from "@/server/controllers/submissionsController";

export async function POST(request: NextRequest) {
  return submissionsController.create(request);
}
