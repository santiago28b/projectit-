import type { NextRequest } from "next/server";
import { reviewController } from "@/server/controllers/reviewController";

export async function GET(request: NextRequest) {
  return reviewController.listSubmissions(request);
}
