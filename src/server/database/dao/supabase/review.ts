import "server-only";

import { createAdminClient } from "@/server/lib/supabase/admin";
import type {
  Candidate,
  Company,
  Evidence,
  Evaluation,
  Project,
  RubricCriterion,
  Shortlist,
  Submission,
  User,
} from "@/shared/models/domain";
import type {
  SaveEvaluationInput,
  ShortlistInput,
} from "@/shared/models/review";

function domainRow<T>(row: Record<string, unknown>): T {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.replace(/_([a-z])/g, (_match, letter: string) =>
        letter.toUpperCase(),
      ),
      value instanceof Date ? value.toISOString() : value,
    ]),
  ) as T;
}

async function find<T>(table: string, id: string): Promise<T> {
  const { data, error } = await createAdminClient()
    .from(table)
    .select("*")
    .eq("id", id)
    .single();
  if (error?.code === "PGRST116") throw new Error(`${table} not found`);
  if (error || !data) throw new Error(error?.message ?? `${table} not found`);
  return domainRow<T>(data);
}

export const supabaseReviewDao = {
  submission: (id: string) => find<Submission>("submissions", id),
  candidate: (id: string) => find<Candidate>("candidates", id),
  project: (id: string) => find<Project>("projects", id),
  company: (id: string) => find<Company>("companies", id),
  user: (id: string) => find<User & { companyId?: string }>("users", id),
  evidence: (id: string) => find<Evidence>("evidence", id),

  async reviewers() {
    const { data, error } = await createAdminClient()
      .from("users")
      .select("*")
      .eq("role", "company_admin");
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) =>
      domainRow<User & { companyId?: string }>(row),
    );
  },

  async companyIds(projectId: string) {
    const { data, error } = await createAdminClient()
      .from("company_projects")
      .select("company_id")
      .eq("project_id", projectId)
      .in("relationship_type", ["owner", "sponsor"]);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => row.company_id as string);
  },

  async listSubmissions() {
    const { data, error } = await createAdminClient()
      .from("submissions")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => domainRow<Submission>(row));
  },

  async listEvidence(submissionId: string) {
    const { data, error } = await createAdminClient()
      .from("evidence")
      .select("*")
      .eq("submission_id", submissionId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => domainRow<Evidence>(row));
  },

  async rubric(projectId: string): Promise<RubricCriterion[]> {
    const { data, error } = await createAdminClient()
      .from("rubrics")
      .select("criteria")
      .eq("project_id", projectId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data?.criteria ?? [];
  },

  async evaluation(submissionId: string, reviewerId: string) {
    const { data, error } = await createAdminClient()
      .from("evaluations")
      .select("*")
      .eq("submission_id", submissionId)
      .eq("reviewer_id", reviewerId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? domainRow<Evaluation>(data) : null;
  },

  async saveEvaluation(input: SaveEvaluationInput) {
    const existing = await this.evaluation(
      input.submissionId,
      input.reviewerId,
    );
    const row = {
      submission_id: input.submissionId,
      reviewer_id: input.reviewerId,
      rubric_results: input.rubricResults,
      notes: input.notes,
      interview_recommended: input.interviewRecommended,
      updated_at: new Date().toISOString(),
    };
    const table = createAdminClient().from("evaluations");
    const query = existing
      ? table.update(row).eq("id", existing.id)
      : table.insert(row);
    const { data, error } = await query.select("*").single();
    if (error) throw new Error(error.message);
    return domainRow<Evaluation>(data);
  },

  async saveOverride(
    evidence: Evidence,
    level: Evidence["level"],
    rationale: string,
  ) {
    const existing = (await this.listEvidence(evidence.submissionId)).find(
      (row) => row.skill === evidence.skill && row.source === "company",
    );
    const row = {
      candidate_id: evidence.candidateId,
      submission_id: evidence.submissionId,
      skill: evidence.skill,
      level,
      source: "company",
      rationale,
      updated_at: new Date().toISOString(),
    };
    const table = createAdminClient().from("evidence");
    const query = existing
      ? table.update(row).eq("id", existing.id)
      : table.insert(row);
    const { data, error } = await query.select("*").single();
    if (error) throw new Error(error.message);
    return domainRow<Evidence>(data);
  },

  async shortlist(input: ShortlistInput) {
    let query = createAdminClient()
      .from("shortlists")
      .select("*")
      .eq("company_id", input.companyId)
      .eq("candidate_id", input.candidateId);
    query = input.jobId
      ? query.eq("job_id", input.jobId)
      : query.is("job_id", null);
    const { data, error } = await query
      .order("created_at")
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? domainRow<Shortlist>(data) : null;
  },

  async insertShortlist(input: ShortlistInput) {
    const { data, error } = await createAdminClient()
      .from("shortlists")
      .insert({
        company_id: input.companyId,
        candidate_id: input.candidateId,
        job_id: input.jobId ?? null,
        submission_id: input.submissionId ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return domainRow<Shortlist>(data);
  },

  async jobCompany(jobId: string) {
    const job = await find<{ companyId: string }>("jobs", jobId);
    return job.companyId;
  },
};
