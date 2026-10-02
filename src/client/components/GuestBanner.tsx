"use client";

import { Button } from "@/client/components/ui/button";
import { useRoleSwitcherViewModel } from "@/client/viewmodels/useRoleSwitcherViewModel";
import { SEED_IDS } from "@/shared/constants/seedIds";

/** Shown when nobody is signed in via the role switcher. */
export function GuestBanner() {
  const { switchTo, isPending } = useRoleSwitcherViewModel();

  return (
    <aside
      role="status"
      className="rounded-2xl border border-platform/20 bg-platform-soft px-4 py-4 sm:px-5"
    >
      <p className="text-sm font-semibold text-platform">Browsing as Guest</p>
      <p className="mt-1 text-sm text-zinc-600">
        You can explore public Projects. Switch to a Candidate to start one, or
        a Company to hire.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={isPending}
          onClick={() => switchTo(SEED_IDS.mariaUser, "/candidate")}
          className="bg-candidate text-white hover:bg-candidate/90"
        >
          Continue as Maria
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isPending}
          onClick={() => switchTo(SEED_IDS.summitAdmin, "/company")}
          className="bg-company text-white hover:bg-company/90"
        >
          Continue as Summit
        </Button>
      </div>
    </aside>
  );
}
