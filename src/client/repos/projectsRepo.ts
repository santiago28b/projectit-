import { apiFetch } from "@/client/repos/http";
import type { ProjectCard, ProjectDetail } from "@/shared/models/projects";

/** The server reads the Candidate from the role-switcher cookie. */
export const projectsRepo = {
  listMarketplace(signal?: AbortSignal) {
    return apiFetch<{ projects: ProjectCard[] }>("/api/marketplace", {
      signal,
    }).then((data) => data.projects);
  },

  getById(projectId: string, signal?: AbortSignal) {
    return apiFetch<{ project: ProjectDetail }>(`/api/projects/${projectId}`, {
      signal,
    }).then((data) => data.project);
  },
};
