import "server-only";

import { db } from "@/server/lib/db";
import type { EvidenceLevel, Project, Submission } from "@/shared/models/domain";

import { domainRow } from "../mappers";

/** A run that's been "running" this long died (server restart, crash). */
const STALE_RUN = "10 minutes";

export interface AssessedEvidence {
  skill: string;
  level: EvidenceLevel;
  rationale: string;
}

/** Data access for the background Assessment of a Submission. */
export const pgAssessmentDao = {
  async load(submissionId: string): Promise<{ submission: Submission; project: Project } | null> {
    const { rows } = await db.query<Record<string, unknown>>(
      `select * from public.submissions where id = $1`,
      [submissionId],
    );
    if (!rows[0]) return null;
    const submission = domainRow<Submission>(rows[0]);
    const project = await db.query<Record<string, unknown>>(
      `select * from public.projects where id = $1`,
      [submission.projectId],
    );
    return project.rows[0] ? { submission, project: domainRow<Project>(project.rows[0]) } : null;
  },

  /**
   * Claim a pending Submission (or one whose run died) so two runs can't
   * overlap. False if another run has it.
   */
  async claim(submissionId: string): Promise<boolean> {
    const { rowCount } = await db.query(
      `update public.submissions
       set assessment_status = 'running', assessment_error = null, updated_at = now()
       where id = $1
         and (assessment_status = 'pending'
              or (assessment_status = 'running' and updated_at < now() - interval '${STALE_RUN}'))`,
      [submissionId],
    );
    return (rowCount ?? 0) > 0;
  },

  async saveTranscript(submissionId: string, transcript: string): Promise<void> {
    await db.query(`update public.submissions set transcript = $2, updated_at = now() where id = $1`, [
      submissionId,
      transcript,
    ]);
  },

  /**
   * Replace the Submission's AI-assessed Evidence and follow-up questions in one
   * transaction. Company-reviewed Evidence is never touched.
   */
  async complete(
    submissionId: string,
    result: { evidence: AssessedEvidence[]; followUpQuestions: string[] },
  ): Promise<void> {
    await db.transaction(async (client) => {
      const { rows } = await client.query<{ candidate_id: string }>(
        `update public.submissions
         set follow_up_questions = $2, assessment_status = 'done',
             assessed_at = now(), assessment_error = null, updated_at = now()
         where id = $1
         returning candidate_id`,
        [submissionId, result.followUpQuestions],
      );
      const candidateId = rows[0]?.candidate_id;
      if (!candidateId) throw new Error("Submission disappeared during its Assessment");
      await client.query(`delete from public.evidence where submission_id = $1 and source = 'ai'`, [submissionId]);
      for (const item of result.evidence) {
        await client.query(
          `insert into public.evidence (candidate_id, submission_id, skill, level, source, rationale)
           values ($1, $2, $3, $4, 'ai', $5)`,
          [candidateId, submissionId, item.skill, item.level, item.rationale],
        );
      }
    });
  },

  async fail(submissionId: string, message: string): Promise<void> {
    await db.query(
      `update public.submissions
       set assessment_status = 'failed', assessment_error = $2, updated_at = now()
       where id = $1`,
      [submissionId, message],
    );
  },

  /** Put a failed (or stuck) Assessment back in the queue. False otherwise. */
  async requeue(submissionId: string): Promise<boolean> {
    const { rowCount } = await db.query(
      `update public.submissions
       set assessment_status = 'pending', assessment_error = null, updated_at = now()
       where id = $1
         and (assessment_status = 'failed'
              or (assessment_status = 'running' and updated_at < now() - interval '${STALE_RUN}'))`,
      [submissionId],
    );
    return (rowCount ?? 0) > 0;
  },

  /** Same rule as canViewSubmission: the Company owns or Sponsors the Project. */
  async companyCanReview(submissionId: string, companyId: string): Promise<boolean> {
    const { rows } = await db.query(
      `select 1
       from public.submissions s
       join public.company_projects cp on cp.project_id = s.project_id
       where s.id = $1 and cp.company_id = $2 and cp.relationship_type in ('owner', 'sponsor')
       limit 1`,
      [submissionId, companyId],
    );
    return rows.length > 0;
  },
};

export type AssessmentDao = typeof pgAssessmentDao;
