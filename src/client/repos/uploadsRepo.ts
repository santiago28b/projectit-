import { ApiError } from "@/client/repos/http";

export type UploadKind = "walkthrough" | "file";

function postLocal(
  file: File,
  kind: UploadKind,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");
    xhr.responseType = "json";
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () => {
      const body = (xhr.response ?? {}) as { url?: string; error?: string };
      if (xhr.status >= 200 && xhr.status < 300 && body.url) resolve(body.url);
      else reject(new ApiError(body.error ?? `Upload failed (${xhr.status})`, xhr.status));
    };
    xhr.onerror = () => reject(new ApiError("Upload failed. Check your connection.", 0));
    xhr.send(form);
  });
}

function putToS3(
  uploadUrl: string,
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new ApiError(`S3 upload failed (${xhr.status})`, xhr.status));
    };
    xhr.onerror = () => reject(new ApiError("S3 upload failed. Check your connection.", 0));
    xhr.send(file);
  });
}

/**
 * Upload a Walkthrough via S3 when available (presign → PUT), else local disk.
 * Deliverable files always use local POST. Uses XHR so progress events work.
 */
async function uploadWalkthrough(
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  const presignRes = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      kind: "walkthrough",
      contentType: file.type || "video/mp4",
      size: file.size,
    }),
  });

  if (presignRes.status === 501 || presignRes.status === 404) {
    return postLocal(file, "walkthrough", onProgress);
  }

  const body = (await presignRes.json().catch(() => ({}))) as {
    uploadUrl?: string;
    publicUrl?: string;
    error?: string;
  };

  if (!presignRes.ok || !body.uploadUrl || !body.publicUrl) {
    throw new ApiError(body.error ?? `Presign failed (${presignRes.status})`, presignRes.status);
  }

  await putToS3(body.uploadUrl, file, onProgress);
  return body.publicUrl;
}

/**
 * Upload one file and resolve to its URL. Uses XMLHttpRequest because fetch
 * can't report upload progress, and Walkthrough videos are large.
 */
export const uploadsRepo = {
  upload(
    file: File,
    kind: UploadKind,
    onProgress?: (fraction: number) => void,
  ): Promise<string> {
    if (kind === "walkthrough") return uploadWalkthrough(file, onProgress);
    return postLocal(file, kind, onProgress);
  },
};
