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
};
