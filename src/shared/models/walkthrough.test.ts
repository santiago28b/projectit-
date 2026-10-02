import { describe, expect, it } from "vitest";

import {
  WALKTHROUGH_MAX_SECONDS,
  checkWalkthroughDuration,
  parseFfmpegDuration,
} from "./walkthrough";

describe("checkWalkthroughDuration", () => {
  it("allows up to 2 minutes", () => {
    expect(WALKTHROUGH_MAX_SECONDS).toBe(120);
    expect(checkWalkthroughDuration(119).ok).toBe(true);
    expect(checkWalkthroughDuration(120).ok).toBe(true);
  });

  it("gives a 10-second grace so a 2:03 video isn't rejected", () => {
    expect(checkWalkthroughDuration(123).ok).toBe(true);
    expect(checkWalkthroughDuration(130).ok).toBe(true);
  });

  it("rejects anything longer than 2:10 with a clear message", () => {
    const result = checkWalkthroughDuration(131);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.message).toBe(
      "Your Walkthrough is 2:11 long. Keep it to 2 minutes or less.",
    );
  });

  it("rejects an empty or unreadable length", () => {
    expect(checkWalkthroughDuration(0).ok).toBe(false);
    expect(checkWalkthroughDuration(Number.NaN).ok).toBe(false);
  });
});

describe("parseFfmpegDuration", () => {
  it("reads the Duration line ffmpeg prints", () => {
    const stderr = `Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'clip.mp4':
  Duration: 00:01:58.43, start: 0.000000, bitrate: 1210 kb/s`;
    expect(parseFfmpegDuration(stderr)).toBeCloseTo(118.43);
  });

  it("handles hours", () => {
    expect(parseFfmpegDuration("Duration: 01:00:02.00, start")).toBe(3602);
  });

  it("returns null when there's no Duration (or it's N/A)", () => {
    expect(parseFfmpegDuration("Duration: N/A, start: 0")).toBeNull();
    expect(parseFfmpegDuration("not a video")).toBeNull();
  });
});
