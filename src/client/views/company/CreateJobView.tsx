"use client";

import Link from "next/link";

import { useCreateJobViewModel } from "@/client/viewmodels/useCreateJobViewModel";
import { SEED_SKILLS } from "@/shared/constants/seedIds";

export function CreateJobView() {
  const { form, update, toggle, selected, submit, error, isPending } =
    useCreateJobViewModel();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link href="/company" className="text-sm font-medium text-blue-700">
        ← Dashboard
      </Link>

      <header className="mt-6 border-b border-zinc-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          New Job
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900">Create a Job</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Describe the role by the skills it needs. Project It matches it to
          Projects that test those skills and to Candidates who have shown them.
        </p>
      </header>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <form
        className="mt-8 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Field label="Title">
          <input
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className={inputClass}
            placeholder="Software Engineering Intern"
          />
        </Field>

        <Field label="Description">
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className={inputClass}
            placeholder="What will this person work on?"
          />
        </Field>

        <SkillField
          label="Required skills (comma-separated)"
          value={form.requiredText}
          onChange={(value) => update("requiredText", value)}
          onToggle={(skill) => toggle("requiredText", skill)}
          selected={selected("requiredText")}
          required
        />

        <SkillField
          label="Preferred skills (comma-separated)"
          value={form.preferredText}
          onChange={(value) => update("preferredText", value)}
          onToggle={(skill) => toggle("preferredText", skill)}
          selected={selected("preferredText")}
        />

        <div className="border-t border-zinc-200 pt-6">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {isPending ? "Creating…" : "Create Job"}
          </button>
        </div>
      </form>
    </main>
  );
}

/** Skills match Projects by exact name, so offer the platform's spellings as chips. */
function SkillField({
  label,
  value,
  onChange,
  onToggle,
  selected,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onToggle: (skill: string) => void;
  selected: Set<string>;
  required?: boolean;
}) {
  return (
    <div>
      <Field label={label}>
        <input
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
          placeholder="TypeScript, React, Testing"
        />
      </Field>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {SEED_SKILLS.map((skill) => {
          const on = selected.has(skill.toLowerCase());
          return (
            <button
              key={skill}
              type="button"
              onClick={() => onToggle(skill)}
              aria-pressed={on}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition ${
                on
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-zinc-300 bg-white text-zinc-700 hover:border-blue-400"
              }`}
            >
              {skill}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
