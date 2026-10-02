import { apiFetch } from "@/client/repos/http";
import type { CompanyDashboard } from "@/shared/models/companyDashboard";

export const companyDashboardRepo = {
  get(signal?: AbortSignal) {
    return apiFetch<CompanyDashboard>("/api/company/dashboard", { signal });
  },
};
