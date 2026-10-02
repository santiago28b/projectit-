import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentCandidate } from "@/server/lib/currentUser";
import { SubmissionError, submissionsService } from "@/server/services/submissions";
import type { Candidate } from "@/shared/models/domain";

import { submissionsController } from "./submissionsController";

vi.mock("server-only", () => ({}));
vi.mock("@/server/lib/currentUser", () => ({ getCurrentCandidate: vi.fn() }));
vi.mock("@/server/database/dao", () => ({ projectsDao: {}, submissionsDao: {} }));
vi.mock("@/server/lib/db", () => ({ db: {} }));
vi.mock("@/server/lib/supabase/admin", () => ({
  createAdminClient: () => ({}),
}));
vi.mock("@/server/services/submissions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/services/submissions")>()),
  submissionsService: { submit: vi.fn(), listMine: vi.fn(), getMine: vi.fn() },
}));

const maria = { id: "00000000-0000-0000-0000-000000000301" } as Candidate;
const projectId = "00000000-0000-0000-0000-000000000401";
const submissionId = "00000000-0000-0000-0000-000000000601";

function post(body: unknown) {
  return new NextRequest("http://localhost/api/submissions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const get = (url: string) => new NextRequest(`http://localhost${url}`);

describe("POST /api/submissions", () => {
  beforeEach(() => {
    vi.mocked(getCurrentCandidate).mockResolvedValue(maria);
    vi.mocked(submissionsService.submit).mockReset();
  });

  it("returns 401 when no Candidate is signed in", async () => {
    vi.mocked(getCurrentCandidate).mockResolvedValue(null);
    const res = await submissionsController.create(post({ projectId }));
    expect(res.status).toBe(401);
    expect(submissionsService.submit).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid JSON", async () => {
    expect((await submissionsController.create(post("{not json"))).status).toBe(400);
  });

  it("returns 400 when the Project id isn't a valid id", async () => {
    expect((await submissionsController.create(post({ projectId: "abc" }))).status).toBe(400);
  });

  it("submits as the signed-in Candidate and ignores any candidateId in the body", async () => {
    vi.mocked(submissionsService.submit).mockResolvedValue({ id: submissionId } as never);
    const res = await submissionsController.create(
      post({
        projectId,
        candidateId: "00000000-0000-0000-0000-000000000302",
        writtenResponse: "Fixed it",
        videoUrl: "https://example.com/v.mp4",
        fileUrls: ["https://example.com/a.pdf", 42],
      }),
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ submission: { id: submissionId } });
    const [candidate, input] = vi.mocked(submissionsService.submit).mock.calls[0];
    expect(candidate).toBe(maria);
    expect(input).not.toHaveProperty("candidateId");
    expect(input.fileUrls).toEqual(["https://example.com/a.pdf"]);
  });

  it.each([400, 403, 404, 409] as const)("passes a rule's %i status through with its message", async (status) => {
    vi.mocked(submissionsService.submit).mockImplementation(async () => {
      throw new SubmissionError("Rule broken", status);
    });
    const res = await submissionsController.create(post({ projectId, videoUrl: "x" }));
    expect(res.status).toBe(status);
    expect(await res.json()).toEqual({ error: "Rule broken" });
  });

  it("returns 500 for an unexpected error", async () => {
    vi.mocked(submissionsService.submit).mockImplementation(async () => {
      throw new Error("db down");
    });
    expect((await submissionsController.create(post({ projectId }))).status).toBe(500);
  });
});

describe("GET /api/submissions", () => {
  it("lists the signed-in Candidate's Submissions", async () => {
    vi.mocked(getCurrentCandidate).mockResolvedValue(maria);
    vi.mocked(submissionsService.listMine).mockResolvedValue([]);
    const res = await submissionsController.listMine(get("/api/submissions"));
    expect(res.status).toBe(200);
    expect(submissionsService.listMine).toHaveBeenCalledWith(maria);
  });

  it("returns 401 when no Candidate is signed in", async () => {
    vi.mocked(getCurrentCandidate).mockResolvedValue(null);
    expect((await submissionsController.listMine(get("/api/submissions"))).status).toBe(401);
  });
});

describe("GET /api/submissions/[id]", () => {
  beforeEach(() => {
    vi.mocked(getCurrentCandidate).mockResolvedValue(maria);
    vi.mocked(submissionsService.getMine).mockReset();
  });

  it("returns the Candidate's own Submission", async () => {
    vi.mocked(submissionsService.getMine).mockResolvedValue({ evidence: [] } as never);
    const res = await submissionsController.getMine(get("/x"), submissionId);
    expect(res.status).toBe(200);
    expect(submissionsService.getMine).toHaveBeenCalledWith(submissionId, maria);
  });

  it("returns 404 for someone else's Submission", async () => {
    vi.mocked(submissionsService.getMine).mockResolvedValue(null);
    expect((await submissionsController.getMine(get("/x"), submissionId)).status).toBe(404);
  });

  it("returns 404 without querying for a malformed id", async () => {
    expect((await submissionsController.getMine(get("/x"), "'; drop table"))).toHaveProperty("status", 404);
    expect(submissionsService.getMine).not.toHaveBeenCalled();
  });
});
