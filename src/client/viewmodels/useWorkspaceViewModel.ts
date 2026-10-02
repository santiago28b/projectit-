"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { readVideoDuration } from "@/client/lib/videoDuration";
import { projectsService } from "@/client/services/projectsService";
import { submissionsService } from "@/client/services/submissionsService";
import { useLoaded } from "@/client/viewmodels/useLoaded";
import { checkWalkthroughDuration } from "@/shared/models/walkthrough";

interface Draft {
  writtenResponse: string;
  repositoryUrl: string;
}

const emptyDraft: Draft = { writtenResponse: "", repositoryUrl: "" };

/** Draft text survives a refresh. Storage can throw (private mode), so guard it. */
function loadDraft(key: string): Draft {
  try {
    const saved = localStorage.getItem(key);
    return saved ? { ...emptyDraft, ...(JSON.parse(saved) as Draft) } : emptyDraft;
  } catch {
    return emptyDraft;
  }
}

function saveDraft(key: string, draft: Draft | null) {
  try {
    if (draft) localStorage.setItem(key, JSON.stringify(draft));
    else localStorage.removeItem(key);
  } catch {
    // Draft saving is a convenience only.
  }
}

function message(reason: unknown) {
  return reason instanceof Error ? reason.message : "Something went wrong. Please try again.";
}

export function useWorkspaceViewModel(projectId: string) {
  const router = useRouter();
  const draftKey = `workspace-draft:${projectId}`;
  const { data: project, error: loadError, isLoading } = useLoaded(projectId, (signal) =>
    projectsService.getById(projectId, signal),
  );

  // The form renders only after the Project loads client-side, so reading
  // localStorage here can't cause a hydration mismatch.
  const [draft, setDraft] = useState<Draft>(() => loadDraft(draftKey));
  const [walkthrough, setWalkthrough] = useState<{ url: string; label: string } | null>(null);
  const [files, setFiles] = useState<{ url: string; name: string }[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // One Submission per Project: send people who already submitted to their Evidence.
  useEffect(() => {
    if (project?.mySubmissionId)
      router.replace(`/candidate/submissions/${project.mySubmissionId}`);
  }, [project?.mySubmissionId, router]);

  function updateDraft(change: Partial<Draft>) {
    const next = { ...draft, ...change };
    setDraft(next);
    saveDraft(draftKey, next);
  }

  async function uploadWalkthrough(file: File) {
    setError("");
    // Check the length before spending time on the upload. If the browser can't
    // tell (some WebM files report no length), the server checks instead.
    const seconds = await readVideoDuration(file).catch(() => Number.NaN);
    if (Number.isFinite(seconds)) {
      const check = checkWalkthroughDuration(seconds);
      if (!check.ok) {
        setError(check.message);
        return;
      }
    }
    setProgress(0);
    try {
      const url = await submissionsService.upload(file, "walkthrough", setProgress);
      setWalkthrough({ url, label: file.name });
    } catch (reason) {
      setError(message(reason));
    } finally {
      setProgress(null);
    }
  }

  function setWalkthroughLink(link: string) {
    setError("");
    const url = link.trim();
    if (!/^https?:\/\//i.test(url)) {
      setError("Paste a full video link starting with https://");
      return;
    }
    setWalkthrough({ url, label: url });
  }

  async function addFile(file: File) {
    setError("");
    try {
      const url = await submissionsService.upload(file, "file");
      setFiles((current) => [...current, { url, name: file.name }]);
    } catch (reason) {
      setError(message(reason));
    }
  }

  function removeFile(url: string) {
    setFiles((current) => current.filter((f) => f.url !== url));
  }

  const uploading = progress !== null;
  const canSubmit =
    !!walkthrough && draft.writtenResponse.trim().length > 0 && !uploading && !submitting;

  async function submit() {
    if (!walkthrough || !canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const submission = await submissionsService.submit({
        projectId,
        writtenResponse: draft.writtenResponse,
        repositoryUrl: draft.repositoryUrl || undefined,
        fileUrls: files.map((f) => f.url),
        videoUrl: walkthrough.url,
      });
      saveDraft(draftKey, null);
      router.push(`/candidate/submissions/${submission.id}`);
    } catch (reason) {
      setError(message(reason));
      setSubmitting(false);
    }
  }

  return {
    project,
    loadError,
    isLoading,
    draft,
    updateDraft,
    walkthrough,
    clearWalkthrough: () => setWalkthrough(null),
    uploadWalkthrough,
    setWalkthroughLink,
    progress,
    files,
    addFile,
    removeFile,
    canSubmit,
    submitting,
    submit,
    error,
  };
}
