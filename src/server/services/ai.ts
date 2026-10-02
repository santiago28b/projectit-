import { env } from "@/server/lib/env";
import { claudeEvaluateSubmission } from "@/server/services/claudeEvaluator";
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

export interface EvaluateSubmissionInput {
  projectTitle: string;
  scenario: string;
  projectSkills: string[];
  writtenResponse: string;
  repositoryUrl?: string;
}

/** Words that show a skill was used, beyond the skill's own name. */
const SKILL_TERMS: Record<string, string[]> = {
  typescript: ["typescript", "typed", "types", "interface"],
  react: ["react", "component", "hook", "useeffect", "usestate", "render"],
  "rest apis": ["api", "endpoint", "fetch", "request", "response", "rest"],
  debugging: ["debug", "bug", "root cause", "reproduc", "breakpoint", "trace"],
  testing: ["test", "vitest", "jest", "coverage", "regression"],
  sql: ["sql", "query", "join", "select", "group by"],
  python: ["python", "pandas", "notebook"],
  "data cleaning": ["clean", "dedup", "duplicate", "missing", "normaliz"],
  "data visualization": ["chart", "plot", "graph", "visual", "dashboard"],
  "product thinking": ["user", "customer", "impact", "goal", "outcome"],
  prioritization: ["priorit", "rank", "rice", "cut", "defer"],
  "written communication": ["explain", "summary", "plan", "document"],
  "node.js": ["node", "express", "server"],
  accessibility: ["accessib", "a11y", "aria", "screen reader", "focus", "keyboard", "label"],
};

/** Signs the Candidate explained *why*, not just *what*. */
const REASONING = [
  "because", "root cause", "trade-off", "tradeoff", "so that", "instead of",
  "decided", "which meant", "the reason", "to avoid", "caused by",
];

const FOLLOW_UPS: Record<string, string> = {
  typescript: "Where did the type system catch (or miss) a bug in this Project?",
  react: "How would this component behave if the data loaded twice or out of order?",
  "rest apis": "What would you change if the API started returning partial or slow responses?",
  debugging: "Walk me through how you narrowed down the root cause. What did you rule out first?",
  testing: "Which test would have caught the original bug, and what's still untested?",
  sql: "How would your query perform with ten times the data?",
  python: "What would you change to make this analysis repeatable next week?",
  "data cleaning": "Which cleaning decision were you least sure about, and how would you check it?",
  "data visualization": "Why did you pick these charts over the alternatives?",
  "product thinking": "Who loses out under your plan, and how would you explain that to them?",
  prioritization: "What would make you move the item you cut back into the plan?",
  "written communication": "If a busy manager reads only one paragraph, which one should it be?",
  "node.js": "How does your server behave when two requests change the same record?",
  accessibility: "How did you verify the fixes with a screen reader or keyboard only?",
};

const GENERIC_FOLLOW_UPS = [
  "What trade-off did you make that you'd revisit with more time?",
  "How would you harden this for production?",
];

/** Matches each term at the start of a word ("test" hits "tests", not "latest"). */
function wordStart(terms: string[]): RegExp {
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`\\b(?:${escaped.join("|")})`, "i");
}

const REASONING_PATTERN = wordStart(REASONING);

function patternFor(skill: string): RegExp {
  const key = skill.trim().toLowerCase();
  return wordStart(SKILL_TERMS[key] ?? [key]);
}

function snippet(sentence: string): string {
  const clean = sentence.trim().replace(/\s+/g, " ");
  return clean.length > 90 ? `${clean.slice(0, 87)}…` : clean;
}

/** Deterministic stand-in for the AI: reads the written explanation only. */
export function mockEvaluateSubmission(
  input: EvaluateSubmissionInput,
): SubmissionEvaluationResult {
  const sentences = input.writtenResponse
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const evidence = input.projectSkills.map((skill) => {
    const pattern = patternFor(skill);
    const mentions = sentences.filter((s) => pattern.test(s));
    const reasoned = mentions.find((s) => REASONING_PATTERN.test(s));
    if (reasoned)
      return {
        skill,
        level: "strong" as const,
        rationale: `Explains the ${skill} work and the reasoning behind it: "${snippet(reasoned)}"`,
      };
    if (mentions.length > 0)
      return {
        skill,
        level: "partial" as const,
        rationale: `Mentions ${skill} work ("${snippet(mentions[0])}") but doesn't explain why it was done that way.`,
      };
    return {
      skill,
      level: "not_shown" as const,
      rationale: `The written explanation doesn't show ${skill}. The Walkthrough may cover it.`,
    };
  });

  const shown = evidence.filter((e) => e.level !== "not_shown");
  const followUpQuestions = [
    ...shown.map((e) => FOLLOW_UPS[e.skill.trim().toLowerCase()]).filter(Boolean),
    ...GENERIC_FOLLOW_UPS,
  ].slice(0, 3);

  return { evidence, followUpQuestions };
}

/**
 * AI seam. Mock runs whenever there is no API key or a call fails.
 */
export interface AIService {
  extractJobSkills(jobDescription: string): Promise<ExtractedSkills>;
  generateProjectIdeas(jobDescription: string): Promise<ProjectIdea[]>;
  generateProject(idea: ProjectIdea): Promise<GeneratedProject>;
  evaluateSubmission(
    input: EvaluateSubmissionInput,
  ): Promise<SubmissionEvaluationResult>;
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
    return mockEvaluateSubmission(input);
  },
  async explainMatch(input) {
    return [
      `Overlaps on ${input.overlappingSkills.join(", ") || "related skills"}`,
      input.context,
    ];
  },
};

/**
 * Live Claude for `evaluateSubmission` when ANTHROPIC_API_KEY is set.
 * Everything else stays mocked for now (project generation is faked by design).
 * Callers fall back to the mock when the live call fails.
 */
export function getAIService(): AIService {
  const apiKey = env.anthropicApiKey;
  if (!apiKey) return mockAIService;
  return {
    ...mockAIService,
    evaluateSubmission: (input) => claudeEvaluateSubmission(apiKey, input),
  };
}

export const aiService = getAIService();
