import type { Project } from "@/server/models/domain";

/** Create, publish, sponsor, and list Projects with Visibility filtering. */
export interface ProjectsService {
  listMarketplace(candidateId: string): Promise<Project[]>;
  getById(projectId: string): Promise<Project | null>;
  create(input: unknown): Promise<Project>;
  publish(projectId: string): Promise<Project>;
  sponsor(companyId: string, projectId: string): Promise<void>;
  isVisibleToCandidate(
    project: Project,
    candidateId: string,
  ): Promise<boolean>;
}

export const projectsService: ProjectsService = {
  async listMarketplace() {
    throw new Error("projectsService.listMarketplace not implemented");
  },
  async getById() {
    throw new Error("projectsService.getById not implemented");
  },
  async create() {
    throw new Error("projectsService.create not implemented");
  },
  async publish() {
    throw new Error("projectsService.publish not implemented");
  },
  async sponsor() {
    throw new Error("projectsService.sponsor not implemented");
  },
  async isVisibleToCandidate() {
    throw new Error("projectsService.isVisibleToCandidate not implemented");
  },
};
