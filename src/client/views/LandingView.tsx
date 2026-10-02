"use client";

import { useRouter } from "next/navigation";

import { EndToEndFlow } from "@/client/components/landing/EndToEndFlow";
import { LandingHero } from "@/client/components/landing/LandingHero";
import { ProductTriad } from "@/client/components/landing/ProductTriad";
import { Button } from "@/client/components/ui/button";
import { useRoleSwitcherViewModel } from "@/client/viewmodels/useRoleSwitcherViewModel";

export function LandingView() {
  const router = useRouter();
  const { browseAsGuest, isPending } = useRoleSwitcherViewModel();

  const onLooking = () => router.push("/login");
  const onHiring = () => router.push("/company/onboarding");
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
          <div className="flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            <Button
              type="button"
              size="lg"
              disabled={isPending}
              onClick={onLooking}
              className="bg-candidate text-white hover:bg-candidate/90"
            >
              I&apos;m Looking
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={onGuest}
              className="border-platform/30 text-platform"
            >
              Browse Projects
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
          </div>
        </div>
      </section>
    </div>
  );
}
