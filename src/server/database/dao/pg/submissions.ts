import "server-only";

import { db } from "@/server/lib/db";
import type {
  Evidence,
  EvidenceLevel,
  Project,
  Submission,
} from "@/shared/models/domain";
import type { MySubmissionSummary } from "@/shared/models/projects";

import { domainRow } from "../mappers";

export interface NewSubmission {
  projectId: string;
  candidateId: string;
  writtenResponse: string;
  repositoryUrl: string | null;
  fileUrls: string[];
  videoUrl: string;
  followUpQuestions: string[];
  evidence: { skill: string; level: EvidenceLevel; rationale: string }[];
}

export const pgSubmissionsDao = {
  async findId(projectId: string, candidateId: string): Promise<string | null> {
    const { rows } = await db.query<{ id: string }>(
      `select id from public.submissions where project_id = $1 and candidate_id = $2`,
      [projectId, candidateId],
    );
    return rows[0]?.id ?? null;
  },

  async findProject(projectId: string): Promise<Project | null> {
    const { rows } = await db.query<Record<string, unknown>>(
      `select * from public.projects where id = $1`,
      [projectId],
    );
    return rows[0] ? domainRow<Project>(rows[0]) : null;
  },

  /**
   * The Submission plus one AI-assessed Evidence row per skill, in one
   * transaction. A second Submission to the same Project fails on the
   * unique (project_id, candidate_id) constraint with code 23505.
   */
  async createWithEvidence(input: NewSubmission): Promise<Submission> {
    return db.transaction(async (client) => {
      const { rows } = await client.query<Record<string, unknown>>(
        `insert into public.submissions (
           project_id, candidate_id, written_response, repository_url,
           file_urls, video_url, follow_up_questions
         ) values ($1, $2, $3, $4, $5, $6, $7)
         returning *`,
        [
          input.projectId,
          input.candidateId,
          input.writtenResponse,
          input.repositoryUrl,
          input.fileUrls,
          input.videoUrl,
          input.followUpQuestions,
        ],
      );
      const submission = domainRow<Submission>(rows[0]);
      for (const item of input.evidence) {
        await client.query(
          `insert into public.evidence (
             candidate_id, submission_id, skill, level, source, rationale
           ) values ($1, $2, $3, $4, 'ai', $5)`,
          [input.candidateId, submission.id, item.skill, item.level, item.rationale],
        );
      }
      return submission;
    });
  },

  async listMine(candidateId: string): Promise<MySubmissionSummary[]> {
    const { rows } = await db.query<Record<string, unknown>>(
      `select s.id, s.project_id, p.title as project_title, s.submitted_at
       from public.submissions s
       join public.projects p on p.id = s.project_id
       where s.candidate_id = $1
       order by s.submitted_at desc`,
      [candidateId],
    );
    return rows.map((row) => domainRow<MySubmissionSummary>(row));
  },

  /** One of the Candidate's own Submissions with its Project and Evidence. */
  async findMine(submissionId: string, candidateId: string) {
    const { rows } = await db.query<Record<string, unknown>>(
      `select * from public.submissions where id = $1 and candidate_id = $2`,
      [submissionId, candidateId],
    );
    if (!rows[0]) return null;
    const submission = domainRow<Submission>(rows[0]);
    const [project, evidence] = await Promise.all([
      this.findProject(submission.projectId),
      db.query<Record<string, unknown>>(
        `select * from public.evidence where submission_id = $1 order by skill`,
        [submissionId],
      ),
    ]);
    return {
      submission,
      project: project!,
      evidence: evidence.rows.map((row) => domainRow<Evidence>(row)),
    };
  },
};

export type SubmissionsDao = typeof pgSubmissionsDao;
