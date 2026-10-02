import { NextResponse, type NextRequest } from "next/server";

import { jsonError } from "@/server/controllers/http";
import { noCandidate } from "@/server/controllers/projectsController";
import { runInBackground } from "@/server/lib/background";
import { getCurrentCandidate } from "@/server/lib/currentUser";
import { assessmentService } from "@/server/services/assessment";
import { SubmissionError, submissionsService } from "@/server/services/submissions";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

export const submissionsController = {
  /** Submit as the role-switcher Candidate (never a candidateId from the body). */
  async create(request: NextRequest) {
    try {
      const candidate = await getCurrentCandidate();
      if (!candidate) return noCandidate();

      const body: unknown = await request.json();
      if (!isObject(body) || typeof body.projectId !== "string" || !uuid.test(body.projectId)) {
        return NextResponse.json({ error: "A valid Project is required" }, { status: 400 });
      }
      const fileUrls = Array.isArray(body.fileUrls)
        ? body.fileUrls.filter((url): url is string => typeof url === "string")
        : undefined;

      const submission = await submissionsService.submit(candidate, {
        projectId: body.projectId,
        writtenResponse: optionalString(body.writtenResponse) ?? "",
        repositoryUrl: optionalString(body.repositoryUrl),
        fileUrls,
        videoUrl: optionalString(body.videoUrl) ?? "",
      });
      // Transcribe, read the repo and assess after the response is sent.
      runInBackground(() => assessmentService.run(submission.id));
      return NextResponse.json({ submission: { id: submission.id } }, { status: 201 });
    } catch (err) {
      if (err instanceof SyntaxError)
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      if (err instanceof SubmissionError)
        return NextResponse.json({ error: err.message }, { status: err.status });
      return jsonError(err);
    }
  },

  async listMine(_request: NextRequest) {
    void _request;
    try {
      const candidate = await getCurrentCandidate();
      if (!candidate) return noCandidate();
      return NextResponse.json({ submissions: await submissionsService.listMine(candidate) });
    } catch (err) {
      return jsonError(err);
    }
  },

  async getMine(_request: NextRequest, submissionId: string) {
    void _request;
    try {
      const candidate = await getCurrentCandidate();
      if (!candidate) return noCandidate();
      const view = uuid.test(submissionId)
        ? await submissionsService.getMine(submissionId, candidate)
        : null;
      if (!view) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
      return NextResponse.json(view);
    } catch (err) {
      return jsonError(err);
    }
  },
};
