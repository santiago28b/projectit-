import type {
  Evidence,
  EvidenceLevel,
  EvidenceSource,
} from "@/server/models/domain";

export interface EvidenceProfileEntry {
  skill: string;
  level: EvidenceLevel;
  source: EvidenceSource;
  projectId: string;
  projectTitle: string;
}

/**
 * Candidate Evidence profile: strongest level per skill across Submissions.
 * Company-reviewed beats AI-assessed on the same Submission.
 */
export interface EvidenceService {
  getProfile(candidateId: string): Promise<EvidenceProfileEntry[]>;
  override(
    evidenceId: string,
    level: EvidenceLevel,
    reviewerId: string,
  ): Promise<Evidence>;
  listForSubmission(submissionId: string): Promise<Evidence[]>;
}

export const evidenceService: EvidenceService = {
  async getProfile() {
    throw new Error("evidenceService.getProfile not implemented");
  },
  async override() {
    throw new Error("evidenceService.override not implemented");
  },
  async listForSubmission() {
    throw new Error("evidenceService.listForSubmission not implemented");
  },
};
