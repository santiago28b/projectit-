import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentCandidate } from "@/server/lib/currentUser";
import {
  presignWalkthrough,
  readUpload,
  s3WalkthroughsEnabled,
  saveUpload,
  UploadError,
} from "@/server/services/uploads";
import type { Candidate } from "@/shared/models/domain";

import { uploadsController } from "./uploadsController";

vi.mock("@/server/lib/currentUser", () => ({ getCurrentCandidate: vi.fn() }));
vi.mock("@/server/services/projects", () => ({ projectsService: {} }));
vi.mock("@/server/services/uploads", () => ({
  saveUpload: vi.fn(),
  readUpload: vi.fn(),
  presignWalkthrough: vi.fn(),
  s3WalkthroughsEnabled: vi.fn(() => false),
  UploadError: class extends Error {},
}));

const maria = { id: "maria" } as Candidate;

function upload(fields: Record<string, string | File>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  return new NextRequest("http://localhost/api/uploads", { method: "POST", body: form });
}

function presignBody(body: unknown) {
  return new NextRequest("http://localhost/api/uploads/presign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
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

describe("POST /api/uploads/presign", () => {
  beforeEach(() => {
    vi.mocked(getCurrentCandidate).mockResolvedValue(maria);
    vi.mocked(s3WalkthroughsEnabled).mockReturnValue(true);
    vi.mocked(presignWalkthrough).mockReset();
  });

  it("returns 401 when no Candidate is signed in", async () => {
    vi.mocked(getCurrentCandidate).mockResolvedValue(null);
    expect((await uploadsController.presign(presignBody({ kind: "walkthrough" }))).status).toBe(
      401,
    );
  });

  it("returns 501 when S3 is not configured", async () => {
    vi.mocked(s3WalkthroughsEnabled).mockReturnValue(false);
    const res = await uploadsController.presign(
      presignBody({ kind: "walkthrough", contentType: "video/mp4", size: 10 }),
    );
    expect(res.status).toBe(501);
    expect(presignWalkthrough).not.toHaveBeenCalled();
  });

  it("returns 400 when kind is not walkthrough", async () => {
    const res = await uploadsController.presign(
      presignBody({ kind: "file", contentType: "application/pdf", size: 10 }),
    );
    expect(res.status).toBe(400);
  });

  it("returns uploadUrl and publicUrl", async () => {
    vi.mocked(presignWalkthrough).mockResolvedValue({
      uploadUrl: "https://s3.example/put",
      publicUrl: "https://s3.example/walkthroughs/x.mp4",
      key: "walkthroughs/x.mp4",
    });
    const res = await uploadsController.presign(
      presignBody({ kind: "walkthrough", contentType: "video/mp4", size: 1000 }),
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      uploadUrl: "https://s3.example/put",
      publicUrl: "https://s3.example/walkthroughs/x.mp4",
    });
  });

  it("returns 400 when the video type is rejected", async () => {
    vi.mocked(presignWalkthrough).mockImplementation(async () => {
      throw new UploadError("Walkthrough must be an MP4, WebM, or MOV video");
    });
    const res = await uploadsController.presign(
      presignBody({ kind: "walkthrough", contentType: "text/html", size: 10 }),
    );
    expect(res.status).toBe(400);
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
