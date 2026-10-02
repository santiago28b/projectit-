import { NextResponse, type NextRequest } from "next/server";

import { requireCompany } from "@/server/controllers/auth";
import { jsonError } from "@/server/controllers/http";
import { runInBackground } from "@/server/lib/background";
import { AssessmentError, assessmentService } from "@/server/services/assessment";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const assessmentController = {
  /** POST: a reviewing Company retries a failed Assessment. */
  async retry(_request: NextRequest, submissionId: string) {
    void _request;
    try {
      const auth = await requireCompany();
      if ("error" in auth) return auth.error;
      if (!uuid.test(submissionId))
        return NextResponse.json({ error: "Submission not found" }, { status: 404 });

      await assessmentService.requestRetry(submissionId, auth.companyId);
      runInBackground(() => assessmentService.run(submissionId));
      return NextResponse.json({ assessmentStatus: "pending" }, { status: 202 });
    } catch (err) {
      if (err instanceof AssessmentError)
        return NextResponse.json({ error: err.message }, { status: err.status });
      return jsonError(err);
    }
  },
};
