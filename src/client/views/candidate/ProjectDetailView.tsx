"use client";

import Link from "next/link";

import { buttonVariants } from "@/client/components/ui/button";
import { cn } from "@/client/lib/utils";
import { useProjectDetailViewModel } from "@/client/viewmodels/useProjectDetailViewModel";
import {
  ownerLine,
  ProjectBadges,
  SkillList,
  TimingLine,
} from "@/client/views/candidate/ProjectLabels";

export function ProjectDetailView({ projectId }: { projectId: string }) {
  const { project, error, isLoading } = useProjectDetailViewModel(projectId);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link
        href="/candidate/marketplace"
        className="text-sm font-medium text-candidate"
      >
        ← Marketplace
      </Link>

      {error && (
        <p role="alert" className="mt-6 text-sm text-red-700">
          {error}
        </p>
      )}
      {isLoading && <p className="mt-6 text-sm text-zinc-500">Loading…</p>}

      {project && (
        <article className="mt-6 space-y-8">
          <header className="space-y-3">
            <ProjectBadges project={project} />
            <h1 className="text-3xl font-semibold text-zinc-900">
              {project.title}
            </h1>
            <p className="text-zinc-600">{ownerLine(project)}</p>
            <TimingLine project={project} />
          </header>

          <section aria-labelledby="scenario">
            <h2 id="scenario" className="text-lg font-semibold text-zinc-900">
              Scenario
            </h2>
            <p className="mt-2 text-zinc-700">{project.scenario}</p>
            {project.description && (
              <p className="mt-2 text-zinc-700">{project.description}</p>
            )}
          </section>

          <section aria-labelledby="skills">
            <h2 id="skills" className="text-lg font-semibold text-zinc-900">
              Skills evaluated
            </h2>
            <div className="mt-2">
              <SkillList skills={project.skills} />
            </div>
          </section>

          <section aria-labelledby="deliverables">
            <h2 id="deliverables" className="text-lg font-semibold text-zinc-900">
              What you&apos;ll submit
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-700">
              {project.deliverables.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          {project.rubric.length > 0 && (
            <section aria-labelledby="rubric">
              <h2 id="rubric" className="text-lg font-semibold text-zinc-900">
                How it&apos;s reviewed
              </h2>
              <dl className="mt-2 space-y-2">
                {project.rubric.map((criterion) => (
                  <div key={criterion.name}>
                    <dt className="font-medium text-zinc-900">{criterion.name}</dt>
                    <dd className="text-sm text-zinc-600">
                      {criterion.description}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <div className="border-t pt-6">
            {project.mySubmissionId ? (
              <div className="flex flex-wrap items-center gap-4">
                <p className="font-medium text-candidate">Submitted</p>
                <Link
                  href={`/candidate/submissions/${project.mySubmissionId}`}
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  View your Evidence
                </Link>
              </div>
            ) : (
              <Link
                href={`/candidate/projects/${project.id}/workspace`}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-candidate text-white hover:bg-candidate/90",
                )}
              >
                Start Project
              </Link>
            )}
          </div>
        </article>
      )}
    </main>
  );
}
