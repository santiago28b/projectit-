"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/client/components/ui/card";
import { useProjectListViewModel } from "@/client/viewmodels/useProjectListViewModel";
import {
  ownerLine,
  ProjectBadges,
  SkillList,
  TimingLine,
} from "@/client/views/candidate/ProjectLabels";

export function MarketplaceView({
  recommended,
}: {
  /** "Recommended for you" (ticket 04) renders here when provided. */
  recommended?: ReactNode;
}) {
  const { projects, error, isLoading } = useProjectListViewModel();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <p className="text-sm font-medium text-candidate">Marketplace</p>
      <h1 className="mt-2 text-3xl font-semibold text-zinc-900">Projects</h1>
      <p className="mt-2 text-zinc-600">
        Short, realistic Projects you can take now. Each one is reviewed by
        the Company that owns or Sponsors it.
      </p>

      {recommended && <div className="mt-10">{recommended}</div>}

      <section aria-labelledby="all-projects" className="mt-10">
        <h2 id="all-projects" className="text-xl font-semibold text-zinc-900">
          All Projects you can take
        </h2>
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        )}
        {isLoading && <p className="mt-4 text-sm text-zinc-500">Loading…</p>}
        {!isLoading && !error && projects.length === 0 && (
          <p className="mt-4 text-sm text-zinc-600">
            No Projects are open to you right now.
          </p>
        )}
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/candidate/projects/${project.id}`}
                className="block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-candidate"
              >
                <Card className="h-full transition-colors hover:border-candidate">
                  <CardHeader>
                    <ProjectBadges project={project} />
                    <CardTitle className="mt-2 text-lg">{project.title}</CardTitle>
                    <CardDescription>{ownerLine(project)}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="line-clamp-3 text-sm text-zinc-700">
                      {project.description || project.scenario}
                    </p>
                    <SkillList skills={project.skills} />
                    <TimingLine project={project} />
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
