"use client";

import { useCallback, useState, useTransition } from "react";

import { projectsService } from "@/client/services/projectsService";
import type {
  CompanyProjectListItem,
  SponsorableProject,
} from "@/shared/models/projects";

export function useCompanyProjectsViewModel() {
  const [owned, setOwned] = useState<CompanyProjectListItem[] | null>(null);
  const [sponsorable, setSponsorable] = useState<SponsorableProject[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [sponsoringId, setSponsoringId] = useState<string | null>(null);

  const load = useCallback(() => {
    startTransition(async () => {
      try {
        setError(null);
        const [list, open] = await Promise.all([
          projectsService.listForCompany(),
          projectsService.listSponsorable(),
        ]);
        setOwned(list);
        setSponsorable(open);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load Projects");
      }
    });
  }, []);

  const sponsor = useCallback(
    (projectId: string) => {
      setSponsoringId(projectId);
      startTransition(async () => {
        try {
          setError(null);
          await projectsService.sponsor(projectId);
          const [list, open] = await Promise.all([
            projectsService.listForCompany(),
            projectsService.listSponsorable(),
          ]);
          setOwned(list);
          setSponsorable(open);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Could not Sponsor Project",
          );
        } finally {
          setSponsoringId(null);
        }
      });
    },
    [],
  );

  return {
    owned,
    sponsorable,
    error,
    isPending,
    sponsoringId,
    load,
    sponsor,
  };
}
