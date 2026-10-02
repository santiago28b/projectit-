import { NextResponse, type NextRequest } from "next/server";

import { requireCompany } from "@/server/controllers/auth";
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

/**
 * Review is always as the role-switcher Company admin: the reviewer and
 * Company come from the session, never from ids in the request.
 */
export const reviewController = {
  async listSubmissions(_request: NextRequest) {
    void _request;
    try {
      const auth = await requireCompany();
      if ("error" in auth) return auth.error;
      return NextResponse.json({
        submissions: await reviewService.listSubmissions(auth.userId),
      });
    } catch (error) {
      return reviewError(error);
    }
  },

  async getReviewScreen(_request: NextRequest, submissionId: string) {
    void _request;
    try {
      const auth = await requireCompany();
      if ("error" in auth) return auth.error;
      if (!uuid.test(submissionId))
        return NextResponse.json(
          { error: "Invalid review id" },
          { status: 400 },
        );
      const screen = await reviewService.getReviewScreen(
        submissionId,
        auth.userId,
      );
      return NextResponse.json(screen);
    } catch (err) {
      return reviewError(err);
    }
  },

  async updateReview(request: NextRequest, submissionId: string) {
    try {
      const auth = await requireCompany();
      if ("error" in auth) return auth.error;
      const body: unknown = await request.json();
      if (!uuid.test(submissionId) || !isObject(body)) {
        return NextResponse.json(
          { error: "A valid Submission is required" },
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
          reviewerId: auth.userId,
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
        reviewerId: auth.userId,
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
      const auth = await requireCompany();
      if ("error" in auth) return auth.error;
      const body: unknown = await request.json();
      if (
        !isObject(body) ||
        typeof body.candidateId !== "string" ||
        !uuid.test(body.candidateId) ||
        typeof body.submissionId !== "string" ||
        !uuid.test(body.submissionId) ||
        (body.jobId !== undefined &&
          (typeof body.jobId !== "string" || !uuid.test(body.jobId)))
      ) {
        return NextResponse.json(
          { error: "Valid Candidate and Submission ids are required" },
          { status: 400 },
        );
      }

      const shortlist = await reviewService.addToShortlist(
        {
          companyId: auth.companyId,
          candidateId: body.candidateId,
          jobId: body.jobId as string | undefined,
          submissionId: body.submissionId,
        },
        auth.userId,
      );
      return NextResponse.json({ shortlist }, { status: 201 });
    } catch (err) {
      if (err instanceof SyntaxError)
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      return reviewError(err);
    }
  },

  async removeFromShortlist(_request: NextRequest, shortlistId: string) {
    void _request;
    try {
      const auth = await requireCompany();
      if ("error" in auth) return auth.error;
      if (!uuid.test(shortlistId))
        return NextResponse.json(
          { error: "Shortlist entry not found" },
          { status: 404 },
        );
      await reviewService.removeFromShortlist(shortlistId, auth.companyId);
      return new NextResponse(null, { status: 204 });
    } catch (err) {
      return reviewError(err);
    }
  },
};
