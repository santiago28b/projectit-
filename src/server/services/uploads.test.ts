import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const root = mkdtempSync(path.join(tmpdir(), "projectit-uploads-"));
vi.spyOn(process, "cwd").mockReturnValue(root);
vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://test.local");

const {
  LIMITS,
  readUpload,
  saveUpload,
  UploadError,
  s3WalkthroughsEnabled,
  presignWalkthrough,
  s3WalkthroughKey,
  openWalkthroughFile,
  checkStoredWalkthroughLength,
} =
  await import("./uploads");

const MB = 1024 * 1024;

function video(bytes = 1000, type = "video/mp4", name = "walkthrough.mp4") {
  return new File([new Uint8Array(bytes).map((_, i) => i % 256)], name, { type });
}

function nameOf(url: string) {
  return url.split("/").pop()!;
}

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("saving uploads", () => {
  it("saves a Walkthrough under a random name and returns an absolute URL", async () => {
    const url = await saveUpload(video(), "walkthrough");
    expect(url).toMatch(/^http:\/\/test\.local\/api\/uploads\/[0-9a-f-]{36}\.mp4$/);
    expect(readdirSync(path.join(root, "uploads"))).toContain(nameOf(url));
  });

  it("never uses the browser's file name (no path traversal)", async () => {
    const url = await saveUpload(video(10, "video/mp4", "../../evil.mp4"), "walkthrough");
    expect(url).not.toContain("evil");
  });

  it.each(["video/webm", "video/quicktime"])("accepts %s Walkthroughs", async (type) => {
    await expect(saveUpload(video(10, type), "walkthrough")).resolves.toMatch(/\.(webm|mov)$/);
  });

  it("rejects a Walkthrough that isn't a video", async () => {
    const html = new File(["<script>"], "w.html", { type: "text/html" });
    await expect(saveUpload(html, "walkthrough")).rejects.toThrow(UploadError);
  });

  it("rejects an empty file", async () => {
    await expect(saveUpload(video(0), "walkthrough")).rejects.toThrow(/empty/);
  });

  it("rejects files over the size limit", async () => {
    const big = { size: LIMITS.file + 1, type: "application/pdf", name: "a.pdf" } as File;
    await expect(saveUpload(big, "file")).rejects.toThrow(/25MB/);
    expect(LIMITS.walkthrough).toBe(200 * MB);
  });

  it("keeps allowed file extensions and turns anything else into .bin", async () => {
    const pdf = new File(["%PDF"], "plan.PDF", { type: "application/pdf" });
    const html = new File(["<script>"], "page.html", { type: "text/html" });
    expect(await saveUpload(pdf, "file")).toMatch(/\.pdf$/);
    expect(await saveUpload(html, "file")).toMatch(/\.bin$/);
  });
});

describe("reading uploads", () => {
  let videoName = "";
  let binName = "";

  beforeAll(async () => {
    videoName = nameOf(await saveUpload(video(1000), "walkthrough"));
    binName = nameOf(await saveUpload(new File(["<b>hi</b>"], "x.html"), "file"));
  });

  it("returns null for names that don't look like ours", async () => {
    writeFileSync(path.join(root, "secret.txt"), "secret");
    expect(await readUpload("../secret.txt", null)).toBeNull();
    expect(await readUpload("secret.txt", null)).toBeNull();
    expect(await readUpload("00000000-0000-0000-0000-000000000000.mp4", null)).toBeNull();
  });

  it("serves a video inline with its type and size", async () => {
    const res = (await readUpload(videoName, null))!;
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("video/mp4");
    expect(res.headers.get("content-disposition")).toBe("inline");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect((await res.arrayBuffer()).byteLength).toBe(1000);
  });

  it("serves anything that isn't media as a download, never as a page", async () => {
    const res = (await readUpload(binName, null))!;
    expect(res.headers.get("content-type")).toBe("application/octet-stream");
    expect(res.headers.get("content-disposition")).toMatch(/^attachment/);
  });

  it("answers a byte range so the video player can seek", async () => {
    const res = (await readUpload(videoName, "bytes=10-19"))!;
    expect(res.status).toBe(206);
    expect(res.headers.get("content-range")).toBe("bytes 10-19/1000");
    expect([...new Uint8Array(await res.arrayBuffer())]).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  });

  it("answers open-ended and suffix ranges", async () => {
    expect((await readUpload(videoName, "bytes=990-"))!.headers.get("content-range")).toBe("bytes 990-999/1000");
    expect((await readUpload(videoName, "bytes=-5"))!.headers.get("content-range")).toBe("bytes 995-999/1000");
  });

  it("refuses a range past the end of the file", async () => {
    const res = (await readUpload(videoName, "bytes=5000-6000"))!;
    expect(res.status).toBe(416);
  });
});

describe("Walkthrough length", () => {
  const files = () => readdirSync(path.join(root, "uploads"));

  it("keeps a Walkthrough of 2 minutes or less", async () => {
    const url = await saveUpload(video(), "walkthrough", async () => 118);
    expect(files()).toContain(nameOf(url));
  });

  it("rejects and deletes a Walkthrough over 2:10", async () => {
    const before = files().length;
    await expect(saveUpload(video(), "walkthrough", async () => 185)).rejects.toThrow(
      "Your Walkthrough is 3:05 long. Keep it to 2 minutes or less.",
    );
    expect(files()).toHaveLength(before);
  });

  it("keeps the upload when the length can't be read (the browser already checked)", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const unreadable = saveUpload(video(), "walkthrough", async () => null);
    await expect(unreadable).resolves.toMatch(/\.mp4$/);
    const broken = saveUpload(video(), "walkthrough", async () => {
      throw new Error("ffmpeg not found");
    });
    await expect(broken).resolves.toMatch(/\.mp4$/);
  });

  it("doesn't check the length of other files", async () => {
    const probe = vi.fn(async () => 999);
    await saveUpload(new File(["%PDF"], "a.pdf", { type: "application/pdf" }), "file", probe);
    expect(probe).not.toHaveBeenCalled();
  });
});

describe("S3 Walkthroughs", () => {
  it("reports S3 as off when the bucket env is unset", () => {
    vi.stubEnv("S3_WALKTHROUGH_BUCKET", "");
    expect(s3WalkthroughsEnabled()).toBe(false);
  });

  it("rejects non-video content types before signing", async () => {
    vi.stubEnv("S3_WALKTHROUGH_BUCKET", "project-it-walkthroughs");
    await expect(
      presignWalkthrough({ contentType: "text/html", size: 10 }),
    ).rejects.toThrow(UploadError);
  });

  it("rejects oversize Walkthroughs before signing", async () => {
    vi.stubEnv("S3_WALKTHROUGH_BUCKET", "project-it-walkthroughs");
    await expect(
      presignWalkthrough({ contentType: "video/mp4", size: LIMITS.walkthrough + 1 }),
    ).rejects.toThrow(/200MB/);
  });
});

describe("S3 Walkthroughs on the server (transcription + length check)", () => {
  const KEY = "walkthroughs/0b7e1c3a-1111-2222-3333-444455556666.mp4";
  const URL_ = `https://project-it-walkthroughs.s3.amazonaws.com/${KEY}`;
  const s3Fetch = (status = 200, body = "video-bytes") =>
    vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => {
      void _url;
      void _init;
      return new Response(body, { status });
    });

  it("recognizes only our own bucket's Walkthrough URLs", () => {
    vi.stubEnv("S3_WALKTHROUGH_BUCKET", "project-it-walkthroughs");
    vi.stubEnv("AWS_REGION", "us-east-1");
    expect(s3WalkthroughKey(URL_)).toBe(KEY);
    expect(s3WalkthroughKey("https://evil.s3.amazonaws.com/" + KEY)).toBeNull();
    expect(s3WalkthroughKey(`https://project-it-walkthroughs.s3.amazonaws.com/other/x.mp4`)).toBeNull();
    vi.stubEnv("S3_WALKTHROUGH_BUCKET", "");
    expect(s3WalkthroughKey(URL_)).toBeNull();
  });

  it("downloads our S3 Walkthrough to a temporary file and deletes it on cleanup", async () => {
    vi.stubEnv("S3_WALKTHROUGH_BUCKET", "project-it-walkthroughs");
    vi.stubEnv("AWS_REGION", "us-east-1");
    const fetchMock = s3Fetch();
    const file = await openWalkthroughFile(URL_, fetchMock as unknown as typeof fetch);
    expect(fetchMock.mock.calls[0][0]).toBe(URL_);
    expect(file!.path).toMatch(/walkthrough-.*\.mp4$/);
    const { readFileSync, existsSync } = await import("node:fs");
    expect(readFileSync(file!.path, "utf8")).toBe("video-bytes");
    await file!.cleanup();
    expect(existsSync(file!.path)).toBe(false);
  });

  it("never fetches outside links", async () => {
    const fetchMock = s3Fetch();
    expect(await openWalkthroughFile("https://www.loom.com/share/abc", fetchMock as unknown as typeof fetch)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an S3 Walkthrough over 2:10 at submit", async () => {
    vi.stubEnv("S3_WALKTHROUGH_BUCKET", "project-it-walkthroughs");
    vi.stubEnv("AWS_REGION", "us-east-1");
    const result = await checkStoredWalkthroughLength(URL_, async () => 185, s3Fetch() as unknown as typeof fetch);
    expect(result).toEqual({ ok: false, message: "Your Walkthrough is 3:05 long. Keep it to 2 minutes or less." });
  });

  it("allows it when the length is fine, unreadable, or the download fails", async () => {
    vi.stubEnv("S3_WALKTHROUGH_BUCKET", "project-it-walkthroughs");
    vi.stubEnv("AWS_REGION", "us-east-1");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const ok = s3Fetch() as unknown as typeof fetch;
    expect(await checkStoredWalkthroughLength(URL_, async () => 110, ok)).toEqual({ ok: true });
    expect(await checkStoredWalkthroughLength(URL_, async () => null, ok)).toEqual({ ok: true });
    expect(await checkStoredWalkthroughLength(URL_, async () => 110, s3Fetch(403) as unknown as typeof fetch)).toEqual({ ok: true });
  });

  it("skips the check for local uploads and outside links", async () => {
    const probe = vi.fn(async () => 999);
    expect(await checkStoredWalkthroughLength("https://www.youtube.com/watch?v=abcdefghijk", probe)).toEqual({ ok: true });
    expect(probe).not.toHaveBeenCalled();
  });
});
