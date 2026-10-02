import "server-only";

import { createAdminClient } from "@/server/lib/supabase/admin";
import type {
  Candidate,
  Evidence,
  EvidenceLevel,
  Job,
  Project,
} from "@/shared/models/domain";
import type { CompanyProjectLink } from "@/server/services/rules";

/**
 * Data access for matching + Evidence (owned by Person C).
 * Reads through the admin client so RLS doesn't block the demo.
 * Every function returns domain types (camelCase), never raw rows.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

function db() {
  return createAdminClient();
}

function check<T>(result: { data: T | null; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data as T;
}

/* ---------- row → domain mappers ---------- */

export function toCandidate(r: Row): Candidate {
  return {
    id: r.id,
    userId: r.user_id,
    university: r.university ?? null,
    location: r.location ?? null,
    region: r.region ?? null,
    skills: r.skills ?? [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function toProject(r: Row): Project {
  return {
    id: r.id,
    title: r.title,
    scenario: r.scenario ?? "",
    description: r.description ?? "",
    instructions: r.instructions ?? "",
    type: r.type,
    visibility: r.visibility,
    visibilityTarget: r.visibility_target ?? null,
    expectedDurationMinutes: r.expected_duration_minutes ?? null,
    difficulty: r.difficulty ?? null,
    skills: r.skills ?? [],
    deliverables: r.deliverables ?? [],
    deadline: r.deadline ?? null,
    status: r.status,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function toJob(r: Row): Job {
  return {
    id: r.id,
    companyId: r.company_id,
    title: r.title,
    description: r.description ?? "",
    requiredSkills: r.required_skills ?? [],
    preferredSkills: r.preferred_skills ?? [],
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function toEvidence(r: Row): Evidence {
  return {
    id: r.id,
    candidateId: r.candidate_id,
    submissionId: r.submission_id,
    skill: r.skill,
    level: r.level,
    source: r.source,
    rationale: r.rationale ?? "",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/* ---------- queries ---------- */

export const matchingRepository = {
  async getCandidate(id: string): Promise<Candidate | null> {
    const res = await db().from("candidates").select("*").eq("id", id).maybeSingle();
    const row = check(res, "getCandidate");
    return row ? toCandidate(row) : null;
  },

  /** Every Candidate plus their display name (from `users`). */
  async listCandidatesWithNames(): Promise<{ candidate: Candidate; name: string }[]> {
    const rows = check(
      await db().from("candidates").select("*, users ( name )"),
      "listCandidatesWithNames",
    );
    return (rows as Row[]).map((r) => {
      const u = Array.isArray(r.users) ? r.users[0] : r.users;
      return { candidate: toCandidate(r), name: u?.name ?? "Unknown Candidate" };
    });
  },

  async getJob(id: string): Promise<Job | null> {
    const res = await db().from("jobs").select("*").eq("id", id).maybeSingle();
    const row = check(res, "getJob");
    return row ? toJob(row) : null;
  },

  /** Published + draft Projects (rules filter by status/eligibility). */
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
    const res = await db().from("evidence").select("*").eq("id", id).maybeSingle();
    const row = check(res, "getEvidence");
    return row ? toEvidence(row) : null;
  },

  /**
   * Company-reviewed level for a (Submission, skill). Replaces an earlier
   * company row if there is one; the AI row is kept for history.
   */
  async upsertCompanyEvidence(ai: Evidence, level: EvidenceLevel): Promise<Evidence> {
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

  /** submissionId → { id, title } of its Project, for Evidence reasons. */
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

  async listCompanyProjectLinks(companyId: string): Promise<CompanyProjectLink[]> {
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
