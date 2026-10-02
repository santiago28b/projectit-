import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getAIService } from "./ai";

/** Fake Anthropic Messages API response whose text block is `text`. */
function claudeReplies(text: string, status = 200) {
  return vi.fn(async () =>
    new Response(
      status === 200 ? JSON.stringify({ content: [{ type: "text", text }] }) : "boom",
      { status },
    ),
  );
}

const input = {
  projectSkills: ["Debugging", "Testing", "React"],
  writtenResponse: "Found the date parsing bug, fixed it, added a unit test for the null case.",
  repositoryUrl: "https://github.com/maria/bdt",
};

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getAIService without a key", () => {
  it("uses the mock and never calls the network", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await getAIService().evaluateSubmission(input);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.evidence.map((e) => e.skill)).toEqual(input.projectSkills);
    expect(result.evidence.every((e) => e.level === "partial")).toBe(true);
  });
});

describe("evaluateSubmission with Claude", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    vi.stubEnv("ANTHROPIC_MODEL", "test-model");
  });

  it("sends the key, model and Submission to the Messages API", async () => {
    const fetchMock = claudeReplies('{"evidence":[],"followUpQuestions":["Why?"]}');
    vi.stubGlobal("fetch", fetchMock);

    await getAIService().evaluateSubmission(input);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect((init.headers as Record<string, string>)["x-api-key"]).toBe("test-key");
    const body = JSON.parse(String(init.body));
    expect(body.model).toBe("test-model");
    expect(body.messages[0].content).toContain("Debugging, Testing, React");
    expect(body.messages[0].content).toContain("date parsing bug");
  });

  it("maps Claude's levels onto exactly the Project's skills", async () => {
    vi.stubGlobal(
      "fetch",
      claudeReplies(
        JSON.stringify({
          evidence: [
            { skill: "debugging", level: "strong", rationale: "Explains the root cause." },
            { skill: "Testing", level: "partial", rationale: "One test only." },
            { skill: "Kubernetes", level: "strong", rationale: "Not a Project skill." },
          ],
          followUpQuestions: ["Why parse on the client?", "What edge cases remain?", "How would it scale?"],
        }),
      ),
    );

    const result = await getAIService().evaluateSubmission(input);

    expect(result.evidence).toEqual([
      { skill: "Debugging", level: "strong", rationale: "Explains the root cause." },
      { skill: "Testing", level: "partial", rationale: "One test only." },
      { skill: "React", level: "not_assessed", rationale: "Not enough in the Submission to judge this skill." },
    ]);
    expect(result.followUpQuestions).toHaveLength(3);
  });

  it("tolerates prose and markdown fences around the JSON", async () => {
    vi.stubGlobal(
      "fetch",
      claudeReplies(
        'Here you go:\n```json\n{"evidence":[{"skill":"Testing","level":"strong","rationale":"Good tests."}],"followUpQuestions":["Q1"]}\n```',
      ),
    );
    const result = await getAIService().evaluateSubmission(input);
    expect(result.evidence.find((e) => e.skill === "Testing")?.level).toBe("strong");
  });

  it("turns an invalid level into not_assessed", async () => {
    vi.stubGlobal(
      "fetch",
      claudeReplies('{"evidence":[{"skill":"Testing","level":"93%","rationale":"x"}],"followUpQuestions":["Q"]}'),
    );
    const result = await getAIService().evaluateSubmission(input);
    expect(result.evidence.find((e) => e.skill === "Testing")?.level).toBe("not_assessed");
  });

  it("borrows the mock's follow-up questions when Claude gives none", async () => {
    vi.stubGlobal(
      "fetch",
      claudeReplies('{"evidence":[{"skill":"Testing","level":"strong","rationale":"x"}]}'),
    );
    const result = await getAIService().evaluateSubmission(input);
    expect(result.followUpQuestions.length).toBeGreaterThan(0);
  });

  it.each([
    ["an HTTP error", claudeReplies("", 500)],
    ["a reply with no JSON", claudeReplies("Sorry, I can't help with that.")],
    ["an empty assessment", claudeReplies('{"evidence":[],"followUpQuestions":[]}')],
    ["a network failure", vi.fn(async () => { throw new Error("offline"); })],
  ])("falls back to the mock on %s", async (_label, fetchMock) => {
    vi.stubGlobal("fetch", fetchMock);
    const result = await getAIService().evaluateSubmission(input);
    expect(result.evidence.map((e) => e.skill)).toEqual(input.projectSkills);
    expect(result.evidence[0].rationale).toContain("Mock AI assessment");
    expect(console.warn).toHaveBeenCalled();
  });
});

describe("explainMatch with Claude", () => {
  beforeEach(() => vi.stubEnv("ANTHROPIC_API_KEY", "test-key"));

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

describe("Project generation", () => {
  it("stays mocked even with a key (ticket 08)", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const service = getAIService();
    expect(await service.generateProjectIdeas("jd")).toHaveLength(3);
    expect((await service.extractJobSkills("jd")).required.length).toBeGreaterThan(0);
    expect((await service.generateProject({ title: "T", summary: "S", skills: ["React"] })).title).toBe("T");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
