import { apiFetch } from "@/client/repos/http";
import type { CurrentUser } from "@/shared/models/domain";

export const sessionRepo = {
  switchTo(userId: string) {
    return apiFetch<{ current: CurrentUser; home: string }>("/api/session", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  },

  clear() {
    return apiFetch<{ current: null }>("/api/session", {
      method: "DELETE",
    });
  },
};
