import { reviewDao } from "@/server/database/dao/review";
import type { EvidenceLevel, User } from "@/shared/models/domain";
import {
  effectiveEvidence,
  evidenceLevels,
  type ReviewScreenData,
  type SaveEvaluationInput,
  type ShortlistInput,
} from "@/shared/models/review";

export type { ReviewScreenData } from "@/shared/models/review";

export function reviewerCompany(
  user: User & { companyId?: string },
): string | undefined {
  const companyId =
    user.companyId ?? user.profileData.companyId ?? user.profileData.company_id;
  return typeof companyId === "string" ? companyId : undefined;
}

export function createReviewService(dao: typeof reviewDao) {
  async function reviewerFor(projectId: string, reviewerId?: string) {
    const companyIds = await dao.companyIds(projectId);
    const reviewers = reviewerId
      ? [await dao.user(reviewerId)]
      : await dao.reviewers();
    const reviewer = reviewers.find(
      (user) =>
        user.role === "company_admin" &&
        companyIds.includes(reviewerCompany(user) ?? ""),
    );
    if (!reviewer)
      throw new Error(
        "No linked Company reviewer owns or Sponsors this Project",
      );
    return { reviewer, companyId: reviewerCompany(reviewer)! };
  }

  return {
    async listSubmissions(reviewerId?: string) {
      const entries = [];
      for (const submission of await dao.listSubmissions()) {
        const companyIds = await dao.companyIds(submission.projectId);
        const reviewers = reviewerId
          ? [await dao.user(reviewerId)]
          : await dao.reviewers();
        if (
          !reviewers.some(
            (user) =>
              user.role === "company_admin" &&
              companyIds.includes(reviewerCompany(user) ?? ""),
          )
        )
          continue;
        const candidate = await dao.candidate(submission.candidateId);
        const [user, project] = await Promise.all([
          dao.user(candidate.userId),
          dao.project(submission.projectId),
        ]);
        entries.push({
          id: submission.id,
          candidateName: user.name,
          projectTitle: project.title,
          submittedAt: submission.submittedAt,
        });
      }
      return entries;
    },

    async getReviewScreen(
      submissionId: string,
      reviewerId?: string,
    ): Promise<ReviewScreenData> {
      const submission = await dao.submission(submissionId);
      const { reviewer, companyId } = await reviewerFor(
        submission.projectId,
        reviewerId,
      );
      const candidate = await dao.candidate(submission.candidateId);
      const [user, project, company, rubric, rows, evaluation, shortlist] =
        await Promise.all([
          dao.user(candidate.userId),
          dao.project(submission.projectId),
          dao.company(companyId),
          dao.rubric(submission.projectId),
          dao.listEvidence(submissionId),
          dao.evaluation(submissionId, reviewer.id),
          dao.shortlist({ companyId, candidateId: candidate.id }),
        ]);
      const evidence = effectiveEvidence(rows);
      for (const skill of project.skills) {
        if (!evidence.some((entry) => entry.skill === skill))
          evidence.push({
            id: `unassessed:${skill}`,
            submissionId,
            candidateId: candidate.id,
            skill,
            level: "not_assessed",
            source: "ai",
            rationale: "",
            createdAt: submission.createdAt,
            updatedAt: submission.updatedAt,
          });
      }
      return {
        submission,
        candidate,
        candidateName: user.name,
        project,
        company,
        reviewer: { id: reviewer.id, name: reviewer.name },
        rubric,
        evidence,
        evaluation,
        followUpQuestions: submission.followUpQuestions,
        shortlist,
      };
    },

    async saveEvaluation(input: SaveEvaluationInput) {
      const submission = await dao.submission(input.submissionId);
      await reviewerFor(submission.projectId, input.reviewerId);
      const criteria = await dao.rubric(submission.projectId);
      const allowed = new Set(criteria.map((criterion) => criterion.name));
      for (const [name, result] of Object.entries(input.rubricResults)) {
        if (
          !allowed.has(name) ||
          !evidenceLevels.includes(result as EvidenceLevel)
        )
          throw new Error("Invalid Rubric result");
      }
      return dao.saveEvaluation(input);
    },

    async override(input: {
      submissionId: string;
      skill: string;
      level: EvidenceLevel;
      reviewerId: string;
      rationale: string;
    }) {
      if (!evidenceLevels.includes(input.level))
        throw new Error("Invalid Evidence level");
      const submission = await dao.submission(input.submissionId);
      await reviewerFor(submission.projectId, input.reviewerId);
      const rows = await dao.listEvidence(input.submissionId);
      let evidence = rows.find((row) => row.skill === input.skill);
      if (!evidence) {
        const project = await dao.project(submission.projectId);
        if (!project.skills.includes(input.skill))
          throw new Error("Skill is not part of this Project");
        evidence = {
          id: "",
          submissionId: submission.id,
          candidateId: submission.candidateId,
          skill: input.skill,
          level: "not_assessed",
          source: "ai",
          rationale: "",
          createdAt: submission.createdAt,
          updatedAt: submission.updatedAt,
        };
      }
      return dao.saveOverride(evidence, input.level, input.rationale);
    },

    async addToShortlist(input: ShortlistInput, reviewerId?: string) {
      if (!input.submissionId)
        throw new Error(
          "Submission is required to Shortlist a Candidate from review",
        );
      const submission = await dao.submission(input.submissionId);
      const { companyId } = await reviewerFor(submission.projectId, reviewerId);
      if (
        input.companyId !== companyId ||
        input.candidateId !== submission.candidateId
      )
        throw new Error("Candidate or Company does not match this review");
      if (input.jobId && (await dao.jobCompany(input.jobId)) !== companyId)
        throw new Error("Job belongs to another Company");
      return (await dao.shortlist(input)) ?? (await dao.insertShortlist(input));
    },
  };
}

export const reviewService = createReviewService(reviewDao);
