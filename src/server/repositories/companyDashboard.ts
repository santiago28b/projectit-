import "server-only";

import { getDatabaseBackend } from "@/server/lib/databaseBackend";
import { db } from "@/server/lib/db";
import { createAdminClient } from "@/server/lib/supabase/admin";
import { toJob, type Row } from "@/server/repositories/matchingMappers";
import type { Job } from "@/shared/models/domain";
import type { DashboardShortlistEntry } from "@/shared/models/companyDashboard";

export async function listJobsForCompany(companyId: string): Promise<Job[]> {
  if (getDatabaseBackend() === "supabase") {
    const { data, error } = await createAdminClient()
      .from("jobs")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => toJob(row as Row));
  }

  const { rows } = await db.query<Row>(
    `select * from public.jobs
     where company_id = $1
     order by created_at desc`,
    [companyId],
  );
  return rows.map(toJob);
}

export async function listShortlistForCompany(
  companyId: string,
): Promise<DashboardShortlistEntry[]> {
  if (getDatabaseBackend() === "supabase") {
    const { data, error } = await createAdminClient()
      .from("shortlists")
      .select("id, candidates(users(name)), jobs(title)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => {
      const candidate = row.candidates as unknown as {
        users: { name: string } | null;
      } | null;
      const job = row.jobs as unknown as { title: string } | null;
      return {
        id: row.id as string,
        candidateName: candidate?.users?.name ?? "Unknown Candidate",
        jobTitle: job?.title ?? null,
      };
    });
  }

  const { rows } = await db.query<{
    id: string;
    candidate_name: string;
    job_title: string | null;
  }>(
    `select s.id, u.name as candidate_name, j.title as job_title
     from public.shortlists s
     join public.candidates c on c.id = s.candidate_id
     join public.users u on u.id = c.user_id
     left join public.jobs j on j.id = s.job_id
     where s.company_id = $1
     order by s.created_at desc`,
    [companyId],
  );
  return rows.map((r) => ({
    id: r.id,
    candidateName: r.candidate_name,
    jobTitle: r.job_title,
  }));
}
