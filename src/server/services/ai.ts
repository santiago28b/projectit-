import { env } from "@/server/lib/env";
import type { EvidenceLevel } from "@/server/models/domain";

export interface ExtractedSkills {
  required: string[];
  preferred: string[];
}

export interface ProjectIdea {
  title: string;
  summary: string;
  skills: string[];
}

export interface GeneratedProject {
  title: string;
  scenario: string;
  instructions: string;
  skills: string[];
  expectedDurationMinutes: number;
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

/**
 * AI seam. Mock runs whenever there is no API key or a call fails.
 */
export interface AIService {
  extractJobSkills(jobDescription: string): Promise<ExtractedSkills>;
  generateProjectIdeas(jobDescription: string): Promise<ProjectIdea[]>;
  generateProject(idea: ProjectIdea): Promise<GeneratedProject>;
  evaluateSubmission(input: {
    projectSkills: string[];
    writtenResponse: string;
    repositoryUrl?: string;
  }): Promise<SubmissionEvaluationResult>;
  explainMatch(input: {
    context: string;
    overlappingSkills: string[];
  }): Promise<string[]>;
}

const mockAIService: AIService = {
  async extractJobSkills() {
    return {
      required: ["TypeScript", "React", "REST APIs"],
      preferred: ["Debugging", "Testing"],
    };
  },
  async generateProjectIdeas() {
    return [
      {
        title: "Broken Delivery Tracker",
        summary: "Debug a failing logistics dashboard.",
        skills: ["TypeScript", "React", "Debugging"],
      },
      {
        title: "API Contract Fix",
        summary: "Repair mismatched REST responses.",
        skills: ["REST APIs", "Testing"],
      },
      {
        title: "Status Badges",
        summary: "Add delivery status UI with tests.",
        skills: ["React", "Testing"],
      },
    ];
  },
  async generateProject(idea) {
    return {
      title: idea.title,
      scenario: idea.summary,
      instructions: "Complete the task and record a Walkthrough.",
      skills: idea.skills,
      expectedDurationMinutes: 90,
      deliverables: ["Repository URL", "Written explanation", "Walkthrough"],
      rubric: [
        { name: "Correctness", description: "Does the solution work?" },
        { name: "Clarity", description: "Is the Walkthrough clear?" },
      ],
    };
  },
  async evaluateSubmission(input) {
    return {
      evidence: input.projectSkills.map((skill) => ({
        skill,
        level: "partial" as const,
        rationale: "Mock AI assessment — set OPENAI_API_KEY for live calls.",
      })),
      followUpQuestions: [
        "What trade-offs did you make?",
        "How would you harden this for production?",
      ],
    };
  },
  async explainMatch(input) {
    return [
      `Overlaps on ${input.overlappingSkills.join(", ") || "related skills"}`,
      input.context,
    ];
  },
};

export function getAIService(): AIService {
  if (!env.openaiApiKey) {
    return mockAIService;
  }
  // Live provider wiring lands in a later issue; keep mock until then.
  return mockAIService;
}

export const aiService = getAIService();
