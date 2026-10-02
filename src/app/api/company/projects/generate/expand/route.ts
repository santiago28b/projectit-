import type { NextRequest } from "next/server";

import { aiProjectsController } from "@/server/controllers/aiProjectsController";

export async function POST(request: NextRequest) {
  return aiProjectsController.expandIdea(request);
}
