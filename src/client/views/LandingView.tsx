"use client";

import Link from "next/link";

export function LandingView() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center gap-10 px-6 py-16">
      <div className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-wide text-indigo-600">
          Project It
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          See what candidates can do, not just what their resumes say
        </h1>
        <p className="max-w-xl text-lg text-zinc-600">
          Companies publish short Projects. Candidates submit work and a
          Walkthrough. AI turns that into Evidence and Matches — with reasons,
          never a percentage.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/company"
          className="inline-flex h-11 items-center justify-center rounded-md bg-indigo-600 px-5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          I&apos;m Hiring
        </Link>
        <Link
          href="/candidate"
          className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 px-5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
        >
          I&apos;m Looking for Opportunities
        </Link>
      </div>
    </main>
  );
}
