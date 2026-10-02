import "server-only";

import { randomUUID } from "node:crypto";
import os from "node:os";
import { createReadStream } from "node:fs";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@/server/lib/env";
import { probeDurationSeconds, uploadNameFromUrl } from "@/server/services/transcription";
import { checkWalkthroughDuration } from "@/shared/models/walkthrough";

/**
 * Local-disk storage for deliverable files (and Walkthroughs when S3 is unset).
 * `/uploads` is git-ignored. Names on disk are random, never the browser's.
 * Walkthroughs use S3 via `presignWalkthrough` when `S3_WALKTHROUGH_BUCKET` is set.
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

const PRESIGN_EXPIRES_SECONDS = 15 * 60;

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

export function s3WalkthroughsEnabled(): boolean {
  return Boolean(env.s3WalkthroughBucket);
}

function extensionFor(file: { type: string; name: string }, kind: UploadKind): string {
  if (kind === "walkthrough") {
    const ext = VIDEO_TYPES[file.type];
    if (!ext) throw new UploadError("Walkthrough must be an MP4, WebM, or MOV video");
    return ext;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return FILE_EXTENSIONS.has(ext) ? ext : "bin";
}

function assertSize(size: number, kind: UploadKind) {
  if (size === 0) throw new UploadError("The file is empty");
  if (size > LIMITS[kind])
    throw new UploadError(`File is larger than ${LIMITS[kind] / MB}MB`);
}

function s3Client(): S3Client {
  return new S3Client({ region: env.awsRegion });
}

function publicObjectUrl(key: string): string {
  const bucket = env.s3WalkthroughBucket!;
  const region = env.awsRegion;
  if (region === "us-east-1") {
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

const S3_WALKTHROUGH_KEY = /^walkthroughs\/[0-9a-f-]{36}\.(mp4|webm|mov)$/;

/** The S3 key of one of our own Walkthroughs, or null for any other URL. */
export function s3WalkthroughKey(url: string): string | null {
  if (!env.s3WalkthroughBucket) return null;
  const prefix = publicObjectUrl("");
  if (!url.startsWith(prefix)) return null;
  const key = url.slice(prefix.length);
  return S3_WALKTHROUGH_KEY.test(key) ? key : null;
}

/** A Walkthrough as a file on this server, plus how to clean it up. */
export interface WalkthroughFile {
  path: string;
  cleanup: () => Promise<void>;
}

/**
 * A local file for a Walkthrough we stored: the upload on disk, or a temporary
 * download of our own S3 object (they're public-read). Null for outside links
 * (YouTube, Loom), which can't be read. Only our bucket is ever fetched.
 */
export async function openWalkthroughFile(
  videoUrl: string,
  doFetch: typeof fetch = fetch,
): Promise<WalkthroughFile | null> {
  const name = uploadNameFromUrl(videoUrl);
  if (name) return { path: uploadPath(name), cleanup: async () => {} };

  const key = s3WalkthroughKey(videoUrl);
  if (!key) return null;
  const res = await doFetch(publicObjectUrl(key), { signal: AbortSignal.timeout(90_000) });
  if (!res.ok) throw new Error(`S3 answered ${res.status}`);
  if (Number(res.headers.get("content-length") ?? 0) > LIMITS.walkthrough)
    throw new Error("Walkthrough is larger than the upload limit");

  const tmp = path.join(os.tmpdir(), `walkthrough-${randomUUID()}${path.extname(key)}`);
  await writeFile(tmp, Buffer.from(await res.arrayBuffer()));
  return { path: tmp, cleanup: () => unlink(tmp).catch(() => {}) };
}

/**
 * Server-side 2-minute check for a Walkthrough uploaded straight to S3 (local
 * uploads were already checked on upload; outside links can't be). If the
 * video can't be downloaded or read, it's allowed and the browser's check stands.
 */
export async function checkStoredWalkthroughLength(
  videoUrl: string,
  probe: (filePath: string) => Promise<number | null> = probeDurationSeconds,
  doFetch: typeof fetch = fetch,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!s3WalkthroughKey(videoUrl)) return { ok: true };
  let video: WalkthroughFile | null;
  try {
    video = await openWalkthroughFile(videoUrl, doFetch);
  } catch (err) {
    console.warn("[uploads] couldn't download S3 Walkthrough:", err instanceof Error ? err.message : err);
    return { ok: true };
  }
  if (!video) return { ok: true };
  try {
    const seconds = await probe(video.path);
    return seconds === null ? { ok: true } : checkWalkthroughDuration(seconds);
  } catch (err) {
    console.warn("[uploads] couldn't read S3 Walkthrough length:", err instanceof Error ? err.message : err);
    return { ok: true };
  } finally {
    await video.cleanup();
  }
}

export interface PresignWalkthroughInput {
  contentType: string;
  size: number;
}

export interface PresignWalkthroughResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

/**
 * Issue a short-lived PUT URL so the browser uploads the Walkthrough straight to S3.
 * Returns 501-style `UploadError` via caller when S3 is not configured.
 */
export async function presignWalkthrough(
  input: PresignWalkthroughInput,
): Promise<PresignWalkthroughResult> {
  if (!env.s3WalkthroughBucket) {
    throw new UploadError("S3 Walkthrough uploads are not configured");
  }
  assertSize(input.size, "walkthrough");
  const ext = VIDEO_TYPES[input.contentType];
  if (!ext) throw new UploadError("Walkthrough must be an MP4, WebM, or MOV video");

  const key = `walkthroughs/${randomUUID()}.${ext}`;
  const command = new PutObjectCommand({
    Bucket: env.s3WalkthroughBucket,
    Key: key,
    ContentType: input.contentType,
  });
  const uploadUrl = await getSignedUrl(s3Client(), command, {
    expiresIn: PRESIGN_EXPIRES_SECONDS,
  });
  return { uploadUrl, publicUrl: publicObjectUrl(key), key };
}

/** Save an upload to local disk and return its absolute URL. */
export async function saveUpload(
  file: File,
  kind: UploadKind,
  probe: (filePath: string) => Promise<number | null> = probeDurationSeconds,
): Promise<string> {
  assertSize(file.size, kind);

  const name = `${randomUUID()}.${extensionFor(file, kind)}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  const filePath = path.join(UPLOAD_DIR, name);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
  if (kind === "walkthrough") await enforceWalkthroughLength(filePath, probe);
  return `${env.appUrl}/api/uploads/${name}`;
}

/** Stream a stored local upload, honoring a `Range` header so video can seek. */
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
