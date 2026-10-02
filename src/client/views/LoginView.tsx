"use client";

import Link from "next/link";

import { Button } from "@/client/components/ui/button";
import { useLoginViewModel } from "@/client/viewmodels/useLoginViewModel";
import { useRoleSwitcherViewModel } from "@/client/viewmodels/useRoleSwitcherViewModel";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-candidate/30 placeholder:text-zinc-400 focus:border-candidate focus:ring-2";

export function LoginView() {
  const vm = useLoginViewModel();
  const { browseAsGuest, isPending: guestPending } = useRoleSwitcherViewModel();

  return (
    <main className="relative isolate min-h-[calc(100vh-3.5rem)] overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--color-candidate-soft),_transparent_55%),linear-gradient(180deg,#fafafa,white)]"
      />

      <div className="mx-auto w-full max-w-md">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-candidate">
          Candidates
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
          Welcome back
        </h1>
        <p className="mt-2 text-zinc-600">
          Sign in to continue as a Candidate.
        </p>

        <form
          onSubmit={vm.submit}
          className="mt-8 space-y-4 rounded-3xl border border-white/80 bg-white/70 p-6 shadow-lg shadow-zinc-900/5 backdrop-blur-xl ring-1 ring-candidate/10"
        >
          <label className="block text-sm font-medium text-zinc-900">
            Email
            <input
              type="email"
              autoComplete="email"
              required
              className={inputClass}
              placeholder="you@university.edu"
              value={vm.email}
              onChange={(e) => vm.setEmail(e.target.value)}
            />
          </label>

          <label className="block text-sm font-medium text-zinc-900">
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              className={inputClass}
              placeholder="••••••••"
              value={vm.password}
              onChange={(e) => vm.setPassword(e.target.value)}
            />
          </label>

          <p className="text-xs text-zinc-500">
            Demo: use any email and password — continues as Maria.
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
            className="h-11 w-full bg-candidate text-white hover:bg-candidate/90"
          >
            {vm.isPending ? "Signing in…" : "Sign in"}
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
