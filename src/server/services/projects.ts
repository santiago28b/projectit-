import "server-only";

import { candidatesDao, projectsDao } from "@/server/database/dao";
import type { ProjectsDao } from "@/server/database/dao/pg/projects";
import { isEligible } from "@/server/services/rules";
import { validateCreateInput } from "@/server/services/rules/projectInput";
import type { Candidate, Project } from "@/shared/models/domain";
import type {
  CompanyProjectListItem,
  CreateProjectInput,
  ProjectCard,
  ProjectDashboard,
  ProjectDetail,
  SponsorableProject,
} from "@/shared/models/projects";

function requireCompanyAdmin(
  companyId: string | null | undefined,
): asserts companyId is string {
  if (!companyId) throw new Error("Company admin required");
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

/**
 * Marketplace Visibility for Candidates lives in `isEligible`.
 * Company create / publish / Sponsor lives beside it on the same service.
 */
export function createProjectsService(dao: ProjectsDao) {
  return {
    /**
     * Published Projects this Candidate is eligible for.
     * Guests (null Candidate) only see public published Projects.
     */
    async listMarketplace(
      candidate: Candidate | null,
    ): Promise<ProjectCard[]> {
      const projects = await dao.listPublishedCards();
      if (!candidate) {
        return projects.filter(
          (project) =>
            project.status === "published" && project.visibility === "public",
        );
      }
      const invited = await dao.invitedProjectIds(candidate.id);
      return projects.filter((project) =>
        isEligible(project, candidate, invited),
      );
    },

    /**
     * Project detail, or null when the viewer can't see it. Opening a
     * restricted Project by URL doesn't get around Visibility. A Candidate
     * who already submitted can always reopen it. Guests see public only.
     */
    async getDetail(
      projectId: string,
      candidate: Candidate | null,
    ): Promise<ProjectDetail | null> {
      const project = await dao.findDetail(projectId);
      if (!project) return null;

      if (!candidate) {
        if (project.status !== "published" || project.visibility !== "public") {
          return null;
        }
        return {
          ...project,
          rubric: await dao.rubric(projectId),
          mySubmissionId: null,
        };
      }

      const [invited, mySubmissionId] = await Promise.all([
        dao.invitedProjectIds(candidate.id),
        dao.submissionId(projectId, candidate.id),
      ]);
      if (!mySubmissionId && !isEligible(project, candidate, invited)) {
        return null;
      }
      return {
        ...project,
        rubric: await dao.rubric(projectId),
        mySubmissionId,
      };
    },

    /** Whether the Candidate may start (and submit to) this Project now. */
    async canStart(project: Project, candidate: Candidate): Promise<boolean> {
      const invited = await dao.invitedProjectIds(candidate.id);
      return isEligible(project, candidate, invited);
    },

    async getById(projectId: string): Promise<Project | null> {
      return dao.findById(projectId);
    },

    async create(
      companyId: string,
      createdBy: string,
      input: CreateProjectInput,
    ): Promise<Project> {
      requireCompanyAdmin(companyId);
      validateCreateInput(input);
      return dao.create(companyId, createdBy, {
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

    async publish(companyId: string, projectId: string): Promise<Project> {
      requireCompanyAdmin(companyId);
      const relationship = await dao.relationship(companyId, projectId);
      if (relationship !== "owner") {
        throw new Error("Only the owning Company can publish this Project");
      }
      const project = await dao.findById(projectId);
      if (!project) throw new Error("Project not found");
      if (project.status === "published") return project;
      return dao.setStatus(projectId, "published");
    },

    async sponsor(companyId: string, projectId: string): Promise<void> {
      requireCompanyAdmin(companyId);
      const project = await dao.findById(projectId);
      if (!project) throw new Error("Project not found");
      if (project.type !== "platform") {
        throw new Error("Only Platform Projects can be Sponsored");
      }
      if (project.status !== "published") {
        throw new Error("Only published Platform Projects can be Sponsored");
      }
      const existing = await dao.relationship(companyId, projectId);
      if (existing === "sponsor" || existing === "owner") return;
      await dao.insertSponsor(companyId, projectId);
    },

    async isVisibleToCandidate(
      project: Project,
      candidateId: string,
    ): Promise<boolean> {
      const candidate = await candidatesDao.findById(candidateId);
      if (!candidate) return false;
      const invited = await dao.invitedProjectIds(candidateId);
      return isEligible(project, candidate, invited);
    },

    async listForCompany(companyId: string): Promise<CompanyProjectListItem[]> {
      requireCompanyAdmin(companyId);
      const items = await dao.listForCompany(companyId);
      return withCounts(items);
    },

    async listSponsorable(companyId: string): Promise<SponsorableProject[]> {
      requireCompanyAdmin(companyId);
      const projects = await dao.listPlatformNotSponsoredBy(companyId);
      return Promise.all(
        projects.map(async (project) => ({
          project,
          existingSponsorNames: (await dao.listSponsors(project.id)).map(
            (s) => s.name,
          ),
        })),
      );
    },

    async getDashboard(
      companyId: string,
      projectId: string,
    ): Promise<ProjectDashboard | null> {
      requireCompanyAdmin(companyId);
      const relationship = await dao.relationship(companyId, projectId);
      if (!relationship) return null;
      const project = await dao.findById(projectId);
      if (!project) return null;
      const [sponsors, invitedCount, submissions, rubric] = await Promise.all([
        dao.listSponsors(projectId),
        dao.countInvitations(projectId),
        dao.listSubmissionsForProject(projectId),
        dao.getRubric(projectId),
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
}

export type ProjectsService = ReturnType<typeof createProjectsService>;

export const projectsService = createProjectsService(projectsDao);
