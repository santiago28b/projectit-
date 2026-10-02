/**
 * Walkthrough → Transcript: pull the audio out of an uploaded video with
 * ffmpeg, then send it to OpenAI speech-to-text. External links (YouTube,
 * Loom) can't be transcribed.
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

import { parseFfmpegDuration } from "@/shared/models/walkthrough";

export type TranscriptResult = { ok: true; transcript: string } | { ok: false; reason: string };

const OPENAI_TRANSCRIBE_URL = "https://api.openai.com/v1/audio/transcriptions";
const UPLOAD_NAME = /^[0-9a-f-]{36}\.(mp4|webm|mov)$/;

/** The stored file name behind one of our own Walkthrough upload URLs. */
export function uploadNameFromUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const match = parsed.pathname.match(/^\/api\/uploads\/([^/]+)$/);
  return match && UPLOAD_NAME.test(match[1]) ? match[1] : null;
}

/** FFMPEG_PATH, then the bundled `ffmpeg-static` binary, then ffmpeg on PATH. */
export function ffmpegPath(): string {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  try {
    const bundled = createRequire(path.join(process.cwd(), "package.json"))("ffmpeg-static") as string | null;
    if (bundled) return bundled;
  } catch {
    // ffmpeg-static not installed; fall back to the system ffmpeg.
  }
  return "ffmpeg";
}

function runFfmpeg(args: string[], timeoutMs = 60_000): Promise<{ code: number; stdout: Buffer; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath(), args, { stdio: ["ignore", "pipe", "pipe"] });
    const out: Buffer[] = [];
    let err = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
    child.stdout.on("data", (chunk: Buffer) => out.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => {
      if (err.length < 20_000) err += chunk.toString();
    });
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? -1, stdout: Buffer.concat(out), stderr: err });
    });
  });
}

/** Length of a local video in seconds, or null if ffmpeg can't read it. */
export async function probeDurationSeconds(filePath: string): Promise<number | null> {
  // `ffmpeg -i` with no output exits 1 but still prints the Duration line.
  const { stderr } = await runFfmpeg(["-hide_banner", "-i", filePath], 20_000);
  return parseFfmpegDuration(stderr);
}

/** Mono 16 kHz MP3: about 0.4 MB per minute, far under the 25 MB API limit. */
export async function extractAudioMp3(filePath: string): Promise<Buffer> {
  const { code, stdout, stderr } = await runFfmpeg([
    "-hide_banner", "-loglevel", "error", "-i", filePath,
    "-vn", "-ac", "1", "-ar", "16000", "-c:a", "libmp3lame", "-b:a", "48k", "-f", "mp3", "pipe:1",
  ]);
  if (code !== 0 || stdout.length === 0) throw new Error(`ffmpeg exited ${code}: ${stderr.slice(0, 200)}`);
  return stdout;
}

export function createTranscriber(deps: {
  apiKey: string | null;
  model: string;
  /** A local file for one of our stored Walkthroughs (disk or S3), or null for outside links. */
  openVideo: (videoUrl: string) => Promise<{ path: string; cleanup: () => Promise<void> } | null>;
  fetch?: typeof fetch;
  extractAudio?: (filePath: string) => Promise<Buffer>;
}) {
  const doFetch = deps.fetch ?? fetch;
  const extractAudio = deps.extractAudio ?? extractAudioMp3;

  return {
    async transcribe(videoUrl: string): Promise<TranscriptResult> {
      if (!deps.apiKey) return { ok: false, reason: "Transcription isn't set up on this server." };

      let video: Awaited<ReturnType<typeof deps.openVideo>>;
      try {
        video = await deps.openVideo(videoUrl);
      } catch (err) {
        console.warn("[transcription] video download failed:", err instanceof Error ? err.message : err);
        return { ok: false, reason: "The Walkthrough video couldn't be downloaded." };
      }
      if (!video)
        return { ok: false, reason: "The Walkthrough is an external link, so it couldn't be transcribed." };

      let audio: Buffer;
      try {
        audio = await extractAudio(video.path);
      } catch (err) {
        console.warn("[transcription] audio extraction failed:", err instanceof Error ? err.message : err);
        return { ok: false, reason: "The Walkthrough's audio couldn't be read." };
      } finally {
        await video.cleanup();
      }

      const form = new FormData();
      form.append("model", deps.model);
      form.append("response_format", "json");
      form.append("file", new File([new Uint8Array(audio)], "walkthrough.mp3", { type: "audio/mpeg" }));

      try {
        const res = await doFetch(OPENAI_TRANSCRIBE_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${deps.apiKey}` },
          body: form,
          signal: AbortSignal.timeout(90_000),
        });
        if (!res.ok) return { ok: false, reason: `The transcription service answered ${res.status}.` };
        const text = ((await res.json()) as { text?: string }).text?.trim() ?? "";
        return text ? { ok: true, transcript: text } : { ok: false, reason: "No speech was found in the Walkthrough." };
      } catch {
        return { ok: false, reason: "The transcription service couldn't be reached." };
      }
    },
  };
}

export type Transcriber = ReturnType<typeof createTranscriber>;
