import "server-only";

import { createAdminClient } from "@/server/lib/supabase/admin";
import type {
  Candidate,
  Evidence,
  EvidenceLevel,
  Job,
  Project,
} from "@/shared/models/domain";
import type {
  CompanyProjectLink,
  CompletedProject,
} from "@/server/services/rules";

import {
  type Row,
  toCandidate,
  toEvidence,
  toJob,
  toProject,
} from "./matchingMappers";

function db() {
  return createAdminClient();
}

function check<T>(
  result: { data: T | null; error: { message: string } | null },
  what: string,
): T {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data as T;
}

export const supabaseMatchingRepository = {
  async getCandidate(id: string): Promise<Candidate | null> {
    const res = await db()
      .from("candidates")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    const row = check(res, "getCandidate");
    return row ? toCandidate(row) : null;
  },

  async listCandidatesWithNames(): Promise<
    { candidate: Candidate; name: string }[]
  > {
    const rows = check(
      await db().from("candidates").select("*, users ( name )"),
      "listCandidatesWithNames",
    );
    return (rows as Row[]).map((r) => {
      const u = Array.isArray(r.users) ? r.users[0] : r.users;
      return {
        candidate: toCandidate(r),
        name: u?.name ?? "Unknown Candidate",
      };
    });
  },

  async getJob(id: string): Promise<Job | null> {
    const res = await db().from("jobs").select("*").eq("id", id).maybeSingle();
    const row = check(res, "getJob");
    return row ? toJob(row) : null;
  },

  async listJobsForCompany(companyId: string): Promise<Job[]> {
    const rows = check(
      await db()
        .from("jobs")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at"),
      "listJobsForCompany",
    );
    return (rows as Row[]).map(toJob);
  },

  async listOpenProjects(): Promise<Project[]> {
    const rows = check(
      await db().from("projects").select("*").neq("status", "closed"),
      "listOpenProjects",
    );
    return (rows as Row[]).map(toProject);
  },

  async listInvitedProjectIds(candidateId: string): Promise<string[]> {
    const rows = check(
      await db()
        .from("invitations")
        .select("project_id")
        .eq("candidate_id", candidateId)
        .neq("status", "expired"),
      "listInvitedProjectIds",
    );
    return (rows as Row[]).map((r) => r.project_id);
  },

  async listEvidenceForCandidates(candidateIds: string[]): Promise<Evidence[]> {
    if (candidateIds.length === 0) return [];
    const rows = check(
      await db().from("evidence").select("*").in("candidate_id", candidateIds),
      "listEvidenceForCandidates",
    );
    return (rows as Row[]).map(toEvidence);
  },

  async listEvidenceForSubmission(submissionId: string): Promise<Evidence[]> {
    const rows = check(
      await db().from("evidence").select("*").eq("submission_id", submissionId),
      "listEvidenceForSubmission",
    );
    return (rows as Row[]).map(toEvidence);
  },

  async getEvidence(id: string): Promise<Evidence | null> {
    const res = await db()
      .from("evidence")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    const row = check(res, "getEvidence");
    return row ? toEvidence(row) : null;
  },

  async upsertCompanyEvidence(
    ai: Evidence,
    level: EvidenceLevel,
  ): Promise<Evidence> {
    const client = db();
    const existing = check(
      await client
        .from("evidence")
        .select("*")
        .eq("submission_id", ai.submissionId)
        .eq("skill", ai.skill)
        .eq("source", "company")
        .maybeSingle(),
      "find company evidence",
    ) as Row | null;

    const res = existing
      ? await client
          .from("evidence")
          .update({ level, updated_at: new Date().toISOString() })
          .eq("id", existing.id)
          .select("*")
          .single()
      : await client
          .from("evidence")
          .insert({
            candidate_id: ai.candidateId,
            submission_id: ai.submissionId,
            skill: ai.skill,
            level,
            source: "company",
            rationale: "Set by reviewer",
          })
          .select("*")
          .single();
    return toEvidence(check(res, "upsertCompanyEvidence"));
  },

  async projectsBySubmission(
    submissionIds: string[],
  ): Promise<Record<string, Pick<Project, "id" | "title">>> {
    if (submissionIds.length === 0) return {};
    const rows = check(
      await db()
        .from("submissions")
        .select("id, projects ( id, title )")
        .in("id", submissionIds),
      "projectsBySubmission",
    );
    const out: Record<string, Pick<Project, "id" | "title">> = {};
    for (const r of rows as Row[]) {
      const p = Array.isArray(r.projects) ? r.projects[0] : r.projects;
      if (p) out[r.id] = { id: p.id, title: p.title };
    }
    return out;
  },

  async listCompletedProjectsForCandidates(
    candidateIds: string[],
  ): Promise<CompletedProject[]> {
    if (candidateIds.length === 0) return [];
    const rows = check(
      await db()
        .from("submissions")
        .select("candidate_id, projects ( type, expected_duration_minutes )")
        .in("candidate_id", candidateIds),
      "listCompletedProjectsForCandidates",
    );
    const out: CompletedProject[] = [];
    for (const r of rows as Row[]) {
      const p = Array.isArray(r.projects) ? r.projects[0] : r.projects;
      if (!p) continue;
      out.push({
        candidateId: r.candidate_id,
        projectType: p.type,
        expectedDurationMinutes: p.expected_duration_minutes ?? null,
      });
    }
    return out;
  },

  /** Shortlisted by this Company for this Job, or with no Job attached. */
  async listShortlistedCandidateIds(
    companyId: string,
    jobId: string,
  ): Promise<string[]> {
    const rows = check(
      await db()
        .from("shortlists")
        .select("candidate_id")
        .eq("company_id", companyId)
        .or(`job_id.eq.${jobId},job_id.is.null`),
      "listShortlistedCandidateIds",
    );
    return [...new Set((rows as Row[]).map((r) => r.candidate_id as string))];
  },

  async listCompanyProjectLinks(
    companyId: string,
  ): Promise<CompanyProjectLink[]> {
    const rows = check(
      await db()
        .from("company_projects")
        .select("company_id, project_id, relationship_type")
        .eq("company_id", companyId),
      "listCompanyProjectLinks",
    );
    return (rows as Row[]).map((r) => ({
      companyId: r.company_id,
      projectId: r.project_id,
      relationshipType: r.relationship_type,
    }));
  },
};
