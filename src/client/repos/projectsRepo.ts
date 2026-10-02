import { apiFetch } from "@/client/repos/http";
import type {
  ExtractedSkills,
  GeneratedProject,
  ProjectIdea,
} from "@/shared/models/ai";
import type { Project } from "@/shared/models/domain";
import type {
  CompanyProjectListItem,
  CreateProjectInput,
  ProjectDashboard,
  SponsorableProject,
} from "@/shared/models/projects";

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

  listForCompany(signal?: AbortSignal) {
    return apiFetch<{ projects: CompanyProjectListItem[] }>(
      "/api/company/projects",
      { signal },
    ).then((data) => data.projects);
  },

  listSponsorable(signal?: AbortSignal) {
    return apiFetch<{ projects: SponsorableProject[] }>(
      "/api/company/projects/sponsorable",
      { signal },
    ).then((data) => data.projects);
  },

  getDashboard(projectId: string, signal?: AbortSignal) {
    return apiFetch<ProjectDashboard>(`/api/company/projects/${projectId}`, {
      signal,
    });
  },

  create(input: CreateProjectInput, signal?: AbortSignal) {
    return apiFetch<{ project: Project }>("/api/company/projects", {
      method: "POST",
      body: JSON.stringify(input),
      signal,
    }).then((data) => data.project);
  },

  publish(projectId: string, signal?: AbortSignal) {
    return apiFetch<{ project: Project }>(
      `/api/company/projects/${projectId}/publish`,
      { method: "POST", signal },
    ).then((data) => data.project);
  },

  sponsor(projectId: string, signal?: AbortSignal) {
    return apiFetch<{ ok: boolean }>(
      `/api/company/projects/${projectId}/sponsor`,
      { method: "POST", signal },
    );
  },

  generateFromJob(jobDescription: string, signal?: AbortSignal) {
    return apiFetch<{ skills: ExtractedSkills; ideas: ProjectIdea[] }>(
      "/api/company/projects/generate",
      {
        method: "POST",
        body: JSON.stringify({ jobDescription }),
        signal,
      },
    );
  },

  expandIdea(idea: ProjectIdea, signal?: AbortSignal) {
    return apiFetch<{ project: GeneratedProject }>(
      "/api/company/projects/generate/expand",
      {
        method: "POST",
        body: JSON.stringify(idea),
        signal,
      },
    ).then((data) => data.project);
  },
};
