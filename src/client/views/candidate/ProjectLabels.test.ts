import { describe, expect, it } from "vitest";

import type { ProjectCard } from "@/shared/models/projects";

import { formatDeadline, formatDuration, ownerLine } from "./ProjectLabels";

function card(companies: ProjectCard["companies"]): ProjectCard {
  return { companies } as ProjectCard;
}

describe("Project card labels", () => {
  it("formats expected duration", () => {
    expect(formatDuration(90)).toBe("~90 min");
    expect(formatDuration(45)).toBe("~45 min");
    expect(formatDuration(60)).toBe("~1 hr");
    expect(formatDuration(120)).toBe("~2 hr");
    expect(formatDuration(null)).toBeNull();
  });

  it("formats the deadline", () => {
    expect(formatDeadline("2026-10-16T12:00:00Z")).toBe("Due Oct 16");
    expect(formatDeadline(null)).toBeNull();
  });

  it("names the owning Company first", () => {
    expect(ownerLine(card([{ id: "n", name: "Northwind Health", relationship: "owner" }]))).toBe(
      "By Northwind Health",
    );
  });

  it("names Sponsors of a Platform Project", () => {
    expect(
      ownerLine(
        card([
          { id: "s", name: "Summit Logistics", relationship: "sponsor" },
          { id: "a", name: "Acme", relationship: "sponsor" },
        ]),
      ),
    ).toBe("Sponsored by Summit Logistics, Acme");
  });

  it("credits Project It when nobody owns or Sponsors it", () => {
    expect(ownerLine(card([]))).toBe("By Project It");
  });
});
