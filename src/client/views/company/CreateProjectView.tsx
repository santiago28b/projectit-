"use client";

import Link from "next/link";

import {
  useCreateProjectViewModel,
  type ProjectFormState,
} from "@/client/viewmodels/useCreateProjectViewModel";
import type { ProjectVisibility } from "@/shared/models/domain";

const VISIBILITY_OPTIONS: { value: ProjectVisibility; label: string }[] = [
  { value: "public", label: "Public (Marketplace)" },
  { value: "university", label: "University" },
  { value: "region", label: "Region" },
  { value: "invite", label: "Invite only" },
];

export function CreateProjectView() {
  const vm = useCreateProjectViewModel();
  const {
    mode,
    setMode,
    form,
    jobDescription,
    setJobDescription,
    skills,
    ideas,
    usedSample,
    error,
    isPending,
    update,
    updateRubric,
    addRubric,
    removeRubric,
    startManual,
    startAi,
    generateIdeas,
    pickIdea,
    submit,
  } = vm;

  const needsTarget =
    form.visibility === "university" || form.visibility === "region";

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link href="/company/projects" className="text-sm font-medium text-blue-700">
        ← Projects
      </Link>

      <header className="mt-6 border-b border-zinc-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          Create Project
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900">
          New Company Project
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Create manually, or generate a draft from a Job description.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {mode === "choose" && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={startManual}
            className="rounded-xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-300"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Manual
            </p>
            <h2 className="mt-2 text-lg font-semibold text-zinc-900">
              Create manually
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Fill in the brief, Rubric, and Visibility yourself.
            </p>
          </button>
          <button
            type="button"
            onClick={startAi}
            className="rounded-xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:border-teal-300"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              AI
            </p>
            <h2 className="mt-2 text-lg font-semibold text-zinc-900">
              Generate with AI
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Paste a Job description, pick an idea, then edit before publishing.
            </p>
          </button>
        </div>
      )}

      {mode === "ai" && (
        <section className="mt-8 space-y-6">
          <button
            type="button"
            onClick={() => setMode("choose")}
            className="text-sm font-medium text-zinc-600"
          >
            ← Back to options
          </button>
          <label className="block">
            <span className="text-sm font-medium text-zinc-800">
              Job description
            </span>
            <textarea
              rows={8}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className={`${inputClass} mt-1.5`}
              placeholder="Paste the Job description…"
            />
          </label>
          <button
            type="button"
            disabled={isPending || !jobDescription.trim()}
            onClick={generateIdeas}
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-60"
          >
            {isPending ? "Generating…" : "Extract skills & ideas"}
          </button>

          {usedSample && <SampleNotice />}

          {skills && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                Extracted skills
              </p>
              <p className="mt-2 text-sm text-teal-950">
                <span className="font-medium">Required:</span>{" "}
                {skills.required.join(", ")}
              </p>
              <p className="mt-1 text-sm text-teal-950">
                <span className="font-medium">Preferred:</span>{" "}
                {skills.preferred.join(", ")}
              </p>
            </div>
          )}

          {ideas && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Pick a Project idea
              </h2>
              <ul className="mt-4 space-y-3">
                {ideas.map((idea) => (
                  <li key={idea.title}>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => pickIdea(idea)}
                      className="w-full rounded-xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition hover:border-teal-300 disabled:opacity-60"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span>~{idea.expectedDurationMinutes} min</span>
                      </div>
                      <h3 className="mt-1 font-semibold text-zinc-900">
                        {idea.title}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-600">{idea.scenario}</p>
                      <p className="mt-2 text-sm text-teal-800">{idea.whyRelevant}</p>
                      <p className="mt-2 text-xs text-zinc-500">
                        Skills: {idea.skills.join(", ")}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Deliverables: {idea.deliverables.join(", ")}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {mode === "form" && (
        <form
          className="mt-8 space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            submit(true);
          }}
        >
          <button
            type="button"
            onClick={() => setMode("choose")}
            className="text-sm font-medium text-zinc-600"
          >
            ← Start over
          </button>

          {usedSample && <SampleNotice />}

          <Field label="Title">
            <input
              required
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              className={inputClass}
              placeholder="Broken Delivery Tracker"
            />
          </Field>

          <Field label="Scenario">
            <textarea
              required
              rows={3}
              value={form.scenario}
              onChange={(e) => update("scenario", e.target.value)}
              className={inputClass}
              placeholder="What situation is the Candidate walking into?"
            />
          </Field>

          <Field label="Short description">
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Instructions">
            <textarea
              required
              rows={5}
              value={form.instructions}
              onChange={(e) => update("instructions", e.target.value)}
              className={inputClass}
              placeholder="Step-by-step what they should do…"
            />
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Skills (comma-separated)">
              <input
                required
                value={form.skillsText}
                onChange={(e) => update("skillsText", e.target.value)}
                className={inputClass}
                placeholder="TypeScript, React, Testing"
              />
            </Field>
            <Field label="Deliverables (comma-separated)">
              <input
                required
                value={form.deliverablesText}
                onChange={(e) => update("deliverablesText", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <Field label="Expected duration (minutes)">
              <input
                type="number"
                min={15}
                value={form.expectedDurationMinutes}
                onChange={(e) =>
                  update("expectedDurationMinutes", e.target.value)
                }
                className={inputClass}
              />
            </Field>
            <Field label="Difficulty">
              <input
                value={form.difficulty}
                onChange={(e) => update("difficulty", e.target.value)}
                className={inputClass}
                placeholder="Beginner / Intermediate"
              />
            </Field>
            <Field label="Deadline">
              <input
                type="datetime-local"
                value={form.deadline}
                onChange={(e) => update("deadline", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Visibility">
              <select
                value={form.visibility}
                onChange={(e) =>
                  update(
                    "visibility",
                    e.target.value as ProjectFormState["visibility"],
                  )
                }
                className={inputClass}
              >
                {VISIBILITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
            {needsTarget && (
              <Field
                label={
                  form.visibility === "university"
                    ? "Target university"
                    : "Target region"
                }
              >
                <input
                  required
                  value={form.visibilityTarget}
                  onChange={(e) => update("visibilityTarget", e.target.value)}
                  className={inputClass}
                  placeholder={
                    form.visibility === "university"
                      ? "Arizona State University"
                      : "Southwest"
                  }
                />
              </Field>
            )}
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-zinc-800">
              Rubric categories
            </legend>
            <div className="mt-3 space-y-3">
              {form.rubric.map((criterion, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:grid-cols-[1fr_2fr_auto]"
                >
                  <input
                    required
                    value={criterion.name}
                    onChange={(e) =>
                      updateRubric(index, { name: e.target.value })
                    }
                    className={inputClass}
                    placeholder="Category name"
                  />
                  <input
                    required
                    value={criterion.description}
                    onChange={(e) =>
                      updateRubric(index, { description: e.target.value })
                    }
                    className={inputClass}
                    placeholder="What good looks like"
                  />
                  <button
                    type="button"
                    onClick={() => removeRubric(index)}
                    disabled={form.rubric.length <= 1}
                    className="text-sm text-zinc-500 hover:text-red-600 disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addRubric}
              className="mt-3 text-sm font-medium text-blue-700"
            >
              + Add category
            </button>
          </fieldset>

          <div className="flex flex-wrap gap-3 border-t border-zinc-200 pt-6">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {isPending ? "Saving…" : "Publish Project"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => submit(false)}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
            >
              Save draft
            </button>
          </div>
        </form>
      )}
    </main>
  );
}

/** Never let canned output pass for a live AI result. */
function SampleNotice() {
  return (
    <p
      role="status"
      className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
    >
      The AI is unavailable right now, so these are sample ideas, not ones
      written for your Job description. Edit them freely, or try again later.
    </p>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
