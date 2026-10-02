import { NextResponse, type NextRequest } from "next/server";

import { jsonError } from "@/server/controllers/http";
import { getCurrentUser } from "@/server/lib/currentUser";
import { aiService } from "@/server/services/ai";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const aiProjectsController = {
  /** Extract skills + 3 Project ideas from a pasted Job description (mocked). */
  async generateFromJob(request: NextRequest) {
    try {
      const current = await getCurrentUser();
      if (!current || current.user.role !== "company_admin" || !current.company) {
        return NextResponse.json(
          { error: "Switch to a Company account first" },
          { status: 401 },
        );
      }

      const body: unknown = await request.json();
      if (
        !isObject(body) ||
        typeof body.jobDescription !== "string" ||
        !body.jobDescription.trim()
      ) {
        return NextResponse.json(
          { error: "A Job description is required" },
          { status: 400 },
        );
      }

      const jobDescription = body.jobDescription.trim();
      const [skills, ideas] = await Promise.all([
        aiService.extractJobSkills(jobDescription),
        aiService.generateProjectIdeas(jobDescription),
      ]);

      return NextResponse.json({ skills, ideas });
    } catch (err) {
      if (err instanceof SyntaxError) {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      }
      return jsonError(err);
    }
  },

  /** Expand a chosen idea into a full editable Project draft (mocked). */
  async expandIdea(request: NextRequest) {
    try {
      const current = await getCurrentUser();
      if (!current || current.user.role !== "company_admin" || !current.company) {
        return NextResponse.json(
          { error: "Switch to a Company account first" },
          { status: 401 },
        );
      }

      const body: unknown = await request.json();
      if (
        !isObject(body) ||
        typeof body.title !== "string" ||
        typeof body.scenario !== "string" ||
        !Array.isArray(body.skills) ||
        typeof body.expectedDurationMinutes !== "number" ||
        !Array.isArray(body.deliverables) ||
        typeof body.whyRelevant !== "string"
      ) {
        return NextResponse.json(
          { error: "A complete Project idea is required" },
          { status: 400 },
        );
      }

      const generated = await aiService.generateProject({
        title: body.title,
        scenario: body.scenario,
        skills: body.skills.filter((s): s is string => typeof s === "string"),
        expectedDurationMinutes: body.expectedDurationMinutes,
        deliverables: body.deliverables.filter(
          (d): d is string => typeof d === "string",
        ),
        whyRelevant: body.whyRelevant,
      });

      return NextResponse.json({ project: generated });
    } catch (err) {
      if (err instanceof SyntaxError) {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      }
      return jsonError(err);
    }
  },
};
