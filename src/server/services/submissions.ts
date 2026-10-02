import type { Evidence, Submission } from "@/server/models/domain";

/**
 * Submit work (Walkthrough required; one Submission per Project),
 * then run AI evaluation for Evidence and follow-up questions.
 */
export interface SubmissionsService {
  submit(input: {
    projectId: string;
    candidateId: string;
    writtenResponse: string;
    repositoryUrl?: string;
    fileUrls?: string[];
    videoUrl: string;
  }): Promise<Submission>;
  getById(submissionId: string): Promise<Submission | null>;
  listForProject(projectId: string): Promise<Submission[]>;
}

export const submissionsService: SubmissionsService = {
  async submit() {
    throw new Error("submissionsService.submit not implemented");
  },
  async getById() {
    throw new Error("submissionsService.getById not implemented");
  },
  async listForProject() {
    throw new Error("submissionsService.listForProject not implemented");
  },
};

export type { Evidence };
