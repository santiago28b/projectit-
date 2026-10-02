import { NextResponse, type NextRequest } from "next/server";

import { requireCompany } from "@/server/controllers/auth";
import { jsonError } from "@/server/controllers/http";
import { noCandidate } from "@/server/controllers/projectsController";
import { getCurrentCandidate } from "@/server/lib/currentUser";
import { matchingService } from "@/server/services/matching";

export const matchingController = {
  /** Recommendations for the role-switcher Candidate (never a candidateId from the query). */
  async recommendForCandidate(_request: NextRequest) {
    void _request;
    try {
      const candidate = await getCurrentCandidate();
      if (!candidate) return noCandidate();

      const recommendations =
        await matchingService.recommendProjectsForCandidate(candidate.id);
      return NextResponse.json({ recommendations });
    } catch (err) {
      return jsonError(err);
    }
  },

  /** A Job page is only for the Company that owns the Job. */
  async jobOverview(jobId: string) {
    try {
      const auth = await requireCompany();
      if ("error" in auth) return auth.error;
      const overview = await matchingService.jobOverview(jobId);
      if (!overview || overview.job.companyId !== auth.companyId) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      return NextResponse.json({ overview });
    } catch (err) {
      return jsonError(err);
    }
  },
};
