"use client";

import Link from "next/link";

export function MarketplaceView() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <p className="text-sm font-medium text-emerald-700">Marketplace</p>
      <h1 className="mt-2 text-3xl font-semibold text-zinc-900">
        Public Projects
      </h1>
      <p className="mt-2 text-zinc-600">
        Recommended-for-you and Visibility filtering will load through the
        Marketplace ViewModel.
      </p>
      <Link
        href="/candidate"
        className="mt-8 inline-block text-sm font-medium text-indigo-600"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
