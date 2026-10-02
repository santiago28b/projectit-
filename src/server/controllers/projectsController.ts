import { NextResponse, type NextRequest } from "next/server";

import { jsonError, requireQueryParam } from "@/server/controllers/http";
import { getCurrentUser } from "@/server/lib/currentUser";
import { projectsService } from "@/server/services/projects";
import type { CreateProjectInput } from "@/shared/models/projects";
import type {
  ProjectVisibility,
  RubricCriterion,
} from "@/shared/models/domain";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VISIBILITIES = new Set([
  "public",
  "university",
  "region",
  "invite",
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function projectsError(err: unknown) {
  const message = err instanceof Error ? err.message : "Unexpected error";
  if (/required|Invalid|Only /.test(message)) return jsonError(err, 400);
  if (/Company admin/.test(message)) return jsonError(err, 401);
  return jsonError(err);
}

async function requireCompany() {
  const current = await getCurrentUser();
  if (!current || current.user.role !== "company_admin" || !current.company) {
    return {
      error: NextResponse.json(
        { error: "Switch to a Company account first" },
        { status: 401 },
      ),
    };
  }
  return {
    companyId: current.company.id,
    userId: current.user.id,
  };
}

function parseCreateBody(body: unknown): CreateProjectInput | NextResponse {
  if (!isObject(body)) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (
    typeof body.title !== "string" ||
    typeof body.scenario !== "string" ||
    typeof body.instructions !== "string" ||
    typeof body.visibility !== "string" ||
    !VISIBILITIES.has(body.visibility) ||
    !Array.isArray(body.skills) ||
    !Array.isArray(body.deliverables) ||
    !Array.isArray(body.rubric)
  ) {
    return NextResponse.json(
      { error: "Title, scenario, instructions, skills, deliverables, Visibility, and Rubric are required" },
      { status: 400 },
    );
  }

  const rubric: RubricCriterion[] = [];
  for (const item of body.rubric) {
    if (
      !isObject(item) ||
      typeof item.name !== "string" ||
      typeof item.description !== "string"
    ) {
      return NextResponse.json(
        { error: "Each Rubric category needs a name and description" },
        { status: 400 },
      );
    }
    rubric.push({ name: item.name, description: item.description });
  }

  return {
    title: body.title,
    scenario: body.scenario,
    description: typeof body.description === "string" ? body.description : "",
    instructions: body.instructions,
    skills: body.skills.filter((s): s is string => typeof s === "string"),
    expectedDurationMinutes:
      typeof body.expectedDurationMinutes === "number"
        ? body.expectedDurationMinutes
        : null,
    difficulty: typeof body.difficulty === "string" ? body.difficulty : null,
    deliverables: body.deliverables.filter(
      (d): d is string => typeof d === "string",
    ),
    deadline: typeof body.deadline === "string" ? body.deadline : null,
    visibility: body.visibility as ProjectVisibility,
    visibilityTarget:
      typeof body.visibilityTarget === "string" ? body.visibilityTarget : null,
    rubric,
    publish: body.publish === true,
  };
}

export const projectsController = {
  async listMarketplace(request: NextRequest) {
    try {
      const url = new URL(request.url);
      const candidateId = requireQueryParam(url, "candidateId");
      if (candidateId instanceof NextResponse) return candidateId;

      const projects = await projectsService.listMarketplace(candidateId);
      return NextResponse.json({ projects });
    } catch (err) {
      return projectsError(err);
    }
  },

  async getById(_request: NextRequest, projectId: string) {
    try {
      if (!uuid.test(projectId)) {
        return NextResponse.json({ error: "Invalid Project id" }, { status: 400 });
      }
      const project = await projectsService.getById(projectId);
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      return NextResponse.json({ project });
    } catch (err) {
      return projectsError(err);
    }
  },

  async listForCompany() {
    try {
      const auth = await requireCompany();
      if ("error" in auth) return auth.error;
      const projects = await projectsService.listForCompany(auth.companyId);
      return NextResponse.json({ projects });
    } catch (err) {
      return projectsError(err);
    }
  },

  async listSponsorable() {
    try {
      const auth = await requireCompany();
      if ("error" in auth) return auth.error;
      const projects = await projectsService.listSponsorable(auth.companyId);
      return NextResponse.json({ projects });
    } catch (err) {
      return projectsError(err);
    }
  },

  async create(request: NextRequest) {
    try {
      const auth = await requireCompany();
      if ("error" in auth) return auth.error;
      const body: unknown = await request.json();
      const input = parseCreateBody(body);
      if (input instanceof NextResponse) return input;
      const project = await projectsService.create(
        auth.companyId,
        auth.userId,
        input,
      );
      return NextResponse.json({ project }, { status: 201 });
    } catch (err) {
      if (err instanceof SyntaxError) {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      }
      return projectsError(err);
    }
  },

  async getDashboard(_request: NextRequest, projectId: string) {
    try {
      if (!uuid.test(projectId)) {
        return NextResponse.json({ error: "Invalid Project id" }, { status: 400 });
      }
      const auth = await requireCompany();
      if ("error" in auth) return auth.error;
      const dashboard = await projectsService.getDashboard(
        auth.companyId,
        projectId,
      );
      if (!dashboard) {
        return NextResponse.json(
          { error: "Project not found or your Company does not own or Sponsor it" },
          { status: 404 },
        );
      }
      return NextResponse.json(dashboard);
    } catch (err) {
      return projectsError(err);
    }
  },

  async publish(_request: NextRequest, projectId: string) {
    try {
      if (!uuid.test(projectId)) {
        return NextResponse.json({ error: "Invalid Project id" }, { status: 400 });
      }
      const auth = await requireCompany();
      if ("error" in auth) return auth.error;
      const project = await projectsService.publish(auth.companyId, projectId);
      return NextResponse.json({ project });
    } catch (err) {
      return projectsError(err);
    }
  },

  async sponsor(_request: NextRequest, projectId: string) {
    try {
      if (!uuid.test(projectId)) {
        return NextResponse.json({ error: "Invalid Project id" }, { status: 400 });
      }
      const auth = await requireCompany();
      if ("error" in auth) return auth.error;
      await projectsService.sponsor(auth.companyId, projectId);
      return NextResponse.json({ ok: true });
    } catch (err) {
      return projectsError(err);
    }
  },
};
