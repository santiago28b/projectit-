"use client";

import Link from "next/link";

export function AdminPortalView() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <p className="text-sm font-medium text-zinc-500">Admin portal</p>
      <h1 className="mt-2 text-3xl font-semibold text-zinc-900">Platform</h1>
      <p className="mt-2 text-zinc-600">
        Platform Projects, Companies, moderation, and analytics placeholders.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block text-sm font-medium text-indigo-600"
      >
        Home
      </Link>
    </main>
  );
}
