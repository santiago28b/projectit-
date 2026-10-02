import { afterEach, describe, expect, it, vi } from "vitest";

import { getAIService, mockEvaluateSubmission } from "./ai";
import { claudeEvaluateSubmission } from "./claudeEvaluator";

vi.mock("./claudeEvaluator", () => ({
  claudeEvaluateSubmission: vi.fn(async () => ({
    evidence: [{ skill: "React", level: "strong", rationale: "from Claude" }],
    followUpQuestions: ["q"],
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

  it("keeps everything else mocked even with a key", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test");
    const ideas = await getAIService().generateProjectIdeas("any job");
    expect(ideas).toHaveLength(3);
  });
});
