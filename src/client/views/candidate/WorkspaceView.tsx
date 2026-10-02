"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/client/components/ui/button";
import { useWorkspaceViewModel } from "@/client/viewmodels/useWorkspaceViewModel";
import { SkillList, TimingLine } from "@/client/views/candidate/ProjectLabels";
import type { ProjectResource } from "@/shared/models/projects";

const WALKTHROUGH_PROMPTS = [
  "Your approach: how you understood the problem and where you started",
  "The key decisions you made, and the trade-offs behind them",
  "What went wrong or surprised you, and how you handled it",
  "How you checked that it works",
  "Tools you used (including AI) and how",
  "What you'd improve with more time",
];

const inputClass =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-candidate focus:outline-none focus:ring-1 focus:ring-candidate";

function ResourceList({ title, items }: { title: string; items: ProjectResource[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={item.url}>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-candidate underline-offset-2 hover:underline"
            >
              {item.label} ↗
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function WorkspaceView({ projectId }: { projectId: string }) {
  const vm = useWorkspaceViewModel(projectId);
  const [link, setLink] = useState("");
  const project = vm.project;
  const resources = project?.resources ?? [];

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <Link href={`/candidate/projects/${projectId}`} className="text-sm font-medium text-candidate">
        ← Project details
      </Link>

      {vm.loadError && (
        <p role="alert" className="mt-6 text-sm text-red-700">
          {vm.loadError}
        </p>
      )}
      {vm.isLoading && <p className="mt-6 text-sm text-zinc-500">Loading…</p>}

      {project && !project.mySubmissionId && (
        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_minmax(0,28rem)]">
          <div className="space-y-8">
            <header className="space-y-2">
              <p className="text-sm font-medium text-candidate">Workspace</p>
              <h1 className="text-3xl font-semibold text-zinc-900">{project.title}</h1>
              <TimingLine project={project} />
              <SkillList skills={project.skills} />
            </header>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">Instructions</h2>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-zinc-700">
                {project.instructions
                  .split("\n")
                  .map((line) => line.replace(/^\s*\d+\.\s*/, "").trim())
                  .filter(Boolean)
                  .map((line) => (
                    <li key={line}>{line}</li>
                  ))}
              </ol>
            </section>

            <ResourceList
              title="Starter files"
              items={resources.filter((r) => r.kind === "starter")}
            />
            <ResourceList
              title="Resources"
              items={resources.filter((r) => r.kind === "reference")}
            />
          </div>

          <form
            className="space-y-6 rounded-xl border border-zinc-200 p-6"
            onSubmit={(event) => {
              event.preventDefault();
              void vm.submit();
            }}
          >
            <h2 className="text-xl font-semibold text-zinc-900">Submit your work</h2>

            <label className="block text-sm font-medium text-zinc-900">
              Repository URL
              <input
                type="url"
                className={inputClass}
                placeholder="https://github.com/you/project"
                value={vm.draft.repositoryUrl}
                onChange={(e) => vm.updateDraft({ repositoryUrl: e.target.value })}
              />
            </label>

            <label className="block text-sm font-medium text-zinc-900">
              Written explanation <span className="text-red-700">*</span>
              <textarea
                required
                rows={7}
                className={inputClass}
                placeholder="What did you change, and why?"
                value={vm.draft.writtenResponse}
                onChange={(e) => vm.updateDraft({ writtenResponse: e.target.value })}
              />
            </label>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-zinc-900">Other files (optional)</legend>
              <input
                type="file"
                className="block text-sm"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void vm.addFile(file);
                  e.target.value = "";
                }}
              />
              {vm.files.length > 0 && (
                <ul className="space-y-1 text-sm text-zinc-700">
                  {vm.files.map((f) => (
                    <li key={f.url} className="flex items-center justify-between gap-2">
                      <span className="truncate">{f.name}</span>
                      <button
                        type="button"
                        className="text-xs text-zinc-500 hover:text-red-700"
                        onClick={() => vm.removeFile(f.url)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </fieldset>

            <fieldset className="space-y-3 rounded-lg bg-candidate-soft p-4">
              <legend className="sr-only">Walkthrough video</legend>
              <p className="text-sm font-semibold text-zinc-900">
                Walkthrough video <span className="text-red-700">*</span>
              </p>
              <p className="text-sm text-zinc-700">
                Record up to 2 minutes explaining your work. Cover:
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700">
                {WALKTHROUGH_PROMPTS.map((prompt) => (
                  <li key={prompt}>{prompt}</li>
                ))}
              </ul>

              {vm.walkthrough ? (
                <div className="flex items-center justify-between gap-2 rounded-md bg-white px-3 py-2 text-sm">
                  <span className="truncate text-candidate">✓ {vm.walkthrough.label}</span>
                  <button
                    type="button"
                    className="text-xs text-zinc-500 hover:text-red-700"
                    onClick={vm.clearWalkthrough}
                  >
                    Replace
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    aria-label="Upload Walkthrough video"
                    disabled={vm.progress !== null}
                    className="block text-sm"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void vm.uploadWalkthrough(file);
                    }}
                  />
                  {vm.progress !== null && (
                    <progress
                      className="w-full"
                      value={vm.progress}
                      max={1}
                      aria-label="Uploading Walkthrough"
                    />
                  )}
                  <div className="flex gap-2">
                    <input
                      type="url"
                      className={`${inputClass} mt-0`}
                      placeholder="…or paste a YouTube or Loom link"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                    />
                    <Button type="button" variant="outline" onClick={() => vm.setWalkthroughLink(link)}>
                      Use link
                    </Button>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Uploaded videos are transcribed so your explanation counts. Links can&apos;t be.
                  </p>
                </div>
              )}
              <p className="text-xs text-zinc-600">
                Your Walkthrough will be transcribed and assessed by AI. A person makes every hiring decision.
              </p>
            </fieldset>

            {vm.error && (
              <p role="alert" className="text-sm text-red-700">
                {vm.error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={!vm.canSubmit}
              className="w-full bg-candidate text-white hover:bg-candidate/90"
            >
              {vm.submitting ? "Submitting…" : "Submit Project"}
            </Button>
            {!vm.walkthrough && (
              <p className="text-center text-xs text-zinc-500">
                Add your Walkthrough video to submit. You can submit once.
              </p>
            )}
          </form>
        </div>
      )}
    </main>
  );
}
