import "server-only";

import { createJob } from "@/server/repositories/companyDashboard";
import { normalizeJobInput } from "@/server/services/rules/jobInput";
import type { Job } from "@/shared/models/domain";
import type { CreateJobInput } from "@/shared/models/jobs";

export const jobsService = {
  /** Create an open Job for the Company. Matching picks it up immediately. */
  create(companyId: string, input: CreateJobInput): Promise<Job> {
    return createJob(companyId, normalizeJobInput(input));
  },
};
