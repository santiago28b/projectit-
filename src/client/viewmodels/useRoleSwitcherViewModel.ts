"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { sessionService } from "@/client/services/sessionService";

/**
 * Role switcher ViewModel — sets the demo identity cookie, then sends the
 * user to their portal. Used by the nav dropdown and the landing buttons.
 */
export function useRoleSwitcherViewModel() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function switchTo(userId: string, redirectTo?: string) {
    startTransition(async () => {
      try {
        setError(null);
        const { home } = await sessionService.switchTo(userId);
        router.push(redirectTo ?? home);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to switch");
      }
    });
  }

  return { switchTo, error, isPending };
}
