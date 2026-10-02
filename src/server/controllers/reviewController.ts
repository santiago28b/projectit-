import { NextResponse, type NextRequest } from "next/server";

import { jsonError } from "@/server/controllers/http";
import { reviewService } from "@/server/services/review";

export const reviewController = {
  async getReviewScreen(_request: NextRequest, submissionId: string) {
    try {
      const screen = await reviewService.getReviewScreen(submissionId);
      return NextResponse.json(screen);
    } catch (err) {
      return jsonError(err);
    }
  },

  async addToShortlist(request: NextRequest) {
    try {
      const body = (await request.json()) as {
        companyId?: string;
        candidateId?: string;
        jobId?: string;
        submissionId?: string;
      };

      if (!body.companyId || !body.candidateId) {
        return NextResponse.json(
          { error: "companyId and candidateId are required" },
          { status: 400 },
        );
      }

      const shortlist = await reviewService.addToShortlist({
        companyId: body.companyId,
        candidateId: body.candidateId,
        jobId: body.jobId,
        submissionId: body.submissionId,
      });
      return NextResponse.json({ shortlist }, { status: 201 });
    } catch (err) {
      return jsonError(err);
    }
  },
};
