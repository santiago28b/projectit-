"use client";

import { useCallback, useState, useTransition } from "react";

import { companyDashboardRepo } from "@/client/repos/companyDashboardRepo";
import { reviewService } from "@/client/services/reviewService";
import type { CompanyDashboard } from "@/shared/models/companyDashboard";

export function useCompanyDashboardViewModel() {
  const [dashboard, setDashboard] = useState<CompanyDashboard | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(() => {
    startTransition(async () => {
      try {
        setError(null);
        setUnauthorized(false);
        const data = await companyDashboardRepo.get();
        setDashboard(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load dashboard";
        if (/Switch to a Company|401/i.test(message)) {
          setUnauthorized(true);
          setDashboard(null);
        } else {
          setError(message);
        }
      }
    });
  }, []);

  async function removeFromShortlist(shortlistId: string) {
    setRemoving(shortlistId);
    try {
      await reviewService.removeFromShortlist(shortlistId);
      setDashboard((current) =>
        current && {
          ...current,
          shortlist: current.shortlist.filter((s) => s.id !== shortlistId),
        },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove");
    } finally {
      setRemoving(null);
    }
  }

  return {
    dashboard,
    unauthorized,
    error,
    isPending,
    load,
    removeFromShortlist,
    removing,
  };
}
