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

function setup(options: { existingId?: string | null; ai?: AIService; eligible?: boolean } = {}) {
  const writes: NewSubmission[] = [];
  const dao = {
    findProject: async (id: string) => (id === project.id ? project : null),
    findId: async () => options.existingId ?? null,
    createWithEvidence: async (input: NewSubmission) => {
      writes.push(input);
      return { id: "sub-1", ...input } as unknown as Submission;
    },
    listMine: async () => [],
    findMine: async () => null,
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
