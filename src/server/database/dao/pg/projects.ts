import "server-only";

import { db } from "@/server/lib/db";
import { toProject, type Row } from "@/server/repositories/matchingMappers";
import type {
  CompanyProjectRelationship,
  Project,
  ProjectStatus,
  RubricCriterion,
  SubmissionStatus,
} from "@/shared/models/domain";
import type { CreateProjectInput } from "@/shared/models/projects";

export const pgProjectsDao = {
  async findById(id: string): Promise<Project | null> {
    const { rows } = await db.query<Row>(
      `select * from public.projects where id = $1`,
      [id],
    );
    return rows[0] ? toProject(rows[0]) : null;
  },

  async listPublished(): Promise<Project[]> {
    const { rows } = await db.query<Row>(
      `select * from public.projects
       where status = 'published'
       order by created_at desc`,
    );
    return rows.map(toProject);
  },

  async listForCompany(
    companyId: string,
  ): Promise<
    { project: Project; relationshipType: CompanyProjectRelationship }[]
  > {
    const { rows } = await db.query<Row>(
      `select p.*, cp.relationship_type
       from public.company_projects cp
       join public.projects p on p.id = cp.project_id
       where cp.company_id = $1
       order by p.updated_at desc`,
      [companyId],
    );
    return rows.map((r) => ({
      project: toProject(r),
      relationshipType: r.relationship_type as CompanyProjectRelationship,
    }));
  },

  async listPlatformNotSponsoredBy(companyId: string): Promise<Project[]> {
    const { rows } = await db.query<Row>(
      `select p.*
       from public.projects p
       where p.type = 'platform'
         and p.status = 'published'
         and not exists (
           select 1
           from public.company_projects cp
           where cp.project_id = p.id
             and cp.company_id = $1
             and cp.relationship_type = 'sponsor'
         )
       order by p.title`,
      [companyId],
    );
    return rows.map(toProject);
  },

  async listSponsors(
    projectId: string,
  ): Promise<{ companyId: string; name: string }[]> {
    const { rows } = await db.query<{ company_id: string; name: string }>(
      `select c.id as company_id, c.name
       from public.company_projects cp
       join public.companies c on c.id = cp.company_id
       where cp.project_id = $1
         and cp.relationship_type = 'sponsor'
       order by c.name`,
      [projectId],
    );
    return rows.map((r) => ({ companyId: r.company_id, name: r.name }));
  },

  async relationship(
    companyId: string,
    projectId: string,
  ): Promise<CompanyProjectRelationship | null> {
    const { rows } = await db.query<{ relationship_type: CompanyProjectRelationship }>(
      `select relationship_type
       from public.company_projects
       where company_id = $1 and project_id = $2
       order by case relationship_type when 'owner' then 0 else 1 end
       limit 1`,
      [companyId, projectId],
    );
    return rows[0]?.relationship_type ?? null;
  },

  async create(
    companyId: string,
    createdBy: string,
    input: CreateProjectInput,
  ): Promise<Project> {
    const status: ProjectStatus = input.publish ? "published" : "draft";
    const client = await db.pool.connect();
    try {
      await client.query("begin");
      const { rows } = await client.query<Row>(
        `insert into public.projects (
           title, scenario, description, instructions, type, visibility,
           visibility_target, expected_duration_minutes, difficulty, skills,
           deliverables, deadline, status, created_by
         ) values (
           $1, $2, $3, $4, 'company', $5,
           $6, $7, $8, $9,
           $10, $11, $12, $13
         )
         returning *`,
        [
          input.title,
          input.scenario,
          input.description ?? "",
          input.instructions,
          input.visibility,
          input.visibilityTarget,
          input.expectedDurationMinutes,
          input.difficulty,
          input.skills,
          input.deliverables,
          input.deadline,
          status,
          createdBy,
        ],
      );
      const project = toProject(rows[0]);
      await client.query(
        `insert into public.company_projects (company_id, project_id, relationship_type)
         values ($1, $2, 'owner')`,
        [companyId, project.id],
      );
      if (input.rubric.length > 0) {
        await client.query(
          `insert into public.rubrics (project_id, criteria)
           values ($1, $2::jsonb)`,
          [project.id, JSON.stringify(input.rubric)],
        );
      }
      await client.query("commit");
      return project;
    } catch (err) {
      await client.query("rollback");
      throw err;
    } finally {
      client.release();
    }
  },

  async setStatus(projectId: string, status: ProjectStatus): Promise<Project> {
    const { rows } = await db.query<Row>(
      `update public.projects
       set status = $2, updated_at = now()
       where id = $1
       returning *`,
      [projectId, status],
    );
    if (!rows[0]) throw new Error("Project not found");
    return toProject(rows[0]);
  },

  async insertSponsor(companyId: string, projectId: string): Promise<void> {
    await db.query(
      `insert into public.company_projects (company_id, project_id, relationship_type)
       values ($1, $2, 'sponsor')
       on conflict (company_id, project_id, relationship_type) do nothing`,
      [companyId, projectId],
    );
  },

  async countInvitations(projectId: string): Promise<number> {
    const { rows } = await db.query<{ count: string }>(
      `select count(*)::text as count
       from public.invitations
       where project_id = $1 and status <> 'expired'`,
      [projectId],
    );
    return Number(rows[0]?.count ?? 0);
  },

  async listSubmissionsForProject(projectId: string): Promise<
    {
      id: string;
      candidateName: string;
      submittedAt: string;
      status: SubmissionStatus;
    }[]
  > {
    const { rows } = await db.query<{
      id: string;
      candidate_name: string;
      submitted_at: Date | string;
      status: SubmissionStatus;
    }>(
      `select s.id, u.name as candidate_name, s.submitted_at, s.status
       from public.submissions s
       join public.candidates c on c.id = s.candidate_id
       join public.users u on u.id = c.user_id
       where s.project_id = $1
       order by s.submitted_at desc`,
      [projectId],
    );
    return rows.map((r) => ({
      id: r.id,
      candidateName: r.candidate_name,
      submittedAt:
        r.submitted_at instanceof Date
          ? r.submitted_at.toISOString()
          : r.submitted_at,
      status: r.status,
    }));
  },

  async getRubric(projectId: string): Promise<RubricCriterion[]> {
    const { rows } = await db.query<{ criteria: RubricCriterion[] }>(
      `select criteria from public.rubrics where project_id = $1`,
      [projectId],
    );
    return rows[0]?.criteria ?? [];
  },
};
