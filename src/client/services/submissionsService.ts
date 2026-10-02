import {
  submissionsRepo,
  type SubmitProjectInput,
} from "@/client/repos/submissionsRepo";

export type { SubmitProjectInput };

export const submissionsService = {
  submit(input: SubmitProjectInput, signal?: AbortSignal) {
    return submissionsRepo.submit(input, signal);
  },
};
