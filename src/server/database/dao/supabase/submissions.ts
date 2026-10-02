import "server-only";

import { createAdminClient } from "@/server/lib/supabase/admin";
import { toProject, type Row } from "@/server/repositories/matchingMappers";
import type { Evidence, Project, Submission } from "@/shared/models/domain";
import type { MySubmissionSummary } from "@/shared/models/projects";

import { domainRow } from "../mappers";
import type { NewSubmission, SubmissionsDao } from "../pg/submissions";

function isUniqueViolation(error: { code?: string; message?: string }) {
  return (
    error.code === "23505" ||
    /duplicate key|unique constraint/i.test(error.message ?? "")
  );
}

export const supabaseSubmissionsDao: SubmissionsDao = {
  async findId(projectId: string, candidateId: string): Promise<string | null> {
    const { data, error } = await createAdminClient()
      .from("submissions")
      .select("id")
      .eq("project_id", projectId)
      .eq("candidate_id", candidateId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data?.id as string | undefined) ?? null;
  },

  async findProject(projectId: string): Promise<Project | null> {
    const { data, error } = await createAdminClient()
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toProject(data as Row) : null;
  },

  async create(input: NewSubmission): Promise<Submission> {
    const { data, error } = await createAdminClient()
      .from("submissions")
      .insert({
        project_id: input.projectId,
        candidate_id: input.candidateId,
        written_response: input.writtenResponse,
        repository_url: input.repositoryUrl,
        file_urls: input.fileUrls,
        video_url: input.videoUrl,
        assessment_status: "pending",
      })
      .select("*")
      .single();
    if (error) {
      if (isUniqueViolation(error)) {
        const err = new Error(error.message) as Error & { code: string };
        err.code = "23505";
        throw err;
      }
      throw new Error(error.message);
    }
    return domainRow<Submission>(data as Record<string, unknown>);
  },

  async listMine(candidateId: string): Promise<MySubmissionSummary[]> {
    const { data, error } = await createAdminClient()
      .from("submissions")
      .select("id, project_id, submitted_at, projects(title)")
      .eq("candidate_id", candidateId)
      .order("submitted_at", { ascending: false });
    if (error) throw new Error(error.message);

    return (data ?? []).map((row) => {
      const project = row.projects as unknown as { title?: string } | null;
      return {
        id: row.id as string,
        projectId: row.project_id as string,
        projectTitle: project?.title ?? "Project",
        submittedAt:
          typeof row.submitted_at === "string"
            ? row.submitted_at
            : new Date(row.submitted_at as string).toISOString(),
      };
    });
  },

  async findMine(submissionId: string, candidateId: string) {
    const client = createAdminClient();
    const { data, error } = await client
      .from("submissions")
      .select("*")
      .eq("id", submissionId)
      .eq("candidate_id", candidateId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;

    const submission = domainRow<Submission>(data as Record<string, unknown>);
    const [project, evidence] = await Promise.all([
      supabaseSubmissionsDao.findProject(submission.projectId),
      client
        .from("evidence")
        .select("*")
        .eq("submission_id", submissionId)
        .order("skill"),
    ]);
    if (evidence.error) throw new Error(evidence.error.message);
    if (!project) return null;

    return {
      submission,
      project,
      evidence: (evidence.data ?? []).map((row) =>
        domainRow<Evidence>(row as Record<string, unknown>),
      ),
    };
  },
};
