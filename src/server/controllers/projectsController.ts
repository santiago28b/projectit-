import { NextResponse, type NextRequest } from "next/server";

import { jsonError } from "@/server/controllers/http";
import { getCurrentCandidate } from "@/server/lib/currentUser";
import { projectsService } from "@/server/services/projects";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function noCandidate() {
  return NextResponse.json(
    { error: "Switch to a Candidate account to see Projects" },
    { status: 401 },
  );
}

export const projectsController = {
  async listMarketplace(_request: NextRequest) {
    void _request;
    try {
      const candidate = await getCurrentCandidate();
      if (!candidate) return noCandidate();
      const projects = await projectsService.listMarketplace(candidate);
      return NextResponse.json({ projects });
    } catch (err) {
      return jsonError(err);
    }
  },

  async getById(_request: NextRequest, projectId: string) {
    void _request;
    try {
      const candidate = await getCurrentCandidate();
      if (!candidate) return noCandidate();
      const project = uuid.test(projectId)
        ? await projectsService.getDetail(projectId, candidate)
        : null;
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      return NextResponse.json({ project });
    } catch (err) {
      return jsonError(err);
    }
  },
};
