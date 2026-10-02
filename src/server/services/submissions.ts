import { submissionsDao } from "@/server/database/dao";
import type { SubmissionsDao } from "@/server/database/dao/pg/submissions";
import { projectsService, type ProjectsService } from "@/server/services/projects";
import { checkStoredWalkthroughLength } from "@/server/services/uploads";
import type { Candidate, Submission } from "@/server/models/domain";
import type {
  MySubmissionSummary,
  MySubmissionView,
  SubmitProjectInput,
} from "@/shared/models/projects";
import { effectiveEvidence, safeExternalUrl } from "@/shared/models/review";

/** A rule broke; `status` is the HTTP status the controller should send. */
export class SubmissionError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 403 | 404 | 409,
  ) {
    super(message);
  }
}

const MAX_WRITTEN = 10_000;
const MAX_FILES = 10;

function validate(input: SubmitProjectInput) {
  const videoUrl = safeExternalUrl(input.videoUrl?.trim() || null);
  if (!videoUrl) throw new SubmissionError("A Walkthrough video is required to submit", 400);

  const writtenResponse = input.writtenResponse?.trim() ?? "";
  if (!writtenResponse) throw new SubmissionError("Add a written explanation of your work", 400);
  if (writtenResponse.length > MAX_WRITTEN)
    throw new SubmissionError(`Keep the written explanation under ${MAX_WRITTEN} characters`, 400);

  let repositoryUrl: string | null = null;
  if (input.repositoryUrl?.trim()) {
    repositoryUrl = safeExternalUrl(input.repositoryUrl.trim()) ?? null;
    if (!repositoryUrl) throw new SubmissionError("Repository URL must start with http:// or https://", 400);
  }

  const fileUrls = (input.fileUrls ?? []).map((url) => safeExternalUrl(url));
  if (fileUrls.length > MAX_FILES || fileUrls.some((url) => !url))
    throw new SubmissionError("One of the attached files is invalid", 400);

  return { videoUrl, writtenResponse, repositoryUrl, fileUrls: fileUrls as string[] };
}

export function createSubmissionsService(deps: {
  dao: SubmissionsDao;
  projects: Pick<ProjectsService, "canStart">;
  /** Server-side 2-minute check for Walkthroughs that skipped our upload route (S3). */
  checkWalkthroughLength?: (videoUrl: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  now?: () => Date;
}) {
  const now = deps.now ?? (() => new Date());

  return {
    /**
     * Submit work: Walkthrough required, one Submission per Project, only for
     * Projects the Candidate can see, before the deadline. Saved with its
     * Assessment pending; the caller starts the background Assessment.
     */
    async submit(candidate: Candidate, input: SubmitProjectInput): Promise<Submission> {
      const clean = validate(input);

      const project = await deps.dao.findProject(input.projectId);
      if (!project) throw new SubmissionError("Project not found", 404);
      if (!(await deps.projects.canStart(project, candidate)))
        throw new SubmissionError("This Project isn't open to you", 403);
      if (project.deadline && new Date(project.deadline) < now())
        throw new SubmissionError("The deadline for this Project has passed", 403);
      if (await deps.dao.findId(project.id, candidate.id))
        throw new SubmissionError("You've already submitted to this Project", 409);

      if (deps.checkWalkthroughLength) {
        const length = await deps.checkWalkthroughLength(clean.videoUrl);
        if (!length.ok) throw new SubmissionError(length.message, 400);
      }

      try {
        return await deps.dao.create({
          projectId: project.id,
          candidateId: candidate.id,
          ...clean,
        });
      } catch (err) {
        // Two submits at once: the unique constraint is the real guard.
        if ((err as { code?: string }).code === "23505")
          throw new SubmissionError("You've already submitted to this Project", 409);
        throw err;
      }
    },

    listMine(candidate: Candidate): Promise<MySubmissionSummary[]> {
      return deps.dao.listMine(candidate.id);
    },

    /** The Candidate's own Submission and Evidence, without follow-up questions. */
    async getMine(submissionId: string, candidate: Candidate): Promise<MySubmissionView | null> {
      const found = await deps.dao.findMine(submissionId, candidate.id);
      if (!found) return null;
      const { followUpQuestions, ...submission } = found.submission;
      void followUpQuestions;
      return {
        submission,
        project: {
          id: found.project.id,
          title: found.project.title,
          skills: found.project.skills,
        },
        evidence: effectiveEvidence(found.evidence),
      };
    },
  };
}

export type SubmissionsService = ReturnType<typeof createSubmissionsService>;

export const submissionsService = createSubmissionsService({
  dao: submissionsDao,
  projects: projectsService,
  checkWalkthroughLength: (url) => checkStoredWalkthroughLength(url),
});
