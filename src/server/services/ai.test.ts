import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getAIService, mockEvaluateSubmission } from "./ai";
import { claudeEvaluateSubmission } from "./claudeEvaluator";
import { claudeGenerateProject, claudeIdeasFromJob } from "./claudeProjectGenerator";

vi.mock("./claudeEvaluator", () => ({
  claudeEvaluateSubmission: vi.fn(async () => ({
    evidence: [{ skill: "React", level: "strong", rationale: "from Claude" }],
    followUpQuestions: ["q"],
  })),
}));

const liveIdea = {
  title: "Fix the Route Optimizer",
  scenario: "Drivers get routes that double back.",
  skills: ["TypeScript", "Debugging"],
  expectedDurationMinutes: 90,
  deliverables: ["Repository URL", "Walkthrough video"],
  whyRelevant: "Matches the routing work in the Job.",
};

vi.mock("./claudeProjectGenerator", () => ({
  claudeIdeasFromJob: vi.fn(async () => ({
    skills: { required: ["TypeScript"], preferred: [] },
    ideas: [liveIdea],
  })),
  claudeGenerateProject: vi.fn(async () => ({
    ...liveIdea,
    description: "d",
    instructions: "1. Do it",
    difficulty: "Intermediate",
    rubric: [{ name: "Correctness", description: "Works" }],
  })),
}));

const base = {
  projectTitle: "Broken Delivery Tracker",
  scenario: "Statuses are wrong.",
  projectSkills: ["React", "Debugging", "Testing"],
};

function levels(writtenResponse: string, projectSkills = base.projectSkills) {
  const result = mockEvaluateSubmission({ ...base, projectSkills, writtenResponse });
  return Object.fromEntries(result.evidence.map((e) => [e.skill, e.level]));
}

describe("mock evaluateSubmission", () => {
  it("rates a skill strong when the Candidate explains why", () => {
    expect(levels("I fixed the React component because it read the wrong field.").React).toBe("strong");
  });

  it("rates a skill partial when it's only mentioned", () => {
    expect(levels("I changed a React component.").React).toBe("partial");
  });

  it("rates a skill not shown when nothing points to it", () => {
    expect(levels("I updated the README.").Testing).toBe("not_shown");
  });

  it("matches related words, not just the skill name", () => {
    expect(levels("Added Vitest coverage.").Testing).toBe("partial");
    expect(levels("Found the root cause of the bug because the cache was stale.").Debugging).toBe("strong");
  });

  it("only matches at the start of a word ('test' doesn't match 'latest')", () => {
    expect(levels("I read the latest docs and the contest rules.").Testing).toBe("not_shown");
  });

  it("returns one entry per Project skill, in the Project's order", () => {
    const result = mockEvaluateSubmission({ ...base, writtenResponse: "anything" });
    expect(result.evidence.map((e) => e.skill)).toEqual(base.projectSkills);
  });

  it("handles a skill it has no word list for", () => {
    expect(levels("I used Rust for the parser.", ["Rust"]).Rust).toBe("partial");
  });

  it("quotes the Candidate in the rationale for shown skills", () => {
    const [react] = mockEvaluateSubmission({
      ...base,
      projectSkills: ["React"],
      writtenResponse: "I fixed the React list because it re-rendered too often.",
    }).evidence;
    expect(react.rationale).toContain("re-rendered too often");
  });

  it("writes 2-3 follow-up questions, favoring skills the Candidate showed", () => {
    const { followUpQuestions } = mockEvaluateSubmission({
      ...base,
      writtenResponse: "I traced the bug to its root cause because the list went blank.",
    });
    expect(followUpQuestions.length).toBeGreaterThanOrEqual(2);
    expect(followUpQuestions.length).toBeLessThanOrEqual(3);
    expect(followUpQuestions[0]).toMatch(/root cause/i);
  });

  it("never produces a score or percentage", () => {
    const result = mockEvaluateSubmission({
      ...base,
      writtenResponse: "I fixed React and Debugging issues because they broke tests.",
    });
    expect(JSON.stringify(result)).not.toMatch(/\d+\s*%|score/i);
  });
});

describe("getAIService", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(claudeEvaluateSubmission).mockClear();
  });

  it("uses the mock when ANTHROPIC_API_KEY is unset", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const result = await getAIService().evaluateSubmission({ ...base, writtenResponse: "React work." });
    expect(claudeEvaluateSubmission).not.toHaveBeenCalled();
    expect(result.evidence).toHaveLength(3);
  });

  it("uses Claude for evaluateSubmission when ANTHROPIC_API_KEY is set", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test");
    const input = { ...base, writtenResponse: "React work." };
    const result = await getAIService().evaluateSubmission(input);
    expect(claudeEvaluateSubmission).toHaveBeenCalledWith("sk-ant-test", input);
    expect(result.evidence[0].rationale).toBe("from Claude");
  });

});

describe("Project generation", () => {
  beforeEach(() => vi.spyOn(console, "warn").mockImplementation(() => {}));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.mocked(claudeIdeasFromJob).mockClear();
    vi.mocked(claudeGenerateProject).mockClear();
  });

  it("returns sample ideas, labeled as samples, when ANTHROPIC_API_KEY is unset", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const result = await getAIService().generateFromJob("any job");
    expect(claudeIdeasFromJob).not.toHaveBeenCalled();
    expect(result.source).toBe("sample");
    expect(result.ideas).toHaveLength(3);
  });

  it("uses Claude for ideas and the full Project when ANTHROPIC_API_KEY is set", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test");
    const ai = getAIService();
    const result = await ai.generateFromJob("Routing intern");
    expect(claudeIdeasFromJob).toHaveBeenCalledWith("sk-ant-test", "Routing intern", expect.any(Array));
    expect(result).toMatchObject({ source: "ai", ideas: [liveIdea] });
    const project = await ai.generateProject(liveIdea);
    expect(project).toMatchObject({ source: "ai", title: "Fix the Route Optimizer" });
  });

  it("falls back to labeled samples when Claude fails", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test");
    vi.mocked(claudeIdeasFromJob).mockRejectedValueOnce(new Error("timeout"));
    vi.mocked(claudeGenerateProject).mockRejectedValueOnce(new Error("timeout"));
    const ai = getAIService();
    expect((await ai.generateFromJob("any job")).source).toBe("sample");
    const project = await ai.generateProject(liveIdea);
    expect(project.source).toBe("sample");
    expect(project.rubric.length).toBeGreaterThan(0);
  });
});

/** Fake Anthropic Messages API response whose text block is `text`. */
function claudeReplies(text: string, status = 200) {
  return vi.fn(async () =>
    new Response(
      status === 200 ? JSON.stringify({ content: [{ type: "text", text }] }) : "boom",
      { status },
    ),
  );
}

describe("explainMatch with Claude", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns at most 3 reasons", async () => {
    vi.stubGlobal("fetch", claudeReplies('{"reasons":["a","b","c","d"]}'));
    expect(await getAIService().explainMatch({ context: "ctx", overlappingSkills: ["React"] })).toEqual(["a", "b", "c"]);
  });

  it("falls back to the mock when Claude returns no reasons", async () => {
    vi.stubGlobal("fetch", claudeReplies('{"reasons":[]}'));
    const reasons = await getAIService().explainMatch({ context: "ctx", overlappingSkills: ["React"] });
    expect(reasons[0]).toBe("Overlaps on React");
  });
});

describe("mock Communication Evidence", () => {
  it("is not assessed without a Transcript, and judged from the Transcript when there is one", async () => {
    const { mockEvaluateSubmission } = await import("./ai");
    const base = { projectTitle: "P", scenario: "S", projectSkills: ["Communication"], writtenResponse: "Fixed it." };
    expect(mockEvaluateSubmission({ ...base, transcript: null }).evidence[0].level).toBe("not_assessed");
    expect(mockEvaluateSubmission({ ...base, transcript: "I changed the label." }).evidence[0].level).toBe("partial");
    const long = `${"I walked through the code and the data flow step by step. ".repeat(8)}I chose AbortController because stale responses overwrote new ones.`;
    expect(mockEvaluateSubmission({ ...base, transcript: long }).evidence[0].level).toBe("strong");
  });

  it("uses the Transcript as Evidence for technical skills too", async () => {
    const { mockEvaluateSubmission } = await import("./ai");
    const result = mockEvaluateSubmission({
      projectTitle: "P",
      scenario: "S",
      projectSkills: ["Testing"],
      writtenResponse: "Fixed the status label.",
      transcript: "I added a regression test because the bug came back twice.",
    });
    expect(result.evidence[0].level).toBe("strong");
  });
});
