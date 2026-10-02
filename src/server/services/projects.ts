import "server-only";

import { candidatesDao, projectsDao } from "@/server/database/dao";
import { db } from "@/server/lib/db";
import { getDatabaseBackend } from "@/server/lib/databaseBackend";
import { createAdminClient } from "@/server/lib/supabase/admin";
import { isEligible } from "@/server/services/rules";
import { validateCreateInput } from "@/server/services/rules/projectInput";
import type { Project } from "@/shared/models/domain";
import type {
  CompanyProjectListItem,
  CreateProjectInput,
  ProjectDashboard,
  SponsorableProject,
} from "@/shared/models/projects";

function requireCompanyAdmin(
  companyId: string | null | undefined,
): asserts companyId is string {
  if (!companyId) throw new Error("Company admin required");
}

async function invitedProjectIds(candidateId: string): Promise<string[]> {
  if (getDatabaseBackend() === "supabase") {
    const { data, error } = await createAdminClient()
      .from("invitations")
      .select("project_id")
      .eq("candidate_id", candidateId)
      .neq("status", "expired");
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => row.project_id as string);
  }
  const { rows } = await db.query<{ project_id: string }>(
    `select project_id
     from public.invitations
     where candidate_id = $1 and status <> 'expired'`,
    [candidateId],
  );
  return rows.map((r) => r.project_id);
}

async function withCounts(
  items: { project: Project; relationshipType: "owner" | "sponsor" }[],
): Promise<CompanyProjectListItem[]> {
  return Promise.all(
    items.map(async ({ project, relationshipType }) => {
      const [sponsors, invitedCount, submissions] = await Promise.all([
        projectsDao.listSponsors(project.id),
        projectsDao.countInvitations(project.id),
        projectsDao.listSubmissionsForProject(project.id),
      ]);
      return {
        project,
        relationshipType,
        sponsorNames: sponsors.map((s) => s.name),
        invitedCount,
        submittedCount: submissions.length,
      };
    }),
  );
}

/** Create, publish, sponsor, and list Projects with Visibility filtering. */
export interface ProjectsService {
  listMarketplace(candidateId: string): Promise<Project[]>;
  getById(projectId: string): Promise<Project | null>;
  create(
    companyId: string,
    createdBy: string,
    input: CreateProjectInput,
  ): Promise<Project>;
  publish(companyId: string, projectId: string): Promise<Project>;
  sponsor(companyId: string, projectId: string): Promise<void>;
  isVisibleToCandidate(
    project: Project,
    candidateId: string,
  ): Promise<boolean>;
  listForCompany(companyId: string): Promise<CompanyProjectListItem[]>;
  listSponsorable(companyId: string): Promise<SponsorableProject[]>;
  getDashboard(
    companyId: string,
    projectId: string,
  ): Promise<ProjectDashboard | null>;
}

export const projectsService: ProjectsService = {
  async listMarketplace(candidateId) {
    const candidate = await candidatesDao.findById(candidateId);
    if (!candidate) throw new Error("Candidate not found");
    const [projects, invited] = await Promise.all([
      projectsDao.listPublished(),
      invitedProjectIds(candidateId),
    ]);
    return projects.filter((p) => isEligible(p, candidate, invited));
  },

  async getById(projectId) {
    return projectsDao.findById(projectId);
  },

  async create(companyId, createdBy, input) {
    requireCompanyAdmin(companyId);
    validateCreateInput(input);
    return projectsDao.create(companyId, createdBy, {
      ...input,
      title: input.title.trim(),
      scenario: input.scenario.trim(),
      description: (input.description ?? "").trim(),
      instructions: input.instructions.trim(),
      skills: input.skills.map((s) => s.trim()).filter(Boolean),
      deliverables: input.deliverables.map((d) => d.trim()).filter(Boolean),
      visibilityTarget:
        input.visibility === "public" || input.visibility === "invite"
          ? null
          : input.visibilityTarget?.trim() || null,
      rubric: input.rubric.map((c) => ({
        name: c.name.trim(),
        description: c.description.trim(),
      })),
    });
  },

  async publish(companyId, projectId) {
    requireCompanyAdmin(companyId);
    const relationship = await projectsDao.relationship(companyId, projectId);
    if (relationship !== "owner") {
      throw new Error("Only the owning Company can publish this Project");
    }
    const project = await projectsDao.findById(projectId);
    if (!project) throw new Error("Project not found");
    if (project.status === "published") return project;
    return projectsDao.setStatus(projectId, "published");
  },

  async sponsor(companyId, projectId) {
    requireCompanyAdmin(companyId);
    const project = await projectsDao.findById(projectId);
    if (!project) throw new Error("Project not found");
    if (project.type !== "platform") {
      throw new Error("Only Platform Projects can be Sponsored");
    }
    if (project.status !== "published") {
      throw new Error("Only published Platform Projects can be Sponsored");
    }
    const existing = await projectsDao.relationship(companyId, projectId);
    if (existing === "sponsor" || existing === "owner") return;
    await projectsDao.insertSponsor(companyId, projectId);
  },

  async isVisibleToCandidate(project, candidateId) {
    const candidate = await candidatesDao.findById(candidateId);
    if (!candidate) return false;
    const invited = await invitedProjectIds(candidateId);
    return isEligible(project, candidate, invited);
  },

  async listForCompany(companyId) {
    requireCompanyAdmin(companyId);
    const items = await projectsDao.listForCompany(companyId);
    return withCounts(items);
  },

  async listSponsorable(companyId) {
    requireCompanyAdmin(companyId);
    const projects = await projectsDao.listPlatformNotSponsoredBy(companyId);
    return Promise.all(
      projects.map(async (project) => ({
        project,
        existingSponsorNames: (await projectsDao.listSponsors(project.id)).map(
          (s) => s.name,
        ),
      })),
    );
  },

  async getDashboard(companyId, projectId) {
    requireCompanyAdmin(companyId);
    const relationship = await projectsDao.relationship(companyId, projectId);
    if (!relationship) return null;
    const project = await projectsDao.findById(projectId);
    if (!project) return null;
    const [sponsors, invitedCount, submissions, rubric] = await Promise.all([
      projectsDao.listSponsors(projectId),
      projectsDao.countInvitations(projectId),
      projectsDao.listSubmissionsForProject(projectId),
      projectsDao.getRubric(projectId),
    ]);
    return {
      project,
      relationshipType: relationship,
      sponsorNames: sponsors.map((s) => s.name),
      invitedCount,
      submittedCount: submissions.length,
      rubric,
      submissions,
    };
  },
};
