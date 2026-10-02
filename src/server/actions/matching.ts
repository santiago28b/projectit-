"use server";

import { matchingService } from "@/server/services/matching";

/** Server actions for matching (owned by Person C; kept apart from actions/index.ts). */

export async function jobOverviewAction(jobId: string) {
  return matchingService.jobOverview(jobId);
}
