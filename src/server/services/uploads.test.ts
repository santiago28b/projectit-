import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const root = mkdtempSync(path.join(tmpdir(), "projectit-uploads-"));
vi.spyOn(process, "cwd").mockReturnValue(root);
vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://test.local");

const { LIMITS, readUpload, saveUpload, UploadError } = await import("./uploads");

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
