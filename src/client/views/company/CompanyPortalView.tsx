"use client";

import Link from "next/link";

export function CompanyPortalView({
  name,
  companyName,
}: {
  name: string | null;
  companyName: string | null;
}) {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <p className="text-sm font-medium text-company">
        {companyName ?? "Company portal"}
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-zinc-900">
        {name ? `Welcome back, ${name.split(" ")[0]}` : "Dashboard"}
      </h1>
      <p className="mt-2 text-zinc-600">
        Jobs, Projects, Submissions, and Shortlists will live here.
      </p>
      <nav className="mt-8 flex flex-wrap gap-4 text-sm font-medium text-company">
        <Link href="/company/review">Review Submissions</Link>
        <Link href="/">Home</Link>
      </nav>
    </main>
  );
}
