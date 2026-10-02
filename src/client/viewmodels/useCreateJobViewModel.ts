"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { jobsRepo } from "@/client/repos/jobsRepo";
import { splitList } from "@/client/viewmodels/useCreateProjectViewModel";

export interface JobFormState {
  title: string;
  description: string;
  requiredText: string;
  preferredText: string;
}

const emptyForm: JobFormState = {
  title: "",
  description: "",
  requiredText: "",
  preferredText: "",
};

/** Add a skill to a comma-separated field, or remove it if it's already there. */
function toggleSkill(text: string, skill: string): string {
  const skills = splitList(text);
  const has = skills.some((s) => s.toLowerCase() === skill.toLowerCase());
  return (has
    ? skills.filter((s) => s.toLowerCase() !== skill.toLowerCase())
    : [...skills, skill]
  ).join(", ");
}

export function useCreateJobViewModel() {
  const router = useRouter();
  const [form, setForm] = useState<JobFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof JobFormState>(key: K, value: JobFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggle(field: "requiredText" | "preferredText", skill: string) {
    setForm((prev) => ({ ...prev, [field]: toggleSkill(prev[field], skill) }));
  }

  function submit() {
    startTransition(async () => {
      try {
        setError(null);
        const job = await jobsRepo.create({
          title: form.title,
          description: form.description,
          requiredSkills: splitList(form.requiredText),
          preferredSkills: splitList(form.preferredText),
        });
        router.push(`/company/jobs/${job.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create the Job");
      }
    });
  }

  return {
    form,
    update,
    toggle,
    selected: (field: "requiredText" | "preferredText") =>
      new Set(splitList(form[field]).map((s) => s.toLowerCase())),
    submit,
    error,
    isPending,
  };
}
