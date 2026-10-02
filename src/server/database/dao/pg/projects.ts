import "server-only";

import { db } from "@/server/lib/db";
import type { RubricCriterion } from "@/shared/models/domain";
import type { ProjectCard, ProjectResource } from "@/shared/models/projects";

import { domainRow } from "../mappers";

/** Projects with the Companies that own or Sponsor them, as a JSON list. */
const CARD_SELECT = `
  select p.*,
    coalesce(
      json_agg(
        json_build_object('id', c.id, 'name', c.name, 'relationship', cp.relationship_type)
        order by cp.relationship_type, c.name
      ) filter (where c.id is not null),
      '[]'
    ) as companies
  from public.projects p
  left join public.company_projects cp on cp.project_id = p.id
  left join public.companies c on c.id = cp.company_id`;

type CardRow = ProjectCard & { resources: ProjectResource[] };

function toCard(row: Record<string, unknown>): ProjectCard {
  const { resources, ...card } = domainRow<CardRow>(row);
  void resources;
  return card;
}

export const pgProjectsDao = {
  async listPublishedCards(): Promise<ProjectCard[]> {
    const { rows } = await db.query<Record<string, unknown>>(
      `${CARD_SELECT}
       where p.status = 'published'
       group by p.id
       order by p.deadline nulls last, p.title`,
    );
    return rows.map(toCard);
  },

  async findDetail(
    id: string,
  ): Promise<(ProjectCard & { resources: ProjectResource[] }) | null> {
    const { rows } = await db.query<Record<string, unknown>>(
      `${CARD_SELECT}
       where p.id = $1
       group by p.id`,
      [id],
    );
    return rows[0] ? domainRow<CardRow>(rows[0]) : null;
  },

  async rubric(projectId: string): Promise<RubricCriterion[]> {
    const { rows } = await db.query<{ criteria: RubricCriterion[] }>(
      `select criteria from public.rubrics where project_id = $1`,
      [projectId],
    );
    return rows[0]?.criteria ?? [];
  },

  /** Projects the Candidate has a live (not expired) Invitation to. */
  async invitedProjectIds(candidateId: string): Promise<string[]> {
    const { rows } = await db.query<{ project_id: string }>(
      `select project_id
       from public.invitations
       where candidate_id = $1 and status <> 'expired'`,
      [candidateId],
    );
    return rows.map((row) => row.project_id);
  },

  async submissionId(
    projectId: string,
    candidateId: string,
  ): Promise<string | null> {
    const { rows } = await db.query<{ id: string }>(
      `select id
       from public.submissions
       where project_id = $1 and candidate_id = $2`,
      [projectId, candidateId],
    );
    return rows[0]?.id ?? null;
  },
};

export type ProjectsDao = typeof pgProjectsDao;
