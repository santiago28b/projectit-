import { NextResponse, type NextRequest } from "next/server";

import { jsonError } from "@/server/controllers/http";
import { noCandidate } from "@/server/controllers/projectsController";
import { getCurrentCandidate } from "@/server/lib/currentUser";
import {
  readUpload,
  saveUpload,
  s3WalkthroughsEnabled,
  UploadError,
  presignWalkthrough,
} from "@/server/services/uploads";

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export const uploadsController = {
  /** multipart/form-data: `file`, plus `kind` = "walkthrough" | "file". Local disk (S3 uses /presign). */
  async create(request: NextRequest) {
    try {
      if (!(await getCurrentCandidate())) return noCandidate();
      const form = await request.formData();
      const file = form.get("file");
      const kind = form.get("kind") === "walkthrough" ? "walkthrough" : "file";
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Choose a file to upload" }, { status: 400 });
      }
      const url = await saveUpload(file, kind);
      return NextResponse.json({ url }, { status: 201 });
    } catch (err) {
      if (err instanceof UploadError)
        return NextResponse.json({ error: err.message }, { status: 400 });
      return jsonError(err);
    }
  },

  /**
   * JSON: { kind: "walkthrough", contentType, size } → { uploadUrl, publicUrl }.
   * Returns 501 when S3 is not configured so the client can fall back to local POST.
   */
  async presign(request: NextRequest) {
    try {
      if (!(await getCurrentCandidate())) return noCandidate();
      if (!s3WalkthroughsEnabled()) {
        return NextResponse.json(
          { error: "S3 Walkthrough uploads are not configured" },
          { status: 501 },
        );
      }
      const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
      if (!body || body.kind !== "walkthrough") {
        return NextResponse.json(
          { error: "Only Walkthrough videos can be presigned" },
          { status: 400 },
        );
      }
      const contentType = optionalString(body.contentType)?.trim() ?? "";
      const size = typeof body.size === "number" ? body.size : Number(body.size);
      if (!contentType || !Number.isFinite(size)) {
        return NextResponse.json(
          { error: "contentType and size are required" },
          { status: 400 },
        );
      }
      const result = await presignWalkthrough({ contentType, size });
      return NextResponse.json(
        { uploadUrl: result.uploadUrl, publicUrl: result.publicUrl },
        { status: 201 },
      );
    } catch (err) {
      if (err instanceof UploadError)
        return NextResponse.json({ error: err.message }, { status: 400 });
      return jsonError(err);
    }
  },

  async read(request: NextRequest, name: string) {
    const response = await readUpload(name, request.headers.get("range"));
    return response ?? NextResponse.json({ error: "File not found" }, { status: 404 });
  },
};
