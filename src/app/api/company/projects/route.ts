import type { NextRequest } from "next/server";

import { projectsController } from "@/server/controllers/projectsController";

export async function GET() {
  return projectsController.listForCompany();
}

export async function POST(request: NextRequest) {
  return projectsController.create(request);
}
