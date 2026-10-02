import type { Candidate, Job, Project } from "@/server/models/domain";

export interface MatchResult<T> {
  item: T;
  reasons: string[];
}

/**
 * Recommended Projects for a Candidate, Candidates who fit a Job,
 * and Projects that test a Job. Every result includes reasons — never a %.
 */
export interface MatchingService {
  recommendProjectsForCandidate(
    candidateId: string,
  ): Promise<MatchResult<Project>[]>;
  candidatesForJob(jobId: string): Promise<MatchResult<Candidate>[]>;
  projectsForJob(jobId: string): Promise<MatchResult<Project>[]>;
}

export const matchingService: MatchingService = {
  async recommendProjectsForCandidate() {
    throw new Error(
      "matchingService.recommendProjectsForCandidate not implemented",
    );
  },
  async candidatesForJob() {
    throw new Error("matchingService.candidatesForJob not implemented");
  },
  async projectsForJob() {
    throw new Error("matchingService.projectsForJob not implemented");
  },
};

export type { Job };
