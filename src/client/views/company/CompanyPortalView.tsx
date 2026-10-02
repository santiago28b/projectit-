"use client";

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
    </main>
  );
}
