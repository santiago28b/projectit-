import type { MatchingRepository } from "@/server/repositories/matching";
import type { CompanyProjectLink } from "@/server/services/rules";
import type {
  Candidate,
  Evidence,
  EvidenceLevel,
  Job,
  Project,
} from "@/shared/models/domain";

export interface FakeData {
  candidates?: { candidate: Candidate; name: string }[];
  jobs?: Job[];
  projects?: Project[];
  evidence?: Evidence[];
  /** submissionId → projectId */
  submissions?: Record<string, string>;
  /** candidateId → invited projectIds */
  invitations?: Record<string, string[]>;
  links?: CompanyProjectLink[];
  /** submissionId → candidateId (who completed it) */
  submissionOwners?: Record<string, string>;
  shortlists?: { companyId: string; candidateId: string; jobId: string | null }[];
}

/** In-memory MatchingRepository for service tests. Mutations are visible via `data`. */
export function fakeMatchingRepository(input: FakeData = {}) {
  const data = {
    candidates: input.candidates ?? [],
    jobs: input.jobs ?? [],
    projects: input.projects ?? [],
    evidence: [...(input.evidence ?? [])],
    submissions: input.submissions ?? {},
    invitations: input.invitations ?? {},
    links: input.links ?? [],
    submissionOwners: input.submissionOwners ?? {},
    shortlists: input.shortlists ?? [],
  };
  let nextId = 1;

  const repo: MatchingRepository = {
    async getCandidate(id) {
      return data.candidates.find((c) => c.candidate.id === id)?.candidate ?? null;
    },
    async listCandidatesWithNames() {
      return data.candidates;
    },
    async getJob(id) {
      return data.jobs.find((j) => j.id === id) ?? null;
    },
    async listJobsForCompany(companyId) {
      return data.jobs.filter((j) => j.companyId === companyId);
    },
    async listOpenProjects() {
      return data.projects.filter((p) => p.status !== "closed");
    },
    async listInvitedProjectIds(candidateId) {
      return data.invitations[candidateId] ?? [];
    },
    async listEvidenceForCandidates(ids) {
      return data.evidence.filter((e) => ids.includes(e.candidateId));
    },
    async listEvidenceForSubmission(submissionId) {
      return data.evidence.filter((e) => e.submissionId === submissionId);
    },
    async getEvidence(id) {
      return data.evidence.find((e) => e.id === id) ?? null;
    },
    async upsertCompanyEvidence(ai: Evidence, level: EvidenceLevel) {
      const existing = data.evidence.find(
        (e) => e.submissionId === ai.submissionId && e.skill === ai.skill && e.source === "company",
      );
      if (existing) {
        existing.level = level;
        return existing;
      }
      const row: Evidence = { ...ai, id: `company-${nextId++}`, level, source: "company", rationale: "Set by reviewer" };
      data.evidence.push(row);
      return row;
    },
    async projectsBySubmission(ids) {
      const out: Record<string, Pick<Project, "id" | "title">> = {};
      for (const id of ids) {
        const project = data.projects.find((p) => p.id === data.submissions[id]);
        if (project) out[id] = { id: project.id, title: project.title };
      }
      return out;
    },
    async listCompletedProjectsForCandidates(ids) {
      return Object.entries(data.submissionOwners).flatMap(([submissionId, candidateId]) => {
        const project = data.projects.find((p) => p.id === data.submissions[submissionId]);
        if (!project || !ids.includes(candidateId)) return [];
        return [{
          candidateId,
          projectType: project.type,
          expectedDurationMinutes: project.expectedDurationMinutes,
        }];
      });
    },
    async listShortlistedCandidateIds(companyId, jobId) {
      return data.shortlists
        .filter((s) => s.companyId === companyId && (s.jobId === jobId || s.jobId === null))
        .map((s) => s.candidateId);
    },
    async listCompanyProjectLinks(companyId) {
      return data.links.filter((l) => l.companyId === companyId);
    },
  };

  return { repo, data };
}
