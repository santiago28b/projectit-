import type { NextRequest } from "next/server";

import { uploadsController } from "@/server/controllers/uploadsController";

type RouteContext = { params: Promise<{ name: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { name } = await context.params;
  return uploadsController.read(request, name);
}
