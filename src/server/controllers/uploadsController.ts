import { NextResponse, type NextRequest } from "next/server";

import { jsonError } from "@/server/controllers/http";
import { noCandidate } from "@/server/controllers/projectsController";
import { getCurrentCandidate } from "@/server/lib/currentUser";
import { readUpload, saveUpload, UploadError } from "@/server/services/uploads";

export const uploadsController = {
  /** multipart/form-data: `file`, plus `kind` = "walkthrough" | "file". */
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

  async read(request: NextRequest, name: string) {
    const response = await readUpload(name, request.headers.get("range"));
    return response ?? NextResponse.json({ error: "File not found" }, { status: 404 });
  },
};
