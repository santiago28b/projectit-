import { env } from "@/server/lib/env";
import type {
  ExtractedSkills,
  GeneratedProject,
  ProjectIdea,
  SubmissionEvaluationResult,
} from "@/shared/models/ai";

export type {
  ExtractedSkills,
  GeneratedProject,
  ProjectIdea,
  SubmissionEvaluationResult,
} from "@/shared/models/ai";

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
        scenario:
          "Dispatchers say packages show as Delivered before the driver arrives, and the list blanks after refresh.",
        skills: ["TypeScript", "React", "REST APIs", "Debugging", "Testing"],
        expectedDurationMinutes: 90,
        deliverables: [
          "Repository URL",
          "Written explanation",
          "Walkthrough video",
        ],
        whyRelevant:
          "Screens debugging and front-end skills the Job asks for in a realistic ops incident.",
      },
      {
        title: "API Contract Fix",
        scenario:
          "The mobile app and the REST API disagree on delivery statuses after a schema change.",
        skills: ["REST APIs", "TypeScript", "Testing"],
        expectedDurationMinutes: 75,
        deliverables: ["Repository URL", "Walkthrough video"],
        whyRelevant:
          "Tests whether they can reconcile API contracts and cover the fix with tests.",
      },
      {
        title: "Status Badge Suite",
        scenario:
          "Support needs clear status badges for delayed, out-for-delivery, and failed drops.",
        skills: ["React", "Testing", "Debugging"],
        expectedDurationMinutes: 60,
        deliverables: [
          "Repository URL",
          "Written explanation",
          "Walkthrough video",
        ],
        whyRelevant:
          "Focuses on UI clarity and tests without needing a full stack rebuild.",
      },
    ];
  },
  async generateProject(idea) {
    return {
      title: idea.title,
      scenario: idea.scenario,
      description: idea.whyRelevant,
      instructions: [
        "1. Clone the starter and reproduce the issue.",
        "2. Fix the root cause with the smallest clear change.",
        "3. Add tests that would have caught it.",
        "4. Record a Walkthrough covering approach, decisions, and trade-offs.",
      ].join("\n"),
      skills: idea.skills,
      expectedDurationMinutes: idea.expectedDurationMinutes,
      difficulty: "Intermediate",
      deliverables: idea.deliverables,
      rubric: [
        {
          name: "Correctness",
          description: "The reported issue is fixed and nothing else broke.",
        },
        {
          name: "Debugging approach",
          description: "Found the root cause methodically instead of guessing.",
        },
        {
          name: "Testing",
          description: "Tests would catch a regression of this bug.",
        },
        {
          name: "Communication",
          description:
            "The Walkthrough explains decisions and trade-offs clearly.",
        },
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
