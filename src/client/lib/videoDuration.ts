/**
 * A video file's length in seconds, read in the browser before upload.
 * Some recordings (often WebM) report Infinity; callers treat that as unknown.
 */
export function readVideoDuration(file: File, timeoutMs = 10_000): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    const done = (fn: () => void) => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      fn();
    };
    const timer = setTimeout(() => done(() => reject(new Error("timed out"))), timeoutMs);
    video.preload = "metadata";
    video.onloadedmetadata = () => done(() => resolve(video.duration));
    video.onerror = () => done(() => reject(new Error("unreadable video")));
    video.src = url;
  });
}
