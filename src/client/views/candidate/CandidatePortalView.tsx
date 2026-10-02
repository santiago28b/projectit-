"use client";

export function CandidatePortalView({ name }: { name: string | null }) {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <p className="text-sm font-medium text-candidate">Candidate portal</p>
      <h1 className="mt-2 text-3xl font-semibold text-zinc-900">
        {name ? `Welcome back, ${name.split(" ")[0]}` : "Dashboard"}
      </h1>
      <p className="mt-2 text-zinc-600">
        Marketplace, Projects, Submissions, and Profile will live here.
      </p>
    </main>
  );
}
