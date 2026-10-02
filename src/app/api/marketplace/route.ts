import type { NextRequest } from "next/server";

import { projectsController } from "@/server/controllers/projectsController";

export async function GET(request: NextRequest) {
  return projectsController.listMarketplace(request);
}
