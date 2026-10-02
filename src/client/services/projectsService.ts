import { projectsRepo } from "@/client/repos/projectsRepo";
import type { ProjectIdea } from "@/shared/models/ai";
import type { CreateProjectInput } from "@/shared/models/projects";

/** Thin client service — ViewModels call this, not URLs. */
export const projectsService = {
  listMarketplace(candidateId: string, signal?: AbortSignal) {
    return projectsRepo.listMarketplace(candidateId, signal);
  },

  getById(projectId: string, signal?: AbortSignal) {
    return projectsRepo.getById(projectId, signal);
  },

  listForCompany(signal?: AbortSignal) {
    return projectsRepo.listForCompany(signal);
  },

  listSponsorable(signal?: AbortSignal) {
    return projectsRepo.listSponsorable(signal);
  },

  getDashboard(projectId: string, signal?: AbortSignal) {
    return projectsRepo.getDashboard(projectId, signal);
  },

  create(input: CreateProjectInput, signal?: AbortSignal) {
    return projectsRepo.create(input, signal);
  },

  publish(projectId: string, signal?: AbortSignal) {
    return projectsRepo.publish(projectId, signal);
  },

  sponsor(projectId: string, signal?: AbortSignal) {
    return projectsRepo.sponsor(projectId, signal);
  },

  generateFromJob(jobDescription: string, signal?: AbortSignal) {
    return projectsRepo.generateFromJob(jobDescription, signal);
  },

  expandIdea(idea: ProjectIdea, signal?: AbortSignal) {
    return projectsRepo.expandIdea(idea, signal);
  },
};
