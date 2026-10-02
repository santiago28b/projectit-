"use client";

import { projectsService } from "@/client/services/projectsService";
import { useLoaded } from "@/client/viewmodels/useLoaded";

export function useProjectDetailViewModel(projectId: string) {
  const { data, error, isLoading } = useLoaded(projectId, (signal) =>
    projectsService.getById(projectId, signal),
  );
  return { project: data, error, isLoading };
}
