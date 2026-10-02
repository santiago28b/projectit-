import "server-only";

import { db } from "@/server/lib/db";
import type {
  Candidate,
  Company,
  Evidence,
  Evaluation,
  Project,
  RubricCriterion,
  Shortlist,
  Submission,
  User,
} from "@/shared/models/domain";
import type {
  SaveEvaluationInput,
  ShortlistInput,
} from "@/shared/models/review";

import { domainRow } from "../mappers";

async function findById<T>(table: string, id: string): Promise<T> {
  const { rows } = await db.query<Record<string, unknown>>(
    `select * from public.${table} where id = $1`,
    [id],
  );
  if (!rows[0]) throw new Error(`${table} not found`);
  return domainRow<T>(rows[0]);
}

export const pgReviewDao = {
  submission: (id: string) => findById<Submission>("submissions", id),
  candidate: (id: string) => findById<Candidate>("candidates", id),
  project: (id: string) => findById<Project>("projects", id),
  company: (id: string) => findById<Company>("companies", id),
  user: (id: string) => findById<User & { companyId?: string }>("users", id),
  evidence: (id: string) => findById<Evidence>("evidence", id),

  async reviewers() {
    const { rows } = await db.query<Record<string, unknown>>(
      `select * from public.users where role = 'company_admin'`,
    );
    return rows.map((row) => domainRow<User & { companyId?: string }>(row));
  },

  async companyIds(projectId: string) {
    const { rows } = await db.query<{ company_id: string }>(
      `select company_id
       from public.company_projects
       where project_id = $1
         and relationship_type in ('owner', 'sponsor')`,
      [projectId],
    );
    return rows.map((row) => row.company_id);
  },

  async listSubmissions() {
    const { rows } = await db.query<Record<string, unknown>>(
      `select * from public.submissions order by submitted_at desc`,
    );
    return rows.map((row) => domainRow<Submission>(row));
  },

  async listEvidence(submissionId: string) {
    const { rows } = await db.query<Record<string, unknown>>(
      `select * from public.evidence where submission_id = $1`,
      [submissionId],
    );
    return rows.map((row) => domainRow<Evidence>(row));
  },

  async rubric(projectId: string): Promise<RubricCriterion[]> {
    const { rows } = await db.query<{ criteria: RubricCriterion[] }>(
      `select criteria from public.rubrics where project_id = $1`,
      [projectId],
    );
    return rows[0]?.criteria ?? [];
  },

  async evaluation(submissionId: string, reviewerId: string) {
    const { rows } = await db.query<Record<string, unknown>>(
      `select *
       from public.evaluations
       where submission_id = $1 and reviewer_id = $2
       order by updated_at desc
       limit 1`,
      [submissionId, reviewerId],
    );
    return rows[0] ? domainRow<Evaluation>(rows[0]) : null;
  },

  async saveEvaluation(input: SaveEvaluationInput) {
    const existing = await this.evaluation(
      input.submissionId,
      input.reviewerId,
    );
    if (existing) {
      const { rows } = await db.query<Record<string, unknown>>(
        `update public.evaluations
         set rubric_results = $1,
             notes = $2,
             interview_recommended = $3,
             updated_at = now()
         where id = $4
         returning *`,
        [
          JSON.stringify(input.rubricResults),
          input.notes,
          input.interviewRecommended,
          existing.id,
        ],
      );
      return domainRow<Evaluation>(rows[0]);
    }

    const { rows } = await db.query<Record<string, unknown>>(
      `insert into public.evaluations (
         submission_id, reviewer_id, rubric_results, notes, interview_recommended
       ) values ($1, $2, $3, $4, $5)
       returning *`,
      [
        input.submissionId,
        input.reviewerId,
        JSON.stringify(input.rubricResults),
        input.notes,
        input.interviewRecommended,
      ],
    );
    return domainRow<Evaluation>(rows[0]);
  },

  async saveOverride(
    evidence: Evidence,
    level: Evidence["level"],
    rationale: string,
  ) {
    const existing = (await this.listEvidence(evidence.submissionId)).find(
      (row) => row.skill === evidence.skill && row.source === "company",
    );
    if (existing) {
      const { rows } = await db.query<Record<string, unknown>>(
        `update public.evidence
         set level = $1, rationale = $2, updated_at = now()
         where id = $3
         returning *`,
        [level, rationale, existing.id],
      );
      return domainRow<Evidence>(rows[0]);
    }

    const { rows } = await db.query<Record<string, unknown>>(
      `insert into public.evidence (
         candidate_id, submission_id, skill, level, source, rationale
       ) values ($1, $2, $3, $4, 'company', $5)
       returning *`,
      [
        evidence.candidateId,
        evidence.submissionId,
        evidence.skill,
        level,
        rationale,
      ],
    );
    return domainRow<Evidence>(rows[0]);
  },

  async shortlist(input: ShortlistInput) {
    const { rows } = input.jobId
      ? await db.query<Record<string, unknown>>(
          `select *
           from public.shortlists
           where company_id = $1 and candidate_id = $2 and job_id = $3
           order by created_at
           limit 1`,
          [input.companyId, input.candidateId, input.jobId],
        )
      : await db.query<Record<string, unknown>>(
          `select *
           from public.shortlists
           where company_id = $1 and candidate_id = $2 and job_id is null
           order by created_at
           limit 1`,
          [input.companyId, input.candidateId],
        );
    return rows[0] ? domainRow<Shortlist>(rows[0]) : null;
  },

  async insertShortlist(input: ShortlistInput) {
    const { rows } = await db.query<Record<string, unknown>>(
      `insert into public.shortlists (
         company_id, candidate_id, job_id, submission_id
       ) values ($1, $2, $3, $4)
       returning *`,
      [
        input.companyId,
        input.candidateId,
        input.jobId ?? null,
        input.submissionId ?? null,
      ],
    );
    return domainRow<Shortlist>(rows[0]);
  },

  async jobCompany(jobId: string) {
    const job = await findById<{ companyId: string }>("jobs", jobId);
    return job.companyId;
  },
};
