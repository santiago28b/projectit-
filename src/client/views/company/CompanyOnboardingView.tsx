"use client";

import Link from "next/link";

import { Button } from "@/client/components/ui/button";
import { useCompanyOnboardingViewModel } from "@/client/viewmodels/useCompanyOnboardingViewModel";
import { useRoleSwitcherViewModel } from "@/client/viewmodels/useRoleSwitcherViewModel";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-company/30 placeholder:text-zinc-400 focus:border-company focus:ring-2";

export function CompanyOnboardingView() {
  const vm = useCompanyOnboardingViewModel();
  const { browseAsGuest, isPending: guestPending } = useRoleSwitcherViewModel();

  return (
    <main className="relative isolate min-h-[calc(100vh-3.5rem)] overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--color-company-soft),_transparent_55%),linear-gradient(180deg,#fafafa,white)]"
      />

      <div className="mx-auto w-full max-w-md">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-company">
          Companies
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
          Set up your Company
        </h1>
        <p className="mt-2 text-zinc-600">
          A short onboarding so you can post Projects and review Candidates.
        </p>

        <form
          onSubmit={vm.submit}
          className="mt-8 space-y-4 rounded-3xl border border-white/80 bg-white/70 p-6 shadow-lg shadow-zinc-900/5 backdrop-blur-xl ring-1 ring-company/10"
        >
          <label className="block text-sm font-medium text-zinc-900">
            Company name
            <input
              type="text"
              required
              className={inputClass}
              placeholder="Acme Labs"
              value={vm.companyName}
              onChange={(e) => vm.setCompanyName(e.target.value)}
            />
          </label>

          <label className="block text-sm font-medium text-zinc-900">
            Your name
            <input
              type="text"
              required
              className={inputClass}
              placeholder="Alex Rivera"
              value={vm.contactName}
              onChange={(e) => vm.setContactName(e.target.value)}
            />
          </label>

          <label className="block text-sm font-medium text-zinc-900">
            Work email
            <input
              type="email"
              autoComplete="email"
              required
              className={inputClass}
              placeholder="alex@acme.com"
              value={vm.workEmail}
              onChange={(e) => vm.setWorkEmail(e.target.value)}
            />
          </label>

          <p className="text-xs text-zinc-500">
            Demo: continues as Summit Logistics after you submit.
          </p>

          {vm.error && (
            <p role="alert" className="text-sm text-red-700">
              {vm.error}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={vm.isPending}
            className="h-11 w-full bg-company text-white hover:bg-company/90"
          >
            {vm.isPending ? "Setting up…" : "Continue"}
          </Button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-3 text-sm">
          <Link href="/" className="font-medium text-platform hover:underline">
            ← Back to Project It
          </Link>
          <button
            type="button"
            disabled={guestPending}
            onClick={() => browseAsGuest("/candidate/marketplace")}
            className="text-zinc-600 hover:text-zinc-900"
          >
            Browse Projects as Guest
          </button>
        </div>
      </div>
    </main>
  );
}
