import type { NextRequest } from "next/server";

import { projectsController } from "@/server/controllers/projectsController";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return projectsController.sponsor(request, id);
}
