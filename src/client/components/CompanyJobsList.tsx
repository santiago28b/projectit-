import Link from "next/link";

import type { Job } from "@/shared/models/domain";

/**
 * The Company's Jobs, each linking to its Job page
 * (Candidates who fit + Projects that test it).
 */
export function CompanyJobsList({ jobs }: { jobs: Job[] }) {
  return (
    <section aria-labelledby="jobs-heading" className="space-y-3">
      <h2 id="jobs-heading" className="text-lg font-semibold text-zinc-900">
        Your Jobs
      </h2>
      {jobs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500">
          No Jobs yet.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                href={`/company/jobs/${job.id}`}
                className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium text-zinc-900">{job.title}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      job.status === "open"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {job.status === "open" ? "Open" : "Closed"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-500">
                  {job.requiredSkills.join(" · ")}
                </p>
                <p className="mt-3 text-sm font-medium text-teal-700">
                  See Candidates who fit →
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
