import { projectsRepo } from "@/client/repos/projectsRepo";

/** Thin client service — ViewModels call this, not URLs. */
export const projectsService = {
  listMarketplace(candidateId: string, signal?: AbortSignal) {
    return projectsRepo.listMarketplace(candidateId, signal);
  },

  getById(projectId: string, signal?: AbortSignal) {
    return projectsRepo.getById(projectId, signal);
  },
};
