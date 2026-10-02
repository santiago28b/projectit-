import { NextResponse, type NextRequest } from "next/server";

import { jsonError } from "@/server/controllers/http";
import { reviewService } from "@/server/services/review";
import { evidenceLevels } from "@/shared/models/review";
import type { EvidenceLevel } from "@/shared/models/domain";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function reviewError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  if (/owns or Sponsors|does not match|another Company/.test(message))
    return jsonError(error, 403);
  if (/Invalid|not part|is required/.test(message))
    return jsonError(error, 400);
  return jsonError(error);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const reviewController = {
  async listSubmissions(request: NextRequest) {
    try {
      const reviewerId =
        request.nextUrl.searchParams.get("reviewerId") ?? undefined;
      if (reviewerId && !uuid.test(reviewerId))
        return NextResponse.json(
          { error: "Invalid reviewer id" },
          { status: 400 },
        );
      return NextResponse.json({
        submissions: await reviewService.listSubmissions(reviewerId),
      });
    } catch (error) {
      return reviewError(error);
    }
  },

  async getReviewScreen(request: NextRequest, submissionId: string) {
    try {
      const reviewerId =
        request.nextUrl.searchParams.get("reviewerId") ?? undefined;
      if (!uuid.test(submissionId) || (reviewerId && !uuid.test(reviewerId)))
        return NextResponse.json(
          { error: "Invalid review id" },
          { status: 400 },
        );
      const screen = await reviewService.getReviewScreen(
        submissionId,
        reviewerId,
      );
      return NextResponse.json(screen);
    } catch (err) {
      return reviewError(err);
    }
  },

  async updateReview(request: NextRequest, submissionId: string) {
    try {
      const body: unknown = await request.json();
      if (
        !uuid.test(submissionId) ||
        !isObject(body) ||
        typeof body.reviewerId !== "string" ||
        !uuid.test(body.reviewerId)
      ) {
        return NextResponse.json(
          { error: "A valid Submission and reviewer are required" },
          { status: 400 },
        );
      }
      if (body.action === "override") {
        if (
          typeof body.skill !== "string" ||
          !body.skill.trim() ||
          !evidenceLevels.includes(body.level as EvidenceLevel) ||
          typeof body.rationale !== "string"
        ) {
          return NextResponse.json(
            { error: "Skill, Evidence level and rationale are required" },
            { status: 400 },
          );
        }
        const evidence = await reviewService.override({
          submissionId,
          reviewerId: body.reviewerId,
          skill: body.skill,
          level: body.level as EvidenceLevel,
          rationale: body.rationale,
        });
        return NextResponse.json({ evidence });
      }
      if (
        body.action !== "evaluation" ||
        !isObject(body.rubricResults) ||
        typeof body.notes !== "string" ||
        typeof body.interviewRecommended !== "boolean"
      ) {
        return NextResponse.json(
          {
            error:
              "Rubric results, notes and interview recommendation are required",
          },
          { status: 400 },
        );
      }
      const evaluation = await reviewService.saveEvaluation({
        submissionId,
        reviewerId: body.reviewerId,
        rubricResults: body.rubricResults,
        notes: body.notes,
        interviewRecommended: body.interviewRecommended,
      });
      return NextResponse.json({ evaluation });
    } catch (error) {
      if (error instanceof SyntaxError)
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      return reviewError(error);
    }
  },

  async addToShortlist(request: NextRequest) {
    try {
      const body: unknown = await request.json();
      if (
        !isObject(body) ||
        typeof body.companyId !== "string" ||
        !uuid.test(body.companyId) ||
        typeof body.candidateId !== "string" ||
        !uuid.test(body.candidateId) ||
        typeof body.submissionId !== "string" ||
        !uuid.test(body.submissionId) ||
        typeof body.reviewerId !== "string" ||
        !uuid.test(body.reviewerId) ||
        (body.jobId !== undefined &&
          (typeof body.jobId !== "string" || !uuid.test(body.jobId)))
      ) {
        return NextResponse.json(
          {
            error:
              "Valid Company, Candidate, Submission and reviewer ids are required",
          },
          { status: 400 },
        );
      }

      const shortlist = await reviewService.addToShortlist(
        {
          companyId: body.companyId,
          candidateId: body.candidateId,
          jobId: body.jobId as string | undefined,
          submissionId: body.submissionId,
        },
        body.reviewerId,
      );
      return NextResponse.json({ shortlist }, { status: 201 });
    } catch (err) {
      if (err instanceof SyntaxError)
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      return reviewError(err);
    }
  },
};
