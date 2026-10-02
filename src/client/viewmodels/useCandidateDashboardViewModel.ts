"use client";

import { projectsService } from "@/client/services/projectsService";
import { submissionsService } from "@/client/services/submissionsService";
import { useLoaded } from "@/client/viewmodels/useLoaded";

/** Available Projects (eligible, not yet submitted) and submitted ones. */
export function useCandidateDashboardViewModel() {
  const { data, error, isLoading } = useLoaded("candidate-dashboard", (signal) =>
    Promise.all([
      projectsService.listMarketplace(signal),
      submissionsService.listMine(signal),
    ]),
  );
  const [projects, submitted] = data ?? [[], []];
  const submittedIds = new Set(submitted.map((s) => s.projectId));
  return {
    available: projects.filter((p) => !submittedIds.has(p.id)),
    submitted,
    error,
    isLoading,
  };
}
