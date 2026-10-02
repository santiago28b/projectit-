import {
  submissionsRepo,
  type SubmitProjectInput,
} from "@/client/repos/submissionsRepo";
import { uploadsRepo, type UploadKind } from "@/client/repos/uploadsRepo";

export type { SubmitProjectInput };

export const submissionsService = {
  submit(input: SubmitProjectInput, signal?: AbortSignal) {
    return submissionsRepo.submit(input, signal);
  },

  listMine(signal?: AbortSignal) {
    return submissionsRepo.listMine(signal);
  },

  getMine(submissionId: string, signal?: AbortSignal) {
    return submissionsRepo.getMine(submissionId, signal);
  },

  upload(file: File, kind: UploadKind, onProgress?: (fraction: number) => void) {
    return uploadsRepo.upload(file, kind, onProgress);
  },
};
