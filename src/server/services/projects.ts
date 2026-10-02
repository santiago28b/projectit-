import { projectsDao } from "@/server/database/dao";
import type { ProjectsDao } from "@/server/database/dao/pg/projects";
import { isEligible } from "@/server/services/rules";
import type { Candidate, Project } from "@/server/models/domain";
import type { ProjectCard, ProjectDetail } from "@/shared/models/projects";

/**
 * Marketplace and Project detail for Candidates. Visibility rules live in
 * `isEligible` (services/rules); this service only gathers the rows.
 */
export function createProjectsService(dao: ProjectsDao) {
  return {
    /** Published Projects this Candidate is eligible for. */
    async listMarketplace(candidate: Candidate): Promise<ProjectCard[]> {
      const [projects, invited] = await Promise.all([
        dao.listPublishedCards(),
        dao.invitedProjectIds(candidate.id),
      ]);
      return projects.filter((project) =>
        isEligible(project, candidate, invited),
      );
    },

    /**
     * Project detail, or null when the Candidate can't see it. Opening a
     * restricted Project by URL doesn't get around Visibility. A Candidate
     * who already submitted can always reopen it.
     */
    async getDetail(
      projectId: string,
      candidate: Candidate,
    ): Promise<ProjectDetail | null> {
      const project = await dao.findDetail(projectId);
      if (!project) return null;
      const [invited, mySubmissionId] = await Promise.all([
        dao.invitedProjectIds(candidate.id),
        dao.submissionId(projectId, candidate.id),
      ]);
      if (!mySubmissionId && !isEligible(project, candidate, invited))
        return null;
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

    // Company-side Project management is ticket 07 (Person B).
    async create(_input: unknown): Promise<Project> {
      void _input;
      throw new Error("projectsService.create not implemented");
    },
    async publish(_projectId: string): Promise<Project> {
      void _projectId;
      throw new Error("projectsService.publish not implemented");
    },
    async sponsor(_companyId: string, _projectId: string): Promise<void> {
      void _companyId;
      void _projectId;
      throw new Error("projectsService.sponsor not implemented");
    },
  };
}

export type ProjectsService = ReturnType<typeof createProjectsService>;

export const projectsService = createProjectsService(projectsDao);
