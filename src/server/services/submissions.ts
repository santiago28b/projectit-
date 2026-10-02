import { submissionsDao } from "@/server/database/dao";
import type { SubmissionsDao } from "@/server/database/dao/pg/submissions";
import {
  aiService,
  mockEvaluateSubmission,
  type AIService,
  type EvaluateSubmissionInput,
  type SubmissionEvaluationResult,
} from "@/server/services/ai";
import { projectsService, type ProjectsService } from "@/server/services/projects";
import type { Candidate, Submission } from "@/server/models/domain";
import type {
  MySubmissionSummary,
  MySubmissionView,
  SubmitProjectInput,
} from "@/shared/models/projects";
import { effectiveEvidence, evidenceLevels, safeExternalUrl } from "@/shared/models/review";

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
const AI_TIMEOUT_MS = 30_000;

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

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("AI evaluation timed out")), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * One Evidence entry per Project skill, using the Project's spelling. Skills
 * the AI skipped (or levels it made up) become `not_assessed`.
 */
function evidenceForSkills(
  skills: string[],
  result: SubmissionEvaluationResult,
): SubmissionEvaluationResult["evidence"] {
  return skills.map((skill) => {
    const found = result.evidence.find(
      (e) => e.skill.trim().toLowerCase() === skill.trim().toLowerCase(),
    );
    return found && evidenceLevels.includes(found.level)
      ? { skill, level: found.level, rationale: found.rationale }
      : { skill, level: "not_assessed", rationale: "" };
  });
}

export function createSubmissionsService(deps: {
  dao: SubmissionsDao;
  ai: AIService;
  projects: Pick<ProjectsService, "canStart">;
  now?: () => Date;
}) {
  const now = deps.now ?? (() => new Date());

  /** The live AI, or the mock if it fails, times out, or returns nothing usable. */
  async function evaluate(input: EvaluateSubmissionInput) {
    try {
      const result = await withTimeout(deps.ai.evaluateSubmission(input), AI_TIMEOUT_MS);
      if (result.evidence.length > 0) return result;
    } catch (err) {
      console.warn("evaluateSubmission failed; using mock:", err);
    }
    return mockEvaluateSubmission(input);
  }

  return {
    /**
     * Submit work: Walkthrough required, one Submission per Project, only for
     * Projects the Candidate can see, before the deadline. Writes AI-assessed
     * Evidence per skill and follow-up questions with the Submission.
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

      const result = await evaluate({
        projectTitle: project.title,
        scenario: project.scenario,
        projectSkills: project.skills,
        writtenResponse: clean.writtenResponse,
        repositoryUrl: clean.repositoryUrl ?? undefined,
      });

      try {
        return await deps.dao.createWithEvidence({
          projectId: project.id,
          candidateId: candidate.id,
          ...clean,
          followUpQuestions: result.followUpQuestions.slice(0, 5),
          evidence: evidenceForSkills(project.skills, result),
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
  ai: aiService,
  projects: projectsService,
});
