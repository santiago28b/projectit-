import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentCandidate } from "@/server/lib/currentUser";
import { readUpload, saveUpload, UploadError } from "@/server/services/uploads";
import type { Candidate } from "@/shared/models/domain";

import { uploadsController } from "./uploadsController";

vi.mock("@/server/lib/currentUser", () => ({ getCurrentCandidate: vi.fn() }));
vi.mock("@/server/services/projects", () => ({ projectsService: {} }));
vi.mock("@/server/services/uploads", () => ({
  saveUpload: vi.fn(),
  readUpload: vi.fn(),
  UploadError: class extends Error {},
}));

const maria = { id: "maria" } as Candidate;

function upload(fields: Record<string, string | File>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  return new NextRequest("http://localhost/api/uploads", { method: "POST", body: form });
}

const clip = () => new File(["abc"], "w.mp4", { type: "video/mp4" });

describe("POST /api/uploads", () => {
  beforeEach(() => {
    vi.mocked(getCurrentCandidate).mockResolvedValue(maria);
    vi.mocked(saveUpload).mockReset();
  });

  it("returns 401 when no Candidate is signed in", async () => {
    vi.mocked(getCurrentCandidate).mockResolvedValue(null);
    expect((await uploadsController.create(upload({ file: clip() }))).status).toBe(401);
    expect(saveUpload).not.toHaveBeenCalled();
  });

  it("returns 400 when no file is attached", async () => {
    expect((await uploadsController.create(upload({ kind: "walkthrough" }))).status).toBe(400);
  });

  it("saves a Walkthrough and returns its URL", async () => {
    vi.mocked(saveUpload).mockResolvedValue("http://localhost:3000/api/uploads/x.mp4");
    const res = await uploadsController.create(upload({ file: clip(), kind: "walkthrough" }));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ url: "http://localhost:3000/api/uploads/x.mp4" });
    expect(vi.mocked(saveUpload).mock.calls[0][1]).toBe("walkthrough");
  });

  it("treats any other kind as a plain file", async () => {
    vi.mocked(saveUpload).mockResolvedValue("u");
    await uploadsController.create(upload({ file: clip(), kind: "../../etc" }));
    expect(vi.mocked(saveUpload).mock.calls[0][1]).toBe("file");
  });

  it("returns 400 with the reason when the file is rejected", async () => {
    vi.mocked(saveUpload).mockImplementation(async () => {
      throw new UploadError("Walkthrough must be an MP4, WebM, or MOV video");
    });
    const res = await uploadsController.create(upload({ file: clip(), kind: "walkthrough" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Walkthrough must be an MP4, WebM, or MOV video" });
  });
});

describe("GET /api/uploads/[name]", () => {
  it("returns 404 for an unknown file", async () => {
    vi.mocked(readUpload).mockResolvedValue(null);
    const res = await uploadsController.read(new NextRequest("http://localhost/x"), "nope.mp4");
    expect(res.status).toBe(404);
  });

  it("passes the Range header through", async () => {
    vi.mocked(readUpload).mockResolvedValue(new Response("ab", { status: 206 }));
    const res = await uploadsController.read(
      new NextRequest("http://localhost/x", { headers: { range: "bytes=0-1" } }),
      "a.mp4",
    );
    expect(res.status).toBe(206);
    expect(readUpload).toHaveBeenCalledWith("a.mp4", "bytes=0-1");
  });
});
