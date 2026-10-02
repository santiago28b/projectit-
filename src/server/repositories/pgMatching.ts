import "server-only";

import { db } from "@/server/lib/db";
import type {
  Candidate,
  Evidence,
  EvidenceLevel,
  Job,
  Project,
} from "@/shared/models/domain";
import type { CompanyProjectLink } from "@/server/services/rules";

import {
  type Row,
  toCandidate,
  toEvidence,
  toJob,
  toProject,
} from "./matchingMappers";

export const pgMatchingRepository = {
  async getCandidate(id: string): Promise<Candidate | null> {
    const { rows } = await db.query<Row>(
      `select * from public.candidates where id = $1`,
      [id],
    );
    return rows[0] ? toCandidate(rows[0]) : null;
  },

  async listCandidatesWithNames(): Promise<
    { candidate: Candidate; name: string }[]
  > {
    const { rows } = await db.query<Row>(
      `select c.*, u.name as user_name
       from public.candidates c
       join public.users u on u.id = c.user_id`,
    );
    return rows.map((r) => ({
      candidate: toCandidate(r),
      name: (r.user_name as string) ?? "Unknown Candidate",
    }));
  },

  async getJob(id: string): Promise<Job | null> {
    const { rows } = await db.query<Row>(
      `select * from public.jobs where id = $1`,
      [id],
    );
    return rows[0] ? toJob(rows[0]) : null;
  },

  async listJobsForCompany(companyId: string): Promise<Job[]> {
    const { rows } = await db.query<Row>(
      `select * from public.jobs where company_id = $1 order by created_at`,
      [companyId],
    );
    return rows.map(toJob);
  },

  async listOpenProjects(): Promise<Project[]> {
    const { rows } = await db.query<Row>(
      `select * from public.projects where status <> 'closed'`,
    );
    return rows.map(toProject);
  },

  async listInvitedProjectIds(candidateId: string): Promise<string[]> {
    const { rows } = await db.query<{ project_id: string }>(
      `select project_id
       from public.invitations
       where candidate_id = $1 and status <> 'expired'`,
      [candidateId],
    );
    return rows.map((r) => r.project_id);
  },

  async listEvidenceForCandidates(candidateIds: string[]): Promise<Evidence[]> {
    if (candidateIds.length === 0) return [];
    const { rows } = await db.query<Row>(
      `select * from public.evidence where candidate_id = any($1::uuid[])`,
      [candidateIds],
    );
    return rows.map(toEvidence);
  },

  async listEvidenceForSubmission(submissionId: string): Promise<Evidence[]> {
    const { rows } = await db.query<Row>(
      `select * from public.evidence where submission_id = $1`,
      [submissionId],
    );
    return rows.map(toEvidence);
  },

  async getEvidence(id: string): Promise<Evidence | null> {
    const { rows } = await db.query<Row>(
      `select * from public.evidence where id = $1`,
      [id],
    );
    return rows[0] ? toEvidence(rows[0]) : null;
  },

  async upsertCompanyEvidence(
    ai: Evidence,
    level: EvidenceLevel,
  ): Promise<Evidence> {
    const existing = await db.query<Row>(
      `select *
       from public.evidence
       where submission_id = $1 and skill = $2 and source = 'company'`,
      [ai.submissionId, ai.skill],
    );

    if (existing.rows[0]) {
      const { rows } = await db.query<Row>(
        `update public.evidence
         set level = $1, updated_at = now()
         where id = $2
         returning *`,
        [level, existing.rows[0].id],
      );
      return toEvidence(rows[0]);
    }

    const { rows } = await db.query<Row>(
      `insert into public.evidence (
         candidate_id, submission_id, skill, level, source, rationale
       ) values ($1, $2, $3, $4, 'company', 'Set by reviewer')
       returning *`,
      [ai.candidateId, ai.submissionId, ai.skill, level],
    );
    return toEvidence(rows[0]);
  },

  async projectsBySubmission(
    submissionIds: string[],
  ): Promise<Record<string, Pick<Project, "id" | "title">>> {
    if (submissionIds.length === 0) return {};
    const { rows } = await db.query<{
      id: string;
      project_id: string;
      title: string;
    }>(
      `select s.id, p.id as project_id, p.title
       from public.submissions s
       join public.projects p on p.id = s.project_id
       where s.id = any($1::uuid[])`,
      [submissionIds],
    );
    const out: Record<string, Pick<Project, "id" | "title">> = {};
    for (const r of rows) {
      out[r.id] = { id: r.project_id, title: r.title };
    }
    return out;
  },

  async listCompanyProjectLinks(
    companyId: string,
  ): Promise<CompanyProjectLink[]> {
    const { rows } = await db.query<{
      company_id: string;
      project_id: string;
      relationship_type: CompanyProjectLink["relationshipType"];
    }>(
      `select company_id, project_id, relationship_type
       from public.company_projects
       where company_id = $1`,
      [companyId],
    );
    return rows.map((r) => ({
      companyId: r.company_id,
      projectId: r.project_id,
      relationshipType: r.relationship_type,
    }));
  },
};
