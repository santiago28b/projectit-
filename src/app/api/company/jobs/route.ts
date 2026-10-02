import type { NextRequest } from "next/server";

import { jobsController } from "@/server/controllers/jobsController";

export async function POST(request: NextRequest) {
  return jobsController.create(request);
}
