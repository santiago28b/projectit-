import "server-only";

import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { env } from "@/server/lib/env";
import { probeDurationSeconds } from "@/server/services/transcription";
import { checkWalkthroughDuration } from "@/shared/models/walkthrough";

/**
 * Local-disk storage for Walkthroughs and deliverable files (dev/demo only;
 * `/uploads` is git-ignored). Names on disk are random, never the browser's.
 */
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const NAME = /^[0-9a-f-]{36}\.[a-z0-9]{1,5}$/;

const MB = 1024 * 1024;
export const LIMITS = { walkthrough: 200 * MB, file: 25 * MB } as const;
export type UploadKind = keyof typeof LIMITS;

const VIDEO_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

const FILE_EXTENSIONS = new Set([
  "pdf", "zip", "png", "jpg", "jpeg", "txt", "md", "csv", "json",
  "sql", "ipynb", "py", "ts", "tsx", "js",
]);

/** Served inline; anything else downloads as an attachment (no XSS via HTML). */
const INLINE_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  pdf: "application/pdf",
};

export class UploadError extends Error {}

/** Where a stored upload lives on disk (name already validated by the caller). */
export function uploadPath(name: string): string {
  return path.join(UPLOAD_DIR, name);
}

/**
 * Server-side Walkthrough length check (the browser checks first, but that can
 * be skipped). If ffmpeg can't read the length, the upload is kept and the
 * browser's check stands.
 */
async function enforceWalkthroughLength(
  filePath: string,
  probe: (filePath: string) => Promise<number | null>,
): Promise<void> {
  let seconds: number | null;
  try {
    seconds = await probe(filePath);
  } catch (err) {
    console.warn("[uploads] couldn't read Walkthrough length:", err instanceof Error ? err.message : err);
    return;
  }
  if (seconds === null) return;
  const check = checkWalkthroughDuration(seconds);
  if (!check.ok) {
    await unlink(filePath).catch(() => {});
    throw new UploadError(check.message);
  }
}

function extensionFor(file: File, kind: UploadKind): string {
  if (kind === "walkthrough") {
    const ext = VIDEO_TYPES[file.type];
    if (!ext) throw new UploadError("Walkthrough must be an MP4, WebM, or MOV video");
    return ext;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return FILE_EXTENSIONS.has(ext) ? ext : "bin";
}

/** Save an upload and return its absolute URL. */
export async function saveUpload(
  file: File,
  kind: UploadKind,
  probe: (filePath: string) => Promise<number | null> = probeDurationSeconds,
): Promise<string> {
  if (file.size === 0) throw new UploadError("The file is empty");
  if (file.size > LIMITS[kind])
    throw new UploadError(`File is larger than ${LIMITS[kind] / MB}MB`);

  const name = `${randomUUID()}.${extensionFor(file, kind)}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  const filePath = path.join(UPLOAD_DIR, name);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
  if (kind === "walkthrough") await enforceWalkthroughLength(filePath, probe);
  return `${env.appUrl}/api/uploads/${name}`;
}

/** Stream a stored upload, honoring a `Range` header so video can seek. */
export async function readUpload(
  name: string,
  range: string | null,
): Promise<Response | null> {
  if (!NAME.test(name)) return null;
  const filePath = path.join(UPLOAD_DIR, name);
  const info = await stat(filePath).catch(() => null);
  if (!info?.isFile()) return null;

  const ext = name.split(".").pop()!;
  const inlineType = INLINE_TYPES[ext];
  const headers = new Headers({
    "Content-Type": inlineType ?? "application/octet-stream",
    "Content-Disposition": inlineType ? "inline" : `attachment; filename="${name}"`,
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
  });

  const match = range?.match(/^bytes=(\d*)-(\d*)$/);
  if (match && (match[1] || match[2])) {
    const start = match[1] ? Number(match[1]) : Math.max(info.size - Number(match[2]), 0);
    const end = match[1] && match[2] ? Math.min(Number(match[2]), info.size - 1) : info.size - 1;
    if (start > end || start >= info.size) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${info.size}` },
      });
    }
    headers.set("Content-Range", `bytes ${start}-${end}/${info.size}`);
    headers.set("Content-Length", String(end - start + 1));
    const stream = Readable.toWeb(createReadStream(filePath, { start, end }));
    return new Response(stream as ReadableStream, { status: 206, headers });
  }

  headers.set("Content-Length", String(info.size));
  const stream = Readable.toWeb(createReadStream(filePath));
  return new Response(stream as ReadableStream, { status: 200, headers });
}
