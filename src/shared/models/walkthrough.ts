/** Walkthrough length rules, shared by the upload form and the server. */

export const WALKTHROUGH_MAX_SECONDS = 120;
/** A little slack so a 2:03 recording isn't rejected. */
export const WALKTHROUGH_GRACE_SECONDS = 10;

function clock(seconds: number): string {
  const whole = Math.ceil(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export function checkWalkthroughDuration(
  seconds: number,
): { ok: true } | { ok: false; message: string } {
  if (!Number.isFinite(seconds) || seconds <= 0)
    return { ok: false, message: "We couldn't read this video's length. Try another file." };
  if (seconds > WALKTHROUGH_MAX_SECONDS + WALKTHROUGH_GRACE_SECONDS)
    return {
      ok: false,
      message: `Your Walkthrough is ${clock(seconds)} long. Keep it to 2 minutes or less.`,
    };
  return { ok: true };
}

/** Seconds from ffmpeg's `Duration: HH:MM:SS.ss` line, or null. */
export function parseFfmpegDuration(stderr: string): number | null {
  const match = stderr.match(/Duration:\s*(\d+):(\d{2}):(\d{2}(?:\.\d+)?)/);
  if (!match) return null;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}
