import type { NextRequest } from "next/server";

import { uploadsController } from "@/server/controllers/uploadsController";

export async function POST(request: NextRequest) {
  return uploadsController.create(request);
}
