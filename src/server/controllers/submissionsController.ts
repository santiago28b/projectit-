import { NextResponse, type NextRequest } from "next/server";

import { jsonError } from "@/server/controllers/http";
import { submissionsService } from "@/server/services/submissions";

export const submissionsController = {
  async create(request: NextRequest) {
    try {
      const body = (await request.json()) as {
        projectId?: string;
        candidateId?: string;
        writtenResponse?: string;
        repositoryUrl?: string;
        fileUrls?: string[];
        videoUrl?: string;
      };

      if (!body.projectId || !body.candidateId || !body.videoUrl) {
        return NextResponse.json(
          {
            error:
              "projectId, candidateId, and videoUrl (Walkthrough) are required",
          },
          { status: 400 },
        );
      }

      const submission = await submissionsService.submit({
        projectId: body.projectId,
        candidateId: body.candidateId,
        writtenResponse: body.writtenResponse ?? "",
        repositoryUrl: body.repositoryUrl,
        fileUrls: body.fileUrls,
        videoUrl: body.videoUrl,
      });
      return NextResponse.json({ submission }, { status: 201 });
    } catch (err) {
      return jsonError(err);
    }
  },
};
