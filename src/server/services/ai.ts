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
        rationale: "Mock AI assessment — set ANTHROPIC_API_KEY for live calls.",
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

/* ---------------- Live Claude (Anthropic Messages API) ---------------- */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const TIMEOUT_MS = 25_000;
const LEVELS: EvidenceLevel[] = ["strong", "partial", "not_shown", "not_assessed"];

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

const liveAIService: AIService = {
  // Project generation stays mocked for the hackathon (ticket 08).
  extractJobSkills: (d) => mockAIService.extractJobSkills(d),
  generateProjectIdeas: (d) => mockAIService.generateProjectIdeas(d),
  generateProject: (i) => mockAIService.generateProject(i),

  evaluateSubmission(input) {
    return withFallback(
      "evaluateSubmission",
      async () => {
        const raw = await askClaudeForJson<{
          evidence?: { skill?: unknown; level?: unknown; rationale?: unknown }[];
          followUpQuestions?: unknown;
        }>(
          [
            "You assess a Candidate's Submission to a short (1–2 hour) screening Project for Project It.",
            "For EACH listed skill, judge how strongly the Submission shows it:",
            '"strong" = clearly demonstrated with specifics; "partial" = some sign but thin or incomplete;',
            '"not_shown" = the skill was relevant but the Submission shows no sign of it;',
            '"not_assessed" = there is not enough material to judge.',
            "Be fair and evidence-based. Quote or point to what in the Submission supports each level.",
            "Never produce an overall score or percentage. Humans make the hiring decision.",
            "Also write 3 short follow-up interview questions that probe the Candidate's decisions.",
            'JSON shape: {"evidence":[{"skill":string,"level":"strong"|"partial"|"not_shown"|"not_assessed","rationale":string (max 2 sentences)}],"followUpQuestions":[string,string,string]}',
          ].join("\n"),
          [
            `Skills to assess: ${input.projectSkills.join(", ")}`,
            `Repository: ${input.repositoryUrl ?? "(none provided)"}`,
            "Candidate's written explanation:",
            '"""',
            input.writtenResponse.slice(0, 8000) || "(empty)",
            '"""',
          ].join("\n"),
        );

        // Keep exactly the Project's skills, in order; fill gaps as not_assessed.
        const bySkill = new Map(
          (raw.evidence ?? [])
            .filter((e) => typeof e.skill === "string")
            .map((e) => [String(e.skill).trim().toLowerCase(), e]),
        );
        const evidence = input.projectSkills.map((skill) => {
          const e = bySkill.get(skill.trim().toLowerCase());
          const level = LEVELS.includes(e?.level as EvidenceLevel)
            ? (e!.level as EvidenceLevel)
            : "not_assessed";
          const rationale =
            typeof e?.rationale === "string" && e.rationale.trim()
              ? e.rationale.trim()
              : "Not enough in the Submission to judge this skill.";
          return { skill, level, rationale };
        });

        const followUpQuestions = strings(raw.followUpQuestions, 5);
        if (evidence.every((e) => e.level === "not_assessed") && followUpQuestions.length === 0) {
          throw new Error("Claude response was empty");
        }
        return {
          evidence,
          followUpQuestions: followUpQuestions.length
            ? followUpQuestions
            : (await mockAIService.evaluateSubmission(input)).followUpQuestions,
        };
      },
      () => mockAIService.evaluateSubmission(input),
    );
  },

  explainMatch(input) {
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
  },
};

/** Live Claude when ANTHROPIC_API_KEY is set; otherwise the mock. */
export function getAIService(): AIService {
  return env.anthropicApiKey ? liveAIService : mockAIService;
}

export const aiService = getAIService();
