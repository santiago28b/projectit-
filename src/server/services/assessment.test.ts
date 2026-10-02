import { describe, expect, it, vi } from "vitest";

import type { AssessedEvidence, AssessmentDao } from "@/server/database/dao/pg/assessment";
import type { AIService, EvaluateSubmissionInput } from "@/server/services/ai";
import type { RepoReader } from "@/server/services/repoReader";
import type { Transcriber } from "@/server/services/transcription";
import type { AssessmentStatus, Project, Submission } from "@/shared/models/domain";

import { AssessmentError, createAssessmentService, shortReason } from "./assessment";

vi.mock("server-only", () => ({}));
vi.mock("@/server/database/dao", () => ({ assessmentDao: {} }));
vi.mock("@/server/lib/db", () => ({ db: {} }));

const project = {
  id: "bdt",
  title: "Broken Delivery Tracker",
  scenario: "Dispatchers see wrong statuses.",
  skills: ["React", "Testing"],
} as Project;

function fakeDao(initial: Partial<Submission> = {}) {
  const state = {
    submission: {
      id: "sub-1",
      projectId: "bdt",
      candidateId: "maria",
      writtenResponse: "Fixed the race with AbortController because stale responses overwrote new ones.",
      repositoryUrl: "https://github.com/maria/bdt",
      videoUrl: "http://localhost:3000/api/uploads/0b7e1c3a-1111-2222-3333-444455556666.mp4",
      transcript: null,
      assessmentStatus: "pending" as AssessmentStatus,
      assessmentError: null,
      ...initial,
    } as Submission,
    evidence: [] as AssessedEvidence[],
    followUps: [] as string[],
    reviewers: new Set(["summit"]),
  };
  const dao: AssessmentDao = {
    load: async (id) => (id === state.submission.id ? { submission: state.submission, project } : null),
    claim: async () => {
      if (state.submission.assessmentStatus !== "pending") return false;
      state.submission.assessmentStatus = "running";
      return true;
    },
    saveTranscript: async (_id, transcript) => {
      state.submission.transcript = transcript;
    },
    complete: async (_id, result) => {
      state.evidence = result.evidence;
      state.followUps = result.followUpQuestions;
      state.submission.assessmentStatus = "done";
      state.submission.assessmentError = null;
    },
    fail: async (_id, message) => {
      state.submission.assessmentStatus = "failed";
      state.submission.assessmentError = message;
    },
    requeue: async () => {
      if (state.submission.assessmentStatus !== "failed") return false;
      state.submission.assessmentStatus = "pending";
      return true;
    },
    companyCanReview: async (_id, companyId) => state.reviewers.has(companyId),
  };
  return { dao, state };
}

const goodAI = {
  evaluateSubmission: vi.fn(async (input: EvaluateSubmissionInput) => ({
    evidence: input.projectSkills.map((skill) => ({ skill, level: "strong" as const, rationale: `${skill} shown.` })),
    followUpQuestions: ["Why AbortController?"],
  })),
} as unknown as AIService;

function setup(opts: {
  submission?: Partial<Submission>;
  ai?: AIService;
  transcriber?: Transcriber;
  repoReader?: RepoReader;
} = {}) {
  const { dao, state } = fakeDao(opts.submission);
  const transcriber =
    opts.transcriber ??
    ({ transcribe: vi.fn(async () => ({ ok: true, transcript: "I cancel stale requests because…" })) } as unknown as Transcriber);
  const repoReader =
    opts.repoReader ??
    ({
      read: vi.fn(async () => ({
        ok: true,
        snapshot: { owner: "maria", repo: "bdt", branch: "main", tree: ["README.md"], files: [] },
      })),
    } as unknown as RepoReader);
  const ai = opts.ai ?? goodAI;
  vi.spyOn(console, "warn").mockImplementation(() => {});
  const service = createAssessmentService({ dao, ai, transcriber, repoReader });
  return { service, state, transcriber, repoReader, ai };
}

describe("running an Assessment", () => {
  it("transcribes, reads the repo, and saves Evidence for every skill plus Communication", async () => {
    const { service, state, ai } = setup();

    await service.run("sub-1");

    expect(state.submission.assessmentStatus).toBe("done");
    expect(state.submission.transcript).toBe("I cancel stale requests because…");
    expect(state.evidence.map((e) => e.skill)).toEqual(["React", "Testing", "Communication"]);
    expect(state.followUps).toEqual(["Why AbortController?"]);
    const input = vi.mocked(ai.evaluateSubmission).mock.calls.at(-1)![0];
    expect(input.transcript).toBe("I cancel stale requests because…");
    expect(input.repo?.repo).toBe("bdt");
    expect(input.projectSkills).toEqual(["React", "Testing", "Communication"]);
  });

  it("doesn't add Communication twice when the Project already lists it", async () => {
    const { dao, state } = fakeDao();
    const service = createAssessmentService({
      dao: { ...dao, load: async () => ({ submission: state.submission, project: { ...project, skills: ["communication", "React"] } }) },
      ai: goodAI,
      transcriber: { transcribe: async () => ({ ok: true, transcript: "hi" }) } as unknown as Transcriber,
      repoReader: { read: async () => ({ ok: false, reason: "x" }) } as unknown as RepoReader,
    });
    await service.run("sub-1");
    expect(state.evidence.map((e) => e.skill)).toEqual(["communication", "React"]);
  });

  it("reuses a saved Transcript instead of transcribing again", async () => {
    const { service, transcriber } = setup({ submission: { transcript: "Already transcribed." } });
    await service.run("sub-1");
    expect(transcriber.transcribe).not.toHaveBeenCalled();
  });

  it("still assesses the code when there's no Transcript, with Communication not assessed", async () => {
    const { service, state, ai } = setup({
      transcriber: {
        transcribe: async () => ({ ok: false, reason: "The Walkthrough is an external link, so it couldn't be transcribed." }),
      } as unknown as Transcriber,
    });

    await service.run("sub-1");

    expect(state.submission.assessmentStatus).toBe("done");
    expect(state.evidence.find((e) => e.skill === "React")?.level).toBe("strong");
    expect(state.evidence.find((e) => e.skill === "Communication")).toEqual({
      skill: "Communication",
      level: "not_assessed",
      rationale: "No Walkthrough Transcript: The Walkthrough is an external link, so it couldn't be transcribed.",
    });
    expect(vi.mocked(ai.evaluateSubmission).mock.calls.at(-1)![0].transcriptNote).toContain("external link");
  });

  it("tells the AI why the code isn't available", async () => {
    const { service, ai } = setup({
      repoReader: { read: async () => ({ ok: false, reason: "The repository is private or doesn't exist." }) } as unknown as RepoReader,
    });
    await service.run("sub-1");
    const input = vi.mocked(ai.evaluateSubmission).mock.calls.at(-1)![0];
    expect(input.repo).toBeNull();
    expect(input.repoNote).toBe("The repository is private or doesn't exist.");
  });

  it("doesn't call GitHub when no repository was given", async () => {
    const { service, repoReader } = setup({ submission: { repositoryUrl: null } });
    await service.run("sub-1");
    expect(repoReader.read).not.toHaveBeenCalled();
  });

  it("turns skills the AI skipped or levels it made up into not assessed", async () => {
    const inventive = {
      evaluateSubmission: async () => ({
        evidence: [
          { skill: "react", level: "excellent", rationale: "Great!" },
          { skill: "Kubernetes", level: "strong", rationale: "?" },
          { skill: "Testing", level: "partial", rationale: "One test." },
        ],
        followUpQuestions: Array.from({ length: 8 }, (_, i) => `Q${i}`),
      }),
    } as unknown as AIService;
    const { service, state } = setup({ ai: inventive });
    await service.run("sub-1");
    expect(state.evidence).toEqual([
      { skill: "React", level: "not_assessed", rationale: "The AI didn't assess this skill." },
      { skill: "Testing", level: "partial", rationale: "One test." },
      { skill: "Communication", level: "not_assessed", rationale: "The AI didn't assess this skill." },
    ]);
    expect(state.followUps).toHaveLength(5);
  });

  it("retries once automatically, then succeeds", async () => {
    let calls = 0;
    const flaky = {
      evaluateSubmission: async (input: EvaluateSubmissionInput) => {
        calls += 1;
        if (calls === 1) throw new Error("529 overloaded");
        return goodAI.evaluateSubmission(input);
      },
    } as unknown as AIService;
    const { service, state } = setup({ ai: flaky });
    await service.run("sub-1");
    expect(calls).toBe(2);
    expect(state.submission.assessmentStatus).toBe("done");
  });

  it("fails after the automatic retry, saving no Evidence and a short reason", async () => {
    const down = {
      evaluateSubmission: async () => {
        throw new Error("Request timed out.");
      },
    } as unknown as AIService;
    const { service, state } = setup({ ai: down });
    await service.run("sub-1");
    expect(state.submission.assessmentStatus).toBe("failed");
    expect(state.submission.assessmentError).toBe("The AI took too long to respond. Try again.");
    expect(state.evidence).toEqual([]);
  });

  it("treats an empty AI answer as a failure, not as Evidence", async () => {
    const empty = { evaluateSubmission: async () => ({ evidence: [], followUpQuestions: [] }) } as unknown as AIService;
    const { service, state } = setup({ ai: empty });
    await service.run("sub-1");
    expect(state.submission.assessmentStatus).toBe("failed");
    expect(state.evidence).toEqual([]);
  });

  it("does nothing if the Assessment is already running or done", async () => {
    const { service, ai } = setup({ submission: { assessmentStatus: "done" } });
    vi.mocked(ai.evaluateSubmission).mockClear();
    await service.run("sub-1");
    expect(ai.evaluateSubmission).not.toHaveBeenCalled();
  });

  it("never throws, even when loading fails", async () => {
    const { dao } = fakeDao();
    const service = createAssessmentService({
      dao: { ...dao, load: async () => { throw new Error("db down"); } },
      ai: goodAI,
      transcriber: {} as Transcriber,
      repoReader: {} as RepoReader,
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(service.run("sub-1")).resolves.toBeUndefined();
  });
});

describe("retrying a failed Assessment", () => {
  it("lets a Company that owns or Sponsors the Project requeue it", async () => {
    const { service, state } = setup({ submission: { assessmentStatus: "failed" } });
    await service.requestRetry("sub-1", "summit");
    expect(state.submission.assessmentStatus).toBe("pending");
  });

  it("refuses other Companies", async () => {
    const { service } = setup({ submission: { assessmentStatus: "failed" } });
    const err = await service.requestRetry("sub-1", "other-co").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AssessmentError);
    expect((err as AssessmentError).status).toBe(404);
  });

  it("refuses when the Assessment hasn't failed", async () => {
    const { service } = setup({ submission: { assessmentStatus: "done" } });
    const err = await service.requestRetry("sub-1", "summit").catch((e: unknown) => e);
    expect((err as AssessmentError).status).toBe(409);
  });
});

describe("the reason shown to reviewers when an Assessment fails", () => {
  it.each([
    ["Request timed out.", "The AI took too long to respond. Try again."],
    ["529 overloaded_error", "The AI service is busy right now. Try again in a minute."],
    ["Claude declined to assess (cyber)", "The AI declined to assess this Submission."],
    ["401 invalid x-api-key sk-ant-abc123", "The AI couldn't finish the Assessment. Try again."],
  ])("maps %s to a safe message", (raw, expected) => {
    expect(shortReason(new Error(raw))).toBe(expected);
  });

  it("never includes the raw error text", () => {
    expect(shortReason(new Error("401 invalid x-api-key sk-ant-abc123"))).not.toContain("sk-ant");
  });
});
