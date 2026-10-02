"use client";

import Link from "next/link";

export function CandidatePortalView() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <p className="text-sm font-medium text-emerald-700">Candidate portal</p>
      <h1 className="mt-2 text-3xl font-semibold text-zinc-900">Dashboard</h1>
      <p className="mt-2 text-zinc-600">
        Marketplace, Projects, Submissions, and Profile will live here.
      </p>
      <nav className="mt-8 flex flex-wrap gap-4 text-sm font-medium text-indigo-600">
        <Link href="/candidate/marketplace">Marketplace</Link>
        <Link href="/">Home</Link>
      </nav>
    </main>
  );
}
