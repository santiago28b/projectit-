import { NextResponse, type NextRequest } from "next/server";

import { jsonError, requireQueryParam } from "@/server/controllers/http";
import { matchingService } from "@/server/services/matching";

export const matchingController = {
  async recommendForCandidate(request: NextRequest) {
    try {
      const url = new URL(request.url);
      const candidateId = requireQueryParam(url, "candidateId");
      if (candidateId instanceof NextResponse) return candidateId;

      const recommendations =
        await matchingService.recommendProjectsForCandidate(candidateId);
      return NextResponse.json({ recommendations });
    } catch (err) {
      return jsonError(err);
    }
  },

  async jobOverview(jobId: string) {
    try {
      const overview = await matchingService.jobOverview(jobId);
      if (!overview) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      return NextResponse.json({ overview });
    } catch (err) {
      return jsonError(err);
    }
  },
};
