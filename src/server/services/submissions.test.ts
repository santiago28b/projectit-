import { describe, expect, it, vi } from "vitest";

import type { NewSubmission, SubmissionsDao } from "@/server/database/dao/pg/submissions";
import type { AIService } from "@/server/services/ai";
import type { Candidate, Project, Submission } from "@/shared/models/domain";

import { createSubmissionsService, SubmissionError } from "./submissions";

vi.mock("@/server/database/dao", () => ({ projectsDao: {}, submissionsDao: {} }));

const maria = { id: "maria" } as Candidate;

const project: Project = {
  id: "bdt",
  title: "Broken Delivery Tracker",
  scenario: "Dispatchers see wrong statuses.",
  description: "",
  instructions: "",
  type: "platform",
  visibility: "public",
  visibilityTarget: null,
  expectedDurationMinutes: 90,
  difficulty: null,
  skills: ["React", "Debugging", "Testing"],
  deliverables: [],
  deadline: "2026-10-16T00:00:00Z",
  status: "published",
  createdBy: "platform",
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
};

const goodInput = {
  projectId: "bdt",
  writtenResponse:
    "The list went blank because a React effect refetched with a stale cursor, so I traced the bug to its root cause. I added a Vitest regression test.",
  repositoryUrl: "https://github.com/maria/bdt",
  videoUrl: "http://localhost:3000/api/uploads/walkthrough.mp4",
};

function setup(
  options: {
    existingId?: string | null;
    ai?: AIService;
    eligible?: boolean;
    project?: Project;
    findMine?: SubmissionsDao["findMine"];
  } = {},
) {
  const writes: NewSubmission[] = [];
  const current = options.project ?? project;
  const dao = {
    findProject: async (id: string) => (id === current.id ? current : null),
    findId: async () => options.existingId ?? null,
    createWithEvidence: async (input: NewSubmission) => {
      writes.push(input);
      return { id: "sub-1", ...input } as unknown as Submission;
    },
    listMine: async () => [],
    findMine: options.findMine ?? (async () => null),
  } as unknown as SubmissionsDao;
  const ai: AIService =
    options.ai ??
    ({
      evaluateSubmission: async () => ({
        evidence: [
          { skill: "debugging", level: "strong", rationale: "Found the root cause." },
          { skill: "React", level: "partial", rationale: "Touched the effect." },
        ],
        followUpQuestions: ["How did you find the stale cursor?"],
      }),
    } as unknown as AIService);
  const service = createSubmissionsService({
    dao,
    ai,
    projects: { canStart: async () => options.eligible ?? true },
    now: () => new Date("2026-10-02T12:00:00Z"),
  });
  return { service, writes };
}

async function rejection(promise: Promise<unknown>) {
  const err = await promise.catch((e: unknown) => e);
  expect(err).toBeInstanceOf(SubmissionError);
  return err as SubmissionError;
}

describe("submitting a Project", () => {
  it("requires a Walkthrough and writes nothing without one", async () => {
    const { service, writes } = setup();
    const err = await rejection(service.submit(maria, { ...goodInput, videoUrl: "" }));
    expect(err.status).toBe(400);
    expect(writes).toHaveLength(0);
  });

  it("rejects a second Submission to the same Project", async () => {
    const { service, writes } = setup({ existingId: "sub-0" });
    const err = await rejection(service.submit(maria, goodInput));
    expect(err.status).toBe(409);
    expect(writes).toHaveLength(0);
  });

  it("turns a duplicate-key race in the database into the same rejection", async () => {
    const racing = createSubmissionsService({
      dao: {
        findProject: async () => project,
        findId: async () => null,
        createWithEvidence: async () => {
          throw Object.assign(new Error("duplicate key"), { code: "23505" });
        },
      } as unknown as SubmissionsDao,
      ai: { evaluateSubmission: async () => ({ evidence: [], followUpQuestions: [] }) } as unknown as AIService,
      projects: { canStart: async () => true },
      now: () => new Date("2026-10-02T12:00:00Z"),
    });
    expect((await rejection(racing.submit(maria, goodInput))).status).toBe(409);
  });

  it("writes AI-assessed Evidence for every Project skill, plus follow-up questions", async () => {
    const { service, writes } = setup();
    await service.submit(maria, goodInput);
    expect(writes[0].evidence).toEqual([
      { skill: "React", level: "partial", rationale: "Touched the effect." },
      { skill: "Debugging", level: "strong", rationale: "Found the root cause." },
      { skill: "Testing", level: "not_assessed", rationale: "" },
    ]);
    expect(writes[0].followUpQuestions).toEqual(["How did you find the stale cursor?"]);
  });

  it("falls back to the mock when the AI fails", async () => {
    const failing = {
      evaluateSubmission: async () => {
        throw new Error("API down");
      },
    } as unknown as AIService;
    const { service, writes } = setup({ ai: failing });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await service.submit(maria, goodInput);
    const levels = Object.fromEntries(writes[0].evidence.map((e) => [e.skill, e.level]));
    expect(levels).toEqual({ React: "strong", Debugging: "strong", Testing: "partial" });
    expect(writes[0].followUpQuestions.length).toBeGreaterThan(0);
  });

  it("rejects a Project the Candidate isn't eligible for", async () => {
    const { service, writes } = setup({ eligible: false });
    expect((await rejection(service.submit(maria, goodInput))).status).toBe(403);
    expect(writes).toHaveLength(0);
  });
});

describe("submit input rules", () => {
  it.each([
    ["an empty written explanation", { writtenResponse: "   " }],
    ["a written explanation over 10,000 characters", { writtenResponse: "x".repeat(10_001) }],
    ["a repository URL that isn't http(s)", { repositoryUrl: "javascript:alert(1)" }],
    ["a Walkthrough link that isn't http(s)", { videoUrl: "file:///C:/video.mp4" }],
    ["an attached file URL that isn't http(s)", { fileUrls: ["ftp://example.com/a.zip"] }],
    ["more than 10 attached files", { fileUrls: Array(11).fill("https://example.com/a.pdf") }],
  ])("rejects %s with 400 and writes nothing", async (_label, change) => {
    const { service, writes } = setup();
    const err = await rejection(service.submit(maria, { ...goodInput, ...change }));
    expect(err.status).toBe(400);
    expect(writes).toHaveLength(0);
  });

  it("accepts a submission without a repository URL", async () => {
    const { service, writes } = setup();
    await service.submit(maria, { ...goodInput, repositoryUrl: "" });
    expect(writes[0].repositoryUrl).toBeNull();
  });

  it("trims the written explanation before saving", async () => {
    const { service, writes } = setup();
    await service.submit(maria, { ...goodInput, writtenResponse: "  Fixed the bug.  " });
    expect(writes[0].writtenResponse).toBe("Fixed the bug.");
  });

  it("returns 404 for a Project that doesn't exist", async () => {
    const { service } = setup();
    const err = await rejection(service.submit(maria, { ...goodInput, projectId: "missing" }));
    expect(err.status).toBe(404);
  });

  it("rejects a Submission after the deadline", async () => {
    const { service, writes } = setup({
      project: { ...project, deadline: "2026-10-01T00:00:00Z" },
    });
    const err = await rejection(service.submit(maria, goodInput));
    expect(err.status).toBe(403);
    expect(err.message).toMatch(/deadline/);
    expect(writes).toHaveLength(0);
  });

  it("allows a Project with no deadline", async () => {
    const { service, writes } = setup({ project: { ...project, deadline: null } });
    await service.submit(maria, goodInput);
    expect(writes).toHaveLength(1);
  });
});

describe("AI evaluation fallback", () => {
  it("uses the mock when the AI takes longer than 30 seconds", async () => {
    vi.useFakeTimers();
    try {
      const hanging = {
        evaluateSubmission: () => new Promise(() => {}),
      } as unknown as AIService;
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const { service, writes } = setup({ ai: hanging });
      const pending = service.submit(maria, goodInput);
      await vi.advanceTimersByTimeAsync(30_000);
      await pending;
      expect(writes[0].evidence.map((e) => e.level)).toEqual(["strong", "strong", "partial"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("uses the mock when the AI returns no Evidence at all", async () => {
    const empty = {
      evaluateSubmission: async () => ({ evidence: [], followUpQuestions: [] }),
    } as unknown as AIService;
    const { service, writes } = setup({ ai: empty });
    await service.submit(maria, goodInput);
    expect(writes[0].evidence.every((e) => e.level !== "not_assessed")).toBe(true);
  });

  it("stores a made-up Evidence level as not assessed", async () => {
    const inventive = {
      evaluateSubmission: async () => ({
        evidence: [{ skill: "React", level: "excellent", rationale: "Great!" }],
        followUpQuestions: [],
      }),
    } as unknown as AIService;
    const { service, writes } = setup({ ai: inventive });
    await service.submit(maria, goodInput);
    expect(writes[0].evidence[0]).toEqual({ skill: "React", level: "not_assessed", rationale: "" });
  });

  it("ignores skills that aren't part of the Project", async () => {
    const extra = {
      evaluateSubmission: async () => ({
        evidence: [{ skill: "Kubernetes", level: "strong", rationale: "?" }],
        followUpQuestions: [],
      }),
    } as unknown as AIService;
    const { service, writes } = setup({ ai: extra });
    await service.submit(maria, goodInput);
    expect(writes[0].evidence.map((e) => e.skill)).toEqual(["React", "Debugging", "Testing"]);
  });

  it("keeps at most 5 follow-up questions", async () => {
    const chatty = {
      evaluateSubmission: async () => ({
        evidence: [{ skill: "React", level: "strong", rationale: "ok" }],
        followUpQuestions: ["1", "2", "3", "4", "5", "6", "7"],
      }),
    } as unknown as AIService;
    const { service, writes } = setup({ ai: chatty });
    await service.submit(maria, goodInput);
    expect(writes[0].followUpQuestions).toEqual(["1", "2", "3", "4", "5"]);
  });
});

describe("a Candidate viewing their own Evidence", () => {
  const stored = {
    submission: {
      id: "sub-1",
      projectId: "bdt",
      candidateId: "maria",
      writtenResponse: "w",
      repositoryUrl: null,
      fileUrls: [],
      videoUrl: "https://example.com/v.mp4",
      followUpQuestions: ["Secret interview question"],
      status: "submitted",
      submittedAt: "2026-10-02T12:00:00Z",
      createdAt: "2026-10-02T12:00:00Z",
      updatedAt: "2026-10-02T12:00:00Z",
    },
    project,
    evidence: [
      { id: "ai", candidateId: "maria", submissionId: "sub-1", skill: "React", level: "strong", source: "ai", rationale: "AI", createdAt: "2026-10-02T12:00:00Z", updatedAt: "2026-10-02T12:00:00Z" },
      { id: "co", candidateId: "maria", submissionId: "sub-1", skill: "React", level: "partial", source: "company", rationale: "Reviewer", createdAt: "2026-10-02T13:00:00Z", updatedAt: "2026-10-02T13:00:00Z" },
    ],
  } as unknown as Awaited<ReturnType<SubmissionsDao["findMine"]>>;

  it("never includes the Company's follow-up interview questions", async () => {
    const { service } = setup({ findMine: async () => stored });
    const view = await service.getMine("sub-1", maria);
    expect(view).not.toBeNull();
    expect(view!.submission).not.toHaveProperty("followUpQuestions");
    expect(JSON.stringify(view)).not.toContain("Secret interview question");
  });

  it("shows a Company-reviewed level in place of the AI's", async () => {
    const { service } = setup({ findMine: async () => stored });
    const view = await service.getMine("sub-1", maria);
    expect(view!.evidence).toHaveLength(1);
    expect(view!.evidence[0]).toMatchObject({ level: "partial", source: "company" });
  });

  it("returns null for a Submission that isn't theirs", async () => {
    const { service } = setup({ findMine: async () => null });
    expect(await service.getMine("someone-else", maria)).toBeNull();
  });
});
