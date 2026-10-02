import type { EvidenceLevel } from "@/shared/models/domain";

export interface ExtractedSkills {
  required: string[];
  preferred: string[];
}

export interface ProjectIdea {
  title: string;
  scenario: string;
  skills: string[];
  expectedDurationMinutes: number;
  deliverables: string[];
  /** Why this Project is relevant to the pasted Job description. */
  whyRelevant: string;
}

export interface GeneratedProject {
  title: string;
  scenario: string;
  description: string;
  instructions: string;
  skills: string[];
  expectedDurationMinutes: number;
  difficulty: string;
  deliverables: string[];
  rubric: { name: string; description: string }[];
}

/** Whether output came from the live AI or the canned sample (AI down or no key). */
export type AISource = "ai" | "sample";

export interface ProjectIdeasResult {
  skills: ExtractedSkills;
  ideas: ProjectIdea[];
  source: AISource;
}

export type GeneratedProjectResult = GeneratedProject & { source: AISource };

export interface SubmissionEvaluationResult {
  evidence: {
    skill: string;
    level: EvidenceLevel;
    rationale: string;
  }[];
  followUpQuestions: string[];
}
