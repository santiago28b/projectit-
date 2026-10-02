import { describe, expect, it, vi } from "vitest";

import { createTranscriber, uploadNameFromUrl } from "./transcription";

describe("uploadNameFromUrl", () => {
  it("finds the stored file behind an uploaded Walkthrough URL", () => {
    expect(
      uploadNameFromUrl("http://localhost:3000/api/uploads/0b7e1c3a-1111-2222-3333-444455556666.mp4"),
    ).toBe("0b7e1c3a-1111-2222-3333-444455556666.mp4");
  });

  it.each([
    ["a YouTube link", "https://www.youtube.com/watch?v=abcdefghijk"],
    ["a Loom link", "https://www.loom.com/share/abc123"],
    ["a path trick", "http://localhost:3000/api/uploads/../../etc/passwd"],
    ["not a URL", "walkthrough.mp4"],
  ])("ignores %s", (_label, url) => {
    expect(uploadNameFromUrl(url)).toBeNull();
  });
});

const UPLOAD = "http://localhost:3000/api/uploads/0b7e1c3a-1111-2222-3333-444455556666.mp4";

function setup(
  opts: {
    apiKey?: string | null;
    reply?: () => Promise<Response>;
    audio?: () => Promise<Buffer>;
    openVideo?: (url: string) => Promise<{ path: string; cleanup: () => Promise<void> } | null>;
  } = {},
) {
  const fetchMock = vi.fn(opts.reply ?? (async () => Response.json({ text: "  I fixed the race with AbortController.  " })));
  const extractAudio = vi.fn(opts.audio ?? (async () => Buffer.from("mp3-bytes")));
  const cleanup = vi.fn(async () => {});
  const openVideo =
    opts.openVideo ??
    (async (url: string) => {
      const name = uploadNameFromUrl(url);
      return name ? { path: `/uploads/${name}`, cleanup } : null;
    });
  const transcriber = createTranscriber({
    apiKey: opts.apiKey === undefined ? "sk-test" : opts.apiKey,
    model: "gpt-4o-transcribe",
    fetch: fetchMock as unknown as typeof fetch,
    extractAudio,
    openVideo,
  });
  return { transcriber, fetchMock, extractAudio, cleanup };
}

describe("transcriber.transcribe", () => {
  it("extracts the audio and sends it to OpenAI, returning the trimmed text", async () => {
    const { transcriber, fetchMock, extractAudio } = setup();

    const result = await transcriber.transcribe(UPLOAD);

    expect(result).toEqual({ ok: true, transcript: "I fixed the race with AbortController." });
    expect(extractAudio).toHaveBeenCalledWith("/uploads/0b7e1c3a-1111-2222-3333-444455556666.mp4");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.openai.com/v1/audio/transcriptions");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer sk-test");
    const form = init.body as FormData;
    expect(form.get("model")).toBe("gpt-4o-transcribe");
    expect((form.get("file") as File).name).toBe("walkthrough.mp3");
  });

  it("cleans up the video file once the audio is out (e.g. a temporary S3 download)", async () => {
    const { transcriber, cleanup } = setup();
    await transcriber.transcribe(UPLOAD);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("cleans up even when audio extraction fails", async () => {
    const { transcriber, cleanup } = setup({
      audio: async () => {
        throw new Error("ffmpeg exited 1");
      },
    });
    await transcriber.transcribe(UPLOAD);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("transcribes an S3 Walkthrough via the downloaded file", async () => {
    const s3 = "https://bucket.s3.amazonaws.com/walkthroughs/0b7e1c3a-1111-2222-3333-444455556666.mp4";
    const { transcriber, extractAudio } = setup({
      openVideo: async (url) => (url === s3 ? { path: "/tmp/walkthrough-x.mp4", cleanup: async () => {} } : null),
    });
    expect(await transcriber.transcribe(s3)).toEqual({ ok: true, transcript: "I fixed the race with AbortController." });
    expect(extractAudio).toHaveBeenCalledWith("/tmp/walkthrough-x.mp4");
  });

  it("says so when the S3 video can't be downloaded", async () => {
    const { transcriber } = setup({
      openVideo: async () => {
        throw new Error("S3 answered 403");
      },
    });
    expect(await transcriber.transcribe(UPLOAD)).toEqual({
      ok: false,
      reason: "The Walkthrough video couldn't be downloaded.",
    });
  });

  it("can't transcribe a Walkthrough that's an external link", async () => {
    const { transcriber, fetchMock } = setup();
    const result = await transcriber.transcribe("https://www.loom.com/share/abc123");
    expect(result).toEqual({
      ok: false,
      reason: "The Walkthrough is an external link, so it couldn't be transcribed.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("says so when transcription isn't set up", async () => {
    const { transcriber } = setup({ apiKey: null });
    expect(await transcriber.transcribe(UPLOAD)).toEqual({
      ok: false,
      reason: "Transcription isn't set up on this server.",
    });
  });

  it("reports a failed audio extraction", async () => {
    const { transcriber } = setup({
      audio: async () => {
        throw new Error("ffmpeg exited 1");
      },
    });
    expect(await transcriber.transcribe(UPLOAD)).toEqual({
      ok: false,
      reason: "The Walkthrough's audio couldn't be read.",
    });
  });

  it("reports an error from the transcription service", async () => {
    const { transcriber } = setup({ reply: async () => new Response("rate limited", { status: 429 }) });
    expect(await transcriber.transcribe(UPLOAD)).toEqual({
      ok: false,
      reason: "The transcription service answered 429.",
    });
  });

  it("treats silence as no Transcript", async () => {
    const { transcriber } = setup({ reply: async () => Response.json({ text: "   " }) });
    expect(await transcriber.transcribe(UPLOAD)).toEqual({
      ok: false,
      reason: "No speech was found in the Walkthrough.",
    });
  });
});
