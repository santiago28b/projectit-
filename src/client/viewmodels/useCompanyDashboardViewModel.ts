"use client";

import { useCallback, useState, useTransition } from "react";

import { companyDashboardRepo } from "@/client/repos/companyDashboardRepo";
import type { CompanyDashboard } from "@/shared/models/companyDashboard";

export function useCompanyDashboardViewModel() {
  const [dashboard, setDashboard] = useState<CompanyDashboard | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  return { dashboard, unauthorized, error, isPending, load };
}
