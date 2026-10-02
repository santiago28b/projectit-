import type { NextRequest } from "next/server";

import { sessionController } from "@/server/controllers/sessionController";

export async function GET() {
  return sessionController.current();
}

export async function POST(request: NextRequest) {
  return sessionController.switchTo(request);
}
