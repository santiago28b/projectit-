import "server-only";

import { createAdminClient } from "@/server/lib/supabase/admin";
import { toProject, type Row } from "@/server/repositories/matchingMappers";
import type {
  CompanyProjectRelationship,
  Project,
  ProjectStatus,
  RubricCriterion,
  SubmissionStatus,
} from "@/shared/models/domain";
import type { CreateProjectInput } from "@/shared/models/projects";

export const supabaseProjectsDao = {
  async findById(id: string): Promise<Project | null> {
    const { data, error } = await createAdminClient()
      .from("projects")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toProject(data as Row) : null;
  },

  async listPublished(): Promise<Project[]> {
    const { data, error } = await createAdminClient()
      .from("projects")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => toProject(row as Row));
  },

  async listForCompany(
    companyId: string,
  ): Promise<
    { project: Project; relationshipType: CompanyProjectRelationship }[]
  > {
    const { data, error } = await createAdminClient()
      .from("company_projects")
      .select("relationship_type, projects(*)")
      .eq("company_id", companyId);
    if (error) throw new Error(error.message);
    return (data ?? [])
      .map((row) => {
        const project = row.projects as unknown as Row | null;
        if (!project) return null;
        return {
          project: toProject(project),
          relationshipType: row.relationship_type as CompanyProjectRelationship,
        };
      })
      .filter(
        (
          item,
        ): item is {
          project: Project;
          relationshipType: CompanyProjectRelationship;
        } => item !== null,
      )
      .sort((a, b) => b.project.updatedAt.localeCompare(a.project.updatedAt));
  },

  async listPlatformNotSponsoredBy(companyId: string): Promise<Project[]> {
    const client = createAdminClient();
    const { data: sponsored, error: sponsoredError } = await client
      .from("company_projects")
      .select("project_id")
      .eq("company_id", companyId)
      .eq("relationship_type", "sponsor");
    if (sponsoredError) throw new Error(sponsoredError.message);
    const sponsoredIds = new Set(
      (sponsored ?? []).map((row) => row.project_id as string),
    );

    const { data, error } = await client
      .from("projects")
      .select("*")
      .eq("type", "platform")
      .eq("status", "published")
      .order("title");
    if (error) throw new Error(error.message);
    return (data ?? [])
      .filter((row) => !sponsoredIds.has(row.id as string))
      .map((row) => toProject(row as Row));
  },

  async listSponsors(
    projectId: string,
  ): Promise<{ companyId: string; name: string }[]> {
    const { data, error } = await createAdminClient()
      .from("company_projects")
      .select("company_id, companies(name)")
      .eq("project_id", projectId)
      .eq("relationship_type", "sponsor");
    if (error) throw new Error(error.message);
    return (data ?? [])
      .map((row) => {
        const company = row.companies as unknown as { name: string } | null;
        return {
          companyId: row.company_id as string,
          name: company?.name ?? "Unknown",
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async relationship(
    companyId: string,
    projectId: string,
  ): Promise<CompanyProjectRelationship | null> {
    const { data, error } = await createAdminClient()
      .from("company_projects")
      .select("relationship_type")
      .eq("company_id", companyId)
      .eq("project_id", projectId);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    const owner = rows.find((r) => r.relationship_type === "owner");
    if (owner) return "owner";
    const sponsor = rows.find((r) => r.relationship_type === "sponsor");
    return sponsor ? "sponsor" : null;
  },

  async create(
    companyId: string,
    createdBy: string,
    input: CreateProjectInput,
  ): Promise<Project> {
    const status: ProjectStatus = input.publish ? "published" : "draft";
    const client = createAdminClient();
    const { data, error } = await client
      .from("projects")
      .insert({
        title: input.title,
        scenario: input.scenario,
        description: input.description ?? "",
        instructions: input.instructions,
        type: "company",
        visibility: input.visibility,
        visibility_target: input.visibilityTarget,
        expected_duration_minutes: input.expectedDurationMinutes,
        difficulty: input.difficulty,
        skills: input.skills,
        deliverables: input.deliverables,
        deadline: input.deadline,
        status,
        created_by: createdBy,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    const project = toProject(data as Row);

    const { error: linkError } = await client.from("company_projects").insert({
      company_id: companyId,
      project_id: project.id,
      relationship_type: "owner",
    });
    if (linkError) throw new Error(linkError.message);

    if (input.rubric.length > 0) {
      const { error: rubricError } = await client.from("rubrics").insert({
        project_id: project.id,
        criteria: input.rubric,
      });
      if (rubricError) throw new Error(rubricError.message);
    }

    return project;
  },

  async setStatus(projectId: string, status: ProjectStatus): Promise<Project> {
    const { data, error } = await createAdminClient()
      .from("projects")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", projectId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return toProject(data as Row);
  },

  async insertSponsor(companyId: string, projectId: string): Promise<void> {
    const { error } = await createAdminClient()
      .from("company_projects")
      .upsert(
        {
          company_id: companyId,
          project_id: projectId,
          relationship_type: "sponsor",
        },
        { onConflict: "company_id,project_id,relationship_type", ignoreDuplicates: true },
      );
    if (error) throw new Error(error.message);
  },

  async countInvitations(projectId: string): Promise<number> {
    const { count, error } = await createAdminClient()
      .from("invitations")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .neq("status", "expired");
    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  async listSubmissionsForProject(projectId: string): Promise<
    {
      id: string;
      candidateName: string;
      submittedAt: string;
      status: SubmissionStatus;
    }[]
  > {
    const { data, error } = await createAdminClient()
      .from("submissions")
      .select("id, submitted_at, status, candidates(users(name))")
      .eq("project_id", projectId)
      .order("submitted_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => {
      const candidate = row.candidates as unknown as {
        users: { name: string } | null;
      } | null;
      return {
        id: row.id as string,
        candidateName: candidate?.users?.name ?? "Unknown Candidate",
        submittedAt: String(row.submitted_at),
        status: row.status as SubmissionStatus,
      };
    });
  },

  async getRubric(projectId: string): Promise<RubricCriterion[]> {
    const { data, error } = await createAdminClient()
      .from("rubrics")
      .select("criteria")
      .eq("project_id", projectId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data?.criteria as RubricCriterion[] | undefined) ?? [];
  },
};
