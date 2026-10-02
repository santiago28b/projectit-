"use client";

import { useCallback, useState, useTransition } from "react";

import { projectsService } from "@/client/services/projectsService";
import type { ProjectDashboard } from "@/shared/models/projects";

export function useProjectDashboardViewModel(projectId: string) {
  const [dashboard, setDashboard] = useState<ProjectDashboard | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(() => {
    startTransition(async () => {
      try {
        setError(null);
        setNotFound(false);
        const data = await projectsService.getDashboard(projectId);
        setDashboard(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load Project";
        if (/not found/i.test(message)) {
          setNotFound(true);
          setDashboard(null);
        } else {
          setError(message);
        }
      }
    });
  }, [projectId]);

  const publish = useCallback(() => {
    startTransition(async () => {
      try {
        setError(null);
        await projectsService.publish(projectId);
        const data = await projectsService.getDashboard(projectId);
        setDashboard(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not publish");
      }
    });
  }, [projectId]);

  return { dashboard, notFound, error, isPending, load, publish };
}
