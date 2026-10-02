"use server";

import { matchingService } from "@/server/services/matching";
import { projectsService } from "@/server/services/projects";
import { reviewService } from "@/server/services/review";
import { submissionsService } from "@/server/services/submissions";

/** Thin server-action boundary used by client ViewModels. */

export async function listMarketplaceAction(candidateId: string) {
  return projectsService.listMarketplace(candidateId);
}

export async function recommendProjectsAction(candidateId: string) {
  return matchingService.recommendProjectsForCandidate(candidateId);
}

export async function submitProjectAction(input: {
  projectId: string;
  candidateId: string;
  writtenResponse: string;
  repositoryUrl?: string;
  fileUrls?: string[];
  videoUrl: string;
}) {
  return submissionsService.submit(input);
}

export async function getReviewScreenAction(submissionId: string) {
  return reviewService.getReviewScreen(submissionId);
}

export async function addToShortlistAction(input: {
  companyId: string;
  candidateId: string;
  jobId?: string;
  submissionId?: string;
}) {
  return reviewService.addToShortlist(input);
}
