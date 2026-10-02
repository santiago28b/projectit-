import { apiFetch } from "@/client/repos/http";
import type { Project } from "@/shared/models/domain";

export const projectsRepo = {
  listMarketplace(candidateId: string, signal?: AbortSignal) {
    const params = new URLSearchParams({ candidateId });
    return apiFetch<{ projects: Project[] }>(
      `/api/marketplace?${params.toString()}`,
      { signal },
    ).then((data) => data.projects);
  },

  getById(projectId: string, signal?: AbortSignal) {
    return apiFetch<{ project: Project }>(`/api/projects/${projectId}`, {
      signal,
    }).then((data) => data.project);
  },
};
