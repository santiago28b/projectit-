import { env } from "@/server/lib/env";
import { claudeEvaluateSubmission } from "@/server/services/claudeEvaluator";
import {
  claudeGenerateProject,
  claudeIdeasFromJob,
} from "@/server/services/claudeProjectGenerator";
import type { RepoSnapshot } from "@/server/services/repoReader";
import { SEED_SKILLS } from "@/shared/constants/seedIds";
import type {
  ExtractedSkills,
  GeneratedProjectResult,
  ProjectIdea,
  ProjectIdeasResult,
  SubmissionEvaluationResult,
} from "@/shared/models/ai";

export type {
  AISource,
  ExtractedSkills,
  GeneratedProject,
  GeneratedProjectResult,
  ProjectIdea,
  ProjectIdeasResult,
  SubmissionEvaluationResult,
} from "@/shared/models/ai";

export interface EvaluateSubmissionInput {
  projectTitle: string;
  scenario: string;
  /** The Project's skills; the Assessment adds Communication. */
  projectSkills: string[];
  writtenResponse: string;
  repositoryUrl?: string;
  /** What the Candidate said in their Walkthrough, if it could be transcribed. */
  transcript?: string | null;
  /** Why there's no Transcript (shown to the AI so it doesn't guess). */
  transcriptNote?: string;
  /** README, file list and a few files from the repository, if it could be read. */
  repo?: RepoSnapshot | null;
  /** Why the code isn't available. */
  repoNote?: string;
}

/** Every Submission gets Communication Evidence from its Walkthrough. */
export const COMMUNICATION_SKILL = "Communication";

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

/** Communication from the Transcript alone: how much it explains, never how it sounds. */
function mockCommunication(transcript: string | null | undefined) {
  const skill = COMMUNICATION_SKILL;
  if (!transcript?.trim())
    return { skill, level: "not_assessed" as const, rationale: "No Walkthrough Transcript was available." };
  const words = transcript.trim().split(/\s+/).length;
  if (words >= 60 && REASONING_PATTERN.test(transcript))
    return {
      skill,
      level: "strong" as const,
      rationale: "The Walkthrough Transcript explains the approach and the reasons behind the decisions.",
    };
  return {
    skill,
    level: "partial" as const,
    rationale: "The Walkthrough Transcript describes the work but says little about why it was done that way.",
  };
}

/** Deterministic stand-in for the AI: reads the written explanation and Transcript. */
export function mockEvaluateSubmission(
  input: EvaluateSubmissionInput,
): SubmissionEvaluationResult {
  const sentences = [input.writtenResponse, input.transcript ?? ""]
    .join("\n")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const evidence = input.projectSkills.map((skill) => {
    if (skill.trim().toLowerCase() === COMMUNICATION_SKILL.toLowerCase())
      return mockCommunication(input.transcript);
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
  /** Skills plus 3 Project ideas, saying whether they came from the live AI. */
  generateFromJob(jobDescription: string): Promise<ProjectIdeasResult>;
  generateProject(idea: ProjectIdea): Promise<GeneratedProjectResult>;
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
  async generateFromJob(jobDescription) {
    const [skills, ideas] = await Promise.all([
      mockAIService.extractJobSkills(jobDescription),
      mockAIService.generateProjectIdeas(jobDescription),
    ]);
    return { skills, ideas, source: "sample" };
  },
  async generateProject(idea) {
    return {
      source: "sample",
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

/* ---------------- Live Claude (Anthropic Messages API) ---------------- */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const TIMEOUT_MS = 25_000;

/** One Claude call that must answer with JSON only. Throws on any problem. */
async function askClaudeForJson<T>(system: string, user: string, maxTokens = 1200): Promise<T> {
  const apiKey = env.anthropicApiKey;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: env.anthropicModel,
      max_tokens: maxTokens,
      system: `${system}\n\nRespond with a single JSON object and nothing else. No markdown fences.`,
      messages: [{ role: "user", content: user }],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }

  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = (data.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("")
    .trim();
  // Tolerate stray prose or fences around the JSON object.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("Claude returned no JSON");
  return JSON.parse(text.slice(start, end + 1)) as T;
}

/** Run live; on any failure log it and use the mock so the demo never breaks. */
async function withFallback<T>(name: string, live: () => Promise<T>, mock: () => Promise<T>): Promise<T> {
  try {
    return await live();
  } catch (err) {
    console.warn(`[ai] ${name} fell back to mock:`, err instanceof Error ? err.message : err);
    return mock();
  }
}

function strings(v: unknown, max = 10): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "").slice(0, max)
    : [];
}

/** Live Claude for match reasons; falls back to the mock on any failure. */
function liveExplainMatch(input: { context: string; overlappingSkills: string[] }): Promise<string[]> {
  return withFallback(
    "explainMatch",
    async () => {
      const raw = await askClaudeForJson<{ reasons?: unknown }>(
        [
          "You explain why a Candidate and a Project or Job are a good Match on Project It.",
          "Write 1–3 short, plain reasons (max 15 words each) grounded ONLY in the facts given.",
          "Never use percentages or scores.",
          'JSON shape: {"reasons":[string]}',
        ].join("\n"),
        `Context: ${input.context}\nOverlapping skills: ${input.overlappingSkills.join(", ") || "none"}`,
        300,
      );
      const reasons = strings(raw.reasons, 3);
      if (reasons.length === 0) throw new Error("no reasons");
      return reasons;
    },
    () => mockAIService.explainMatch(input),
  );
}

/**
 * Live Claude for `evaluateSubmission`, `explainMatch`, and Project generation
 * when ANTHROPIC_API_KEY is set. Generation falls back to the sample (marked
 * `source: "sample"`) on any failure; callers fall back to the mock when the
 * live evaluateSubmission call fails.
 */
export function getAIService(): AIService {
  const apiKey = env.anthropicApiKey;
  if (!apiKey) return mockAIService;
  return {
    ...mockAIService,
    evaluateSubmission: (input) => claudeEvaluateSubmission(apiKey, input),
    explainMatch: liveExplainMatch,
    generateFromJob: (jobDescription) =>
      withFallback(
        "generateFromJob",
        async () => ({
          ...(await claudeIdeasFromJob(apiKey, jobDescription, SEED_SKILLS)),
          source: "ai" as const,
        }),
        () => mockAIService.generateFromJob(jobDescription),
      ),
    generateProject: (idea) =>
      withFallback(
        "generateProject",
        async () => ({
          ...(await claudeGenerateProject(apiKey, idea, SEED_SKILLS)),
          source: "ai" as const,
        }),
        () => mockAIService.generateProject(idea),
      ),
  };
}

export const aiService = getAIService();
