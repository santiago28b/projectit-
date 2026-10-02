"use client";

import { projectsService } from "@/client/services/projectsService";
import { useLoaded } from "@/client/viewmodels/useLoaded";

/** Marketplace list: the published Projects this Candidate is eligible for. */
export function useProjectListViewModel() {
  const { data, error, isLoading } = useLoaded("marketplace", (signal) =>
    projectsService.listMarketplace(signal),
  );
  return { projects: data ?? [], error, isLoading };
}
