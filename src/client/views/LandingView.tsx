"use client";

import { EndToEndFlow } from "@/client/components/landing/EndToEndFlow";
import { LandingHero } from "@/client/components/landing/LandingHero";
import { ProductTriad } from "@/client/components/landing/ProductTriad";
import { Button } from "@/client/components/ui/button";
import { useRoleSwitcherViewModel } from "@/client/viewmodels/useRoleSwitcherViewModel";
import { SEED_IDS } from "@/shared/constants/seedIds";

export function LandingView() {
  const { switchTo, browseAsGuest, isPending } = useRoleSwitcherViewModel();

  const onLooking = () => switchTo(SEED_IDS.mariaUser, "/candidate");
  const onHiring = () => switchTo(SEED_IDS.summitAdmin, "/company");
  const onGuest = () => browseAsGuest("/candidate/marketplace");

  return (
    <div className="min-h-full bg-zinc-50">
      <LandingHero
        isPending={isPending}
        onLooking={onLooking}
        onHiring={onHiring}
        onGuest={onGuest}
      />
      <ProductTriad />
      <EndToEndFlow />

      <section className="px-6 py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <h2 className="text-2xl font-semibold text-zinc-900">
            Ready to try the demo?
          </h2>
          <p className="max-w-lg text-zinc-600">
            Jump in as a Candidate or Company, or browse public Projects as a
            Guest first.
          </p>
          <div className="flex w-full flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              size="lg"
              disabled={isPending}
              onClick={onLooking}
              className="bg-candidate text-white hover:bg-candidate/90"
            >
              I&apos;m Looking for Opportunities
            </Button>
            <Button
              type="button"
              size="lg"
              disabled={isPending}
              onClick={onHiring}
              className="bg-company text-white hover:bg-company/90"
            >
              I&apos;m Hiring
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              disabled={isPending}
              onClick={onGuest}
            >
              Browse as Guest
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
