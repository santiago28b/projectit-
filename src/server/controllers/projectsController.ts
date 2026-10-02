import { NextResponse, type NextRequest } from "next/server";

import { jsonError, requireQueryParam } from "@/server/controllers/http";
import { projectsService } from "@/server/services/projects";

export const projectsController = {
  async listMarketplace(request: NextRequest) {
    try {
      const url = new URL(request.url);
      const candidateId = requireQueryParam(url, "candidateId");
      if (candidateId instanceof NextResponse) return candidateId;

      const projects = await projectsService.listMarketplace(candidateId);
      return NextResponse.json({ projects });
    } catch (err) {
      return jsonError(err);
    }
  },

  async getById(_request: NextRequest, projectId: string) {
    try {
      const project = await projectsService.getById(projectId);
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      return NextResponse.json({ project });
    } catch (err) {
      return jsonError(err);
    }
  },
};
