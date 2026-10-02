import "server-only";

import { matchingRepository as repo } from "@/server/repositories/matching";
import {
  buildEvidenceProfile,
  type EvidenceProfileEntry,
} from "@/server/services/rules";
import type { Evidence, EvidenceLevel } from "@/server/models/domain";

export type { EvidenceProfileEntry } from "@/server/services/rules";

/**
 * Candidate Evidence profile: strongest level per skill across Submissions.
 * Company-reviewed beats AI-assessed on the same Submission.
 */
export interface EvidenceService {
  getProfile(candidateId: string): Promise<EvidenceProfileEntry[]>;
  /** Reviewer sets a Company-reviewed level; the AI row is kept. */
  override(
    evidenceId: string,
    level: EvidenceLevel,
    reviewerId: string,
  ): Promise<Evidence>;
  /**
   * Evidence on one Submission, one row per skill
   * (Company-reviewed replaces AI-assessed).
   */
  listForSubmission(submissionId: string): Promise<Evidence[]>;
}

export const evidenceService: EvidenceService = {
  async getProfile(candidateId) {
    const evidence = await repo.listEvidenceForCandidates([candidateId]);
    const projectsBySubmission = await repo.projectsBySubmission([
      ...new Set(evidence.map((e) => e.submissionId)),
    ]);
    return buildEvidenceProfile(evidence, projectsBySubmission);
  },

  async override(evidenceId, level, reviewerId) {
    void reviewerId; // evidence rows don't store a reviewer yet
    const original = await repo.getEvidence(evidenceId);
    if (!original) throw new Error(`Evidence ${evidenceId} not found`);
    return repo.upsertCompanyEvidence(original, level);
  },

  async listForSubmission(submissionId) {
    const rows = await repo.listEvidenceForSubmission(submissionId);
    const bySkill = new Map<string, Evidence>();
    for (const e of rows) {
      const key = e.skill.trim().toLowerCase();
      const current = bySkill.get(key);
      if (!current || (e.source === "company" && current.source !== "company")) {
        bySkill.set(key, e);
      }
    }
    return [...bySkill.values()];
  },
};
