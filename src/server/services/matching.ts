import "server-only";

import {
  matchingRepository,
  type MatchingRepository,
} from "@/server/repositories/matching";
import {
  buildEvidenceProfile,
  canViewSubmission,
  projectsForJob as rankProjectsForJob,
  rankCandidatesForJob,
  rankProjectsForCandidate,
  summarizeTrackRecords,
  type EvidenceProfileEntry,
  type MatchResult,
  type TrackRecord,
} from "@/server/services/rules";
import type { Candidate, Evidence, Job, Project } from "@/server/models/domain";

export type { MatchResult, TrackRecord } from "@/server/services/rules";

/** A Candidate who fits a Job, with what the Company is allowed to see. */
export interface JobCandidateMatch {
  candidate: Candidate;
  name: string;
  /** Evidence summary only (skill, level, source, Project). Never Submission details. */
  profile: EvidenceProfileEntry[];
  /** Projects submitted, their expected hours, and how many were Company Projects. */
  trackRecord: TrackRecord;
  /** On this Company's Shortlist for this Job (or its general Shortlist). */
  shortlisted: boolean;
}

/** Everything the Company's Job page needs, in one call. */
export interface JobOverview {
  job: Job;
  candidates: MatchResult<JobCandidateMatch>[];
  projects: MatchResult<Project>[];
  /**
   * Submissions this Company may open (it owns or Sponsors the Project).
   * Keyed by candidateId. Submissions to other Companies' Projects never appear.
   */
  reviewableSubmissions: Record<string, { submissionId: string; projectTitle: string }[]>;
}

/**
 * Recommended Projects for a Candidate, Candidates who fit a Job,
 * and Projects that test a Job. Every result includes reasons — never a %.
 * Fetches rows, then hands them to the pure rules in ./rules.
 */
export interface MatchingService {
  recommendProjectsForCandidate(candidateId: string): Promise<MatchResult<Project>[]>;
  candidatesForJob(jobId: string): Promise<MatchResult<JobCandidateMatch>[]>;
  projectsForJob(jobId: string): Promise<MatchResult<Project>[]>;
  jobOverview(jobId: string): Promise<JobOverview | null>;
  listJobsForCompany(companyId: string): Promise<Job[]>;
}

/** Evidence profiles for many Candidates with two queries total. */
async function profilesFor(
  repo: MatchingRepository,
  candidateIds: string[],
): Promise<Map<string, EvidenceProfileEntry[]>> {
  const evidence = await repo.listEvidenceForCandidates(candidateIds);
  const projectsBySubmission = await repo.projectsBySubmission([
    ...new Set(evidence.map((e) => e.submissionId)),
  ]);

  const byCandidate = new Map<string, Evidence[]>();
  for (const e of evidence) {
    const list = byCandidate.get(e.candidateId) ?? [];
    list.push(e);
    byCandidate.set(e.candidateId, list);
  }

  const out = new Map<string, EvidenceProfileEntry[]>();
  for (const id of candidateIds) {
    out.set(id, buildEvidenceProfile(byCandidate.get(id) ?? [], projectsBySubmission));
  }
  return out;
}

/** Build the service around a repository (tests pass a fake one). */
export function createMatchingService(repo: MatchingRepository): MatchingService {
  const service: MatchingService = {
  async recommendProjectsForCandidate(candidateId) {
    const candidate = await repo.getCandidate(candidateId);
    if (!candidate) return [];

    const [projects, invited, profiles] = await Promise.all([
      repo.listOpenProjects(),
      repo.listInvitedProjectIds(candidateId),
      profilesFor(repo, [candidateId]),
    ]);

    return rankProjectsForCandidate(
      candidate,
      profiles.get(candidateId) ?? [],
      projects,
      invited,
    );
  },

  async candidatesForJob(jobId) {
    const job = await repo.getJob(jobId);
    if (!job) return [];

    const people = await repo.listCandidatesWithNames();
    const ids = people.map((p) => p.candidate.id);
    const [profiles, completed, shortlistedIds] = await Promise.all([
      profilesFor(repo, ids),
      repo.listCompletedProjectsForCandidates(ids),
      repo.listShortlistedCandidateIds(job.companyId, job.id),
    ]);
    const trackRecords = summarizeTrackRecords(ids, completed);
    const shortlisted = new Set(shortlistedIds);
    const nameById = new Map(people.map((p) => [p.candidate.id, p.name]));

    const ranked = rankCandidatesForJob(
      job,
      people.map(({ candidate }) => ({
        candidate,
        profile: profiles.get(candidate.id) ?? [],
        projectsCompleted: trackRecords.get(candidate.id)?.projectsCompleted ?? 0,
      })),
    );

    return ranked.map(({ item, reasons }) => ({
      item: {
        candidate: item,
        name: nameById.get(item.id) ?? "Unknown Candidate",
        profile: profiles.get(item.id) ?? [],
        trackRecord: trackRecords.get(item.id)!,
        shortlisted: shortlisted.has(item.id),
      },
      reasons,
    }));
  },

  async projectsForJob(jobId) {
    const job = await repo.getJob(jobId);
    if (!job) return [];
    const projects = await repo.listOpenProjects();
    return rankProjectsForJob(job, projects);
  },

  async jobOverview(jobId) {
    const job = await repo.getJob(jobId);
    if (!job) return null;

    const [candidates, projects, links] = await Promise.all([
      service.candidatesForJob(jobId),
      service.projectsForJob(jobId),
      repo.listCompanyProjectLinks(job.companyId),
    ]);

    const reviewableSubmissions: JobOverview["reviewableSubmissions"] = {};
    for (const { item } of candidates) {
      const seen = new Set<string>();
      for (const entry of item.profile) {
        if (!entry.submissionId || seen.has(entry.submissionId)) continue;
        if (!canViewSubmission(job.companyId, entry.projectId, links)) continue;
        seen.add(entry.submissionId);
        (reviewableSubmissions[item.candidate.id] ??= []).push({
          submissionId: entry.submissionId,
          projectTitle: entry.projectTitle,
        });
      }
    }

    // Evidence summary only: drop Submission ids the Company can't open.
    const summarized = candidates.map((match) => ({
      ...match,
      item: {
        ...match.item,
        profile: match.item.profile.map(({ submissionId, ...entry }) =>
          canViewSubmission(job.companyId, entry.projectId, links)
            ? { ...entry, submissionId }
            : entry,
        ),
      },
    }));

    return { job, candidates: summarized, projects, reviewableSubmissions };
  },

  async listJobsForCompany(companyId) {
    return repo.listJobsForCompany(companyId);
  },
};
  return service;
}

export const matchingService = createMatchingService(matchingRepository);
