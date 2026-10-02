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

export interface SubmissionEvaluationResult {
  evidence: {
    skill: string;
    level: EvidenceLevel;
    rationale: string;
  }[];
  followUpQuestions: string[];
}
