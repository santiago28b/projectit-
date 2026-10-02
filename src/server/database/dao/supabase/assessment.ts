import "server-only";

import { createAdminClient } from "@/server/lib/supabase/admin";
import { toProject, type Row } from "@/server/repositories/matchingMappers";
import type { Project, Submission } from "@/shared/models/domain";

import { domainRow } from "../mappers";
import type {
  AssessedEvidence,
  AssessmentDao,
} from "../pg/assessment";

const STALE_MS = 10 * 60 * 1000;

export const supabaseAssessmentDao: AssessmentDao = {
  async load(
    submissionId: string,
  ): Promise<{ submission: Submission; project: Project } | null> {
    const client = createAdminClient();
    const { data, error } = await client
      .from("submissions")
      .select("*")
      .eq("id", submissionId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;

    const submission = domainRow<Submission>(data as Record<string, unknown>);
    const { data: projectRow, error: projectError } = await client
      .from("projects")
      .select("*")
      .eq("id", submission.projectId)
      .maybeSingle();
    if (projectError) throw new Error(projectError.message);
    if (!projectRow) return null;

    return { submission, project: toProject(projectRow as Row) };
  },

  async claim(submissionId: string): Promise<boolean> {
    const client = createAdminClient();
    const staleBefore = new Date(Date.now() - STALE_MS).toISOString();

    const { data: pending, error: pendingError } = await client
      .from("submissions")
      .update({
        assessment_status: "running",
        assessment_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .eq("assessment_status", "pending")
      .select("id");
    if (pendingError) throw new Error(pendingError.message);
    if ((pending ?? []).length > 0) return true;

    const { data: stale, error: staleError } = await client
      .from("submissions")
      .update({
        assessment_status: "running",
        assessment_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .eq("assessment_status", "running")
      .lt("updated_at", staleBefore)
      .select("id");
    if (staleError) throw new Error(staleError.message);
    return (stale ?? []).length > 0;
  },

  async saveTranscript(submissionId: string, transcript: string): Promise<void> {
    const { error } = await createAdminClient()
      .from("submissions")
      .update({
        transcript,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId);
    if (error) throw new Error(error.message);
  },

  async complete(
    submissionId: string,
    result: { evidence: AssessedEvidence[]; followUpQuestions: string[] },
  ): Promise<void> {
    const client = createAdminClient();
    const { data, error } = await client
      .from("submissions")
      .update({
        follow_up_questions: result.followUpQuestions,
        assessment_status: "done",
        assessed_at: new Date().toISOString(),
        assessment_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .select("candidate_id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    const candidateId = data?.candidate_id as string | undefined;
    if (!candidateId) throw new Error("Submission disappeared during its Assessment");

    const { error: deleteError } = await client
      .from("evidence")
      .delete()
      .eq("submission_id", submissionId)
      .eq("source", "ai");
    if (deleteError) throw new Error(deleteError.message);

    if (result.evidence.length === 0) return;
    const { error: insertError } = await client.from("evidence").insert(
      result.evidence.map((item) => ({
        candidate_id: candidateId,
        submission_id: submissionId,
        skill: item.skill,
        level: item.level,
        source: "ai",
        rationale: item.rationale,
      })),
    );
    if (insertError) throw new Error(insertError.message);
  },

  async fail(submissionId: string, message: string): Promise<void> {
    const { error } = await createAdminClient()
      .from("submissions")
      .update({
        assessment_status: "failed",
        assessment_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId);
    if (error) throw new Error(error.message);
  },

  async requeue(submissionId: string): Promise<boolean> {
    const client = createAdminClient();
    const staleBefore = new Date(Date.now() - STALE_MS).toISOString();

    const { data: failed, error: failedError } = await client
      .from("submissions")
      .update({
        assessment_status: "pending",
        assessment_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .eq("assessment_status", "failed")
      .select("id");
    if (failedError) throw new Error(failedError.message);
    if ((failed ?? []).length > 0) return true;

    const { data: stale, error: staleError } = await client
      .from("submissions")
      .update({
        assessment_status: "pending",
        assessment_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .eq("assessment_status", "running")
      .lt("updated_at", staleBefore)
      .select("id");
    if (staleError) throw new Error(staleError.message);
    return (stale ?? []).length > 0;
  },

  async companyCanReview(
    submissionId: string,
    companyId: string,
  ): Promise<boolean> {
    const client = createAdminClient();
    const { data: submission, error } = await client
      .from("submissions")
      .select("project_id")
      .eq("id", submissionId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!submission) return false;

    const { data: link, error: linkError } = await client
      .from("company_projects")
      .select("company_id")
      .eq("project_id", submission.project_id)
      .eq("company_id", companyId)
      .in("relationship_type", ["owner", "sponsor"])
      .limit(1)
      .maybeSingle();
    if (linkError) throw new Error(linkError.message);
    return Boolean(link);
  },
};
