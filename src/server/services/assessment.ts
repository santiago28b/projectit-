import { assessmentDao } from "@/server/database/dao";
import type { AssessedEvidence, AssessmentDao } from "@/server/database/dao/pg/assessment";
import { env } from "@/server/lib/env";
import {
  aiService,
  COMMUNICATION_SKILL,
  type AIService,
  type SubmissionEvaluationResult,
} from "@/server/services/ai";
import { createRepoReader, type RepoReader, type RepoSnapshot } from "@/server/services/repoReader";
import { createTranscriber, type Transcriber } from "@/server/services/transcription";
import { uploadPath } from "@/server/services/uploads";
import { evidenceLevels } from "@/shared/models/review";

/** A rule broke; `status` is the HTTP status the controller should send. */
export class AssessmentError extends Error {
  constructor(
    message: string,
    readonly status: 404 | 409,
  ) {
    super(message);
  }
}

const MAX_ATTEMPTS = 2; // one automatic retry
const MAX_FOLLOW_UPS = 5;

const sameSkill = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** The Project's skills plus Communication (unless it's already listed). */
export function skillsToAssess(projectSkills: string[]): string[] {
  return projectSkills.some((s) => sameSkill(s, COMMUNICATION_SKILL))
    ? projectSkills
    : [...projectSkills, COMMUNICATION_SKILL];
}

/**
 * One Evidence entry per skill, in the skill's own spelling. Skills the AI
 * skipped, and levels it made up, become `not_assessed`.
 */
export function evidenceForSkills(skills: string[], result: SubmissionEvaluationResult): AssessedEvidence[] {
  return skills.map((skill) => {
    const found = result.evidence.find((e) => sameSkill(e.skill, skill));
    return found && evidenceLevels.includes(found.level)
      ? { skill, level: found.level, rationale: found.rationale }
      : { skill, level: "not_assessed", rationale: "The AI didn't assess this skill." };
  });
}

/** A reviewer-safe reason: a category, never raw API or SDK error text. */
export function shortReason(err: unknown): string {
  const detail = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (/time(d)? ?out|timeout|aborted/.test(detail)) return "The AI took too long to respond. Try again.";
  if (/429|529|overloaded|rate limit/.test(detail)) return "The AI service is busy right now. Try again in a minute.";
  if (/declined|refus/.test(detail)) return "The AI declined to assess this Submission.";
  return "The AI couldn't finish the Assessment. Try again.";
}

export function createAssessmentService(deps: {
  dao: AssessmentDao;
  ai: AIService;
  transcriber: Transcriber;
  repoReader: RepoReader;
}) {
  async function attempt(submissionId: string): Promise<void> {
    const loaded = await deps.dao.load(submissionId);
    if (!loaded) throw new Error("Submission not found");
    const { submission, project } = loaded;
    const skills = skillsToAssess(project.skills);

    // Transcript (kept even if the AI step fails, so a retry doesn't redo it).
    let transcript = submission.transcript;
    let transcriptNote: string | undefined;
    if (!transcript) {
      const result = await deps.transcriber.transcribe(submission.videoUrl);
      if (result.ok) {
        transcript = result.transcript;
        await deps.dao.saveTranscript(submissionId, transcript);
      } else {
        transcriptNote = result.reason;
      }
    }

    let repo: RepoSnapshot | null = null;
    let repoNote: string | undefined = "No repository was provided.";
    if (submission.repositoryUrl) {
      const read = await deps.repoReader.read(submission.repositoryUrl, project.skills);
      if (read.ok) {
        repo = read.snapshot;
        repoNote = undefined;
      } else {
        repoNote = read.reason;
      }
    }

    const result = await deps.ai.evaluateSubmission({
      projectTitle: project.title,
      scenario: project.scenario,
      projectSkills: skills,
      writtenResponse: submission.writtenResponse,
      repositoryUrl: submission.repositoryUrl ?? undefined,
      transcript,
      transcriptNote,
      repo,
      repoNote,
    });
    if (result.evidence.length === 0) throw new Error("the AI returned no Evidence");

    const evidence = evidenceForSkills(skills, result).map((e) =>
      !transcript && sameSkill(e.skill, COMMUNICATION_SKILL)
        ? { ...e, level: "not_assessed" as const, rationale: `No Walkthrough Transcript: ${transcriptNote ?? "not available"}` }
        : e,
    );
    await deps.dao.complete(submissionId, {
      evidence,
      followUpQuestions: result.followUpQuestions.slice(0, MAX_FOLLOW_UPS),
    });
  }

  return {
    /**
     * The background Assessment of one Submission. Safe to call more than once:
     * only a `pending` Submission is picked up. Never throws.
     */
    async run(submissionId: string): Promise<void> {
      try {
        if (!(await deps.dao.claim(submissionId))) return;
        let lastError: unknown;
        for (let n = 1; n <= MAX_ATTEMPTS; n++) {
          try {
            await attempt(submissionId);
            return;
          } catch (err) {
            lastError = err;
            console.warn(`[assessment] ${submissionId} attempt ${n} failed:`, err instanceof Error ? err.message : err);
          }
        }
        await deps.dao.fail(submissionId, shortReason(lastError));
      } catch (err) {
        console.warn(`[assessment] ${submissionId} could not run:`, err instanceof Error ? err.message : err);
      }
    },

    /** A reviewing Company puts a failed Assessment back in the queue. Call `run` after. */
    async requestRetry(submissionId: string, companyId: string): Promise<void> {
      if (!(await deps.dao.companyCanReview(submissionId, companyId)))
        throw new AssessmentError("Submission not found", 404);
      if (!(await deps.dao.requeue(submissionId)))
        throw new AssessmentError("Only a failed Assessment can be retried", 409);
    },
  };
}

export type AssessmentService = ReturnType<typeof createAssessmentService>;

export const assessmentService = createAssessmentService({
  dao: assessmentDao,
  ai: aiService,
  transcriber: createTranscriber({
    apiKey: env.openaiApiKey,
    model: env.openaiTranscribeModel,
    uploadPath,
  }),
  repoReader: createRepoReader({ token: env.githubToken }),
});
