import { apiFetch } from "@/client/repos/http";
import type { Job } from "@/shared/models/domain";
import type { CreateJobInput } from "@/shared/models/jobs";

export const jobsRepo = {
  create(input: CreateJobInput) {
    return apiFetch<{ job: Job }>("/api/company/jobs", {
      method: "POST",
      body: JSON.stringify(input),
    }).then((data) => data.job);
  },
};
