import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireCompany } from "@/server/controllers/auth";
import { runInBackground } from "@/server/lib/background";
import { AssessmentError, assessmentService } from "@/server/services/assessment";

import { assessmentController } from "./assessmentController";

vi.mock("server-only", () => ({}));
vi.mock("@/server/controllers/auth", () => ({ requireCompany: vi.fn() }));
vi.mock("@/server/lib/background", () => ({ runInBackground: vi.fn() }));
vi.mock("@/server/services/assessment", async (importOriginal) => ({
  AssessmentError: (await importOriginal<typeof import("@/server/services/assessment")>()).AssessmentError,
  assessmentService: { run: vi.fn(async () => {}), requestRetry: vi.fn(async () => {}) },
}));
vi.mock("@/server/lib/db", () => ({ db: {} }));

const id = "00000000-0000-0000-0000-000000000601";
const req = () => new NextRequest(`http://localhost/api/submissions/${id}/assessment`, { method: "POST" });

describe("POST /api/submissions/[id]/assessment (retry)", () => {
  beforeEach(() => {
    vi.mocked(requireCompany).mockResolvedValue({ companyId: "summit", userId: "u" });
    vi.mocked(runInBackground).mockClear();
    vi.mocked(assessmentService.requestRetry).mockReset();
  });

  it("requires a Company account", async () => {
    vi.mocked(requireCompany).mockResolvedValue({
      error: Response.json({ error: "Switch to a Company account first" }, { status: 401 }) as never,
    });
    expect((await assessmentController.retry(req(), id)).status).toBe(401);
  });

  it("returns 404 for an id that isn't a uuid", async () => {
    expect((await assessmentController.retry(req(), "abc")).status).toBe(404);
  });

  it("requeues as the signed-in Company and runs the Assessment in the background", async () => {
    const res = await assessmentController.retry(req(), id);
    expect(res.status).toBe(202);
    expect(assessmentService.requestRetry).toHaveBeenCalledWith(id, "summit");
    await vi.mocked(runInBackground).mock.calls[0][0]();
    expect(assessmentService.run).toHaveBeenCalledWith(id);
  });

  it.each([404, 409] as const)("passes through a %s from the rules and runs nothing", async (status) => {
    vi.mocked(assessmentService.requestRetry).mockRejectedValue(new AssessmentError("no", status));
    expect((await assessmentController.retry(req(), id)).status).toBe(status);
    expect(runInBackground).not.toHaveBeenCalled();
  });
});
