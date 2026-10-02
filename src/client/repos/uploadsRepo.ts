import { ApiError } from "@/client/repos/http";

export type UploadKind = "walkthrough" | "file";

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
  },
};
