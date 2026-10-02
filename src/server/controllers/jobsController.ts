import { NextResponse, type NextRequest } from "next/server";

import { requireCompany } from "@/server/controllers/auth";
import { jsonError } from "@/server/controllers/http";
import { jobsService } from "@/server/services/jobs";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function strings(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((v) => typeof v === "string")
    ? value
    : null;
}

export const jobsController = {
  /** POST /api/company/jobs — a Job for the role-switcher Company. */
  async create(request: NextRequest) {
    try {
      const auth = await requireCompany();
      if ("error" in auth) return auth.error;

      const body: unknown = await request.json();
      const requiredSkills = isObject(body) ? strings(body.requiredSkills) : null;
      const preferredSkills = isObject(body)
        ? strings(body.preferredSkills ?? [])
        : null;
      if (
        !isObject(body) ||
        typeof body.title !== "string" ||
        !requiredSkills ||
        !preferredSkills
      ) {
        return NextResponse.json(
          { error: "A title and a list of required skills are required" },
          { status: 400 },
        );
      }

      const job = await jobsService.create(auth.companyId, {
        title: body.title,
        description: typeof body.description === "string" ? body.description : "",
        requiredSkills,
        preferredSkills,
      });
      return NextResponse.json({ job }, { status: 201 });
    } catch (err) {
      if (err instanceof SyntaxError)
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      const message = err instanceof Error ? err.message : "";
      if (/required|Invalid/.test(message)) return jsonError(err, 400);
      return jsonError(err);
    }
  },
};
