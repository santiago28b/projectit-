"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { projectsService } from "@/client/services/projectsService";
import type {
  ExtractedSkills,
  GeneratedProject,
  ProjectIdea,
} from "@/shared/models/ai";
import type {
  ProjectVisibility,
  RubricCriterion,
} from "@/shared/models/domain";

export type CreateMode = "choose" | "manual" | "ai" | "form";

export interface ProjectFormState {
  title: string;
  scenario: string;
  description: string;
  instructions: string;
  skillsText: string;
  expectedDurationMinutes: string;
  difficulty: string;
  deliverablesText: string;
  deadline: string;
  visibility: ProjectVisibility;
  visibilityTarget: string;
  rubric: RubricCriterion[];
}

export const emptyProjectForm = (): ProjectFormState => ({
  title: "",
  scenario: "",
  description: "",
  instructions: "",
  skillsText: "",
  expectedDurationMinutes: "90",
  difficulty: "Intermediate",
  deliverablesText: "Repository URL, Written explanation, Walkthrough video",
  deadline: "",
  visibility: "public",
  visibilityTarget: "",
  rubric: [
    { name: "Correctness", description: "Does the solution work?" },
    { name: "Communication", description: "Is the Walkthrough clear?" },
  ],
});

export function splitList(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function formFromGenerated(project: GeneratedProject): ProjectFormState {
  return {
    ...emptyProjectForm(),
    title: project.title,
    scenario: project.scenario,
    description: project.description,
    instructions: project.instructions,
    skillsText: project.skills.join(", "),
    expectedDurationMinutes: String(project.expectedDurationMinutes),
    difficulty: project.difficulty,
    deliverablesText: project.deliverables.join(", "),
    rubric: project.rubric,
  };
}

export function useCreateProjectViewModel() {
  const router = useRouter();
  const [mode, setMode] = useState<CreateMode>("choose");
  const [form, setForm] = useState<ProjectFormState>(emptyProjectForm);
  const [jobDescription, setJobDescription] = useState("");
  const [skills, setSkills] = useState<ExtractedSkills | null>(null);
  const [ideas, setIdeas] = useState<ProjectIdea[] | null>(null);
  /** True when the last generator step fell back to sample output. */
  const [usedSample, setUsedSample] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const update = useCallback(
    <K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const updateRubric = useCallback(
    (index: number, patch: Partial<RubricCriterion>) => {
      setForm((prev) => ({
        ...prev,
        rubric: prev.rubric.map((item, i) =>
          i === index ? { ...item, ...patch } : item,
        ),
      }));
    },
    [],
  );

  const addRubric = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      rubric: [...prev.rubric, { name: "", description: "" }],
    }));
  }, []);

  const removeRubric = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      rubric: prev.rubric.filter((_, i) => i !== index),
    }));
  }, []);

  const startManual = useCallback(() => {
    setError(null);
    setForm(emptyProjectForm());
    setUsedSample(false);
    setMode("form");
  }, []);

  const startAi = useCallback(() => {
    setError(null);
    setSkills(null);
    setIdeas(null);
    setUsedSample(false);
    setMode("ai");
  }, []);

  const generateIdeas = useCallback(() => {
    startTransition(async () => {
      try {
        setError(null);
        const result = await projectsService.generateFromJob(jobDescription);
        setSkills(result.skills);
        setIdeas(result.ideas);
        setUsedSample(result.source === "sample");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not generate ideas",
        );
      }
    });
  }, [jobDescription]);

  const pickIdea = useCallback((idea: ProjectIdea) => {
    startTransition(async () => {
      try {
        setError(null);
        const generated = await projectsService.expandIdea(idea);
        setUsedSample(generated.source === "sample");
        setForm(formFromGenerated(generated));
        setMode("form");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not expand Project idea",
        );
      }
    });
  }, []);

  const submit = useCallback(
    (publish: boolean) => {
      startTransition(async () => {
        try {
          setError(null);
          const minutes = Number(form.expectedDurationMinutes);
          const project = await projectsService.create({
            title: form.title,
            scenario: form.scenario,
            description: form.description,
            instructions: form.instructions,
            skills: splitList(form.skillsText),
            expectedDurationMinutes: Number.isFinite(minutes) ? minutes : null,
            difficulty: form.difficulty.trim() || null,
            deliverables: splitList(form.deliverablesText),
            deadline: form.deadline
              ? new Date(form.deadline).toISOString()
              : null,
            visibility: form.visibility,
            visibilityTarget: form.visibilityTarget,
            rubric: form.rubric,
            publish,
          });
          router.push(`/company/projects/${project.id}`);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Could not create Project",
          );
        }
      });
    },
    [form, router],
  );

  return {
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
  };
}
