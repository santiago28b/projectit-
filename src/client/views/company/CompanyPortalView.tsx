"use client";

import Link from "next/link";

export function CompanyPortalView() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <p className="text-sm font-medium text-blue-700">Company portal</p>
      <h1 className="mt-2 text-3xl font-semibold text-zinc-900">Dashboard</h1>
      <p className="mt-2 text-zinc-600">
        Jobs, Projects, Submissions, and Shortlists will live here.
      </p>
      <nav className="mt-8 flex flex-wrap gap-4 text-sm font-medium text-indigo-600">
        <Link href="/">Home</Link>
      </nav>
    </main>
  );
}
