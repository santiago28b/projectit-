/**
 * Data-access objects (DB layer). Implementations use createAdminClient()
 * (or the SSR client once Auth lands).
 *
 * Client-side HTTP access lives in src/client/repos — not here.
 */

import "server-only";

import { createAdminClient } from "@/server/lib/supabase/admin";
import type {
  Candidate,
  Company,
  SwitcherAccount,
  User,
  UserRole,
} from "@/server/models/domain";

// Row shapes as Supabase returns them (snake_case).
interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company_id: string | null;
  profile_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface CompanyRow {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

interface CandidateRow {
  id: string;
  user_id: string;
  university: string | null;
  location: string | null;
  region: string | null;
  skills: string[];
  created_at: string;
  updated_at: string;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    companyId: row.company_id,
    profileData: row.profile_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    logoUrl: row.logo_url,
    website: row.website,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCandidate(row: CandidateRow): Candidate {
  return {
    id: row.id,
    userId: row.user_id,
    university: row.university,
    location: row.location,
    region: row.region,
    skills: row.skills,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const usersDao = {
  async findById(id: string): Promise<User | null> {
    const { data, error } = await createAdminClient()
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle<UserRow>();
    if (error) throw new Error(error.message);
    return data ? toUser(data) : null;
  },

  /** Every seeded account for the role switcher, Candidates first. */
  async listForSwitcher(): Promise<SwitcherAccount[]> {
    const { data, error } = await createAdminClient()
      .from("users")
      .select("id, name, role, companies(name)")
      .neq("role", "platform_admin")
      .order("role")
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => {
      // A many-to-one embed comes back as an object; the untyped client says array.
      const company = row.companies as unknown as { name: string } | null;
      return {
        userId: row.id,
        name: row.name,
        role: row.role as UserRole,
        companyName: company?.name ?? null,
      };
    });
  },
};

export const companiesDao = {
  async findById(id: string): Promise<Company | null> {
    const { data, error } = await createAdminClient()
      .from("companies")
      .select("*")
      .eq("id", id)
      .maybeSingle<CompanyRow>();
    if (error) throw new Error(error.message);
    return data ? toCompany(data) : null;
  },
};

export const projectsDao = {
  async listPublished() {
    throw new Error("projectsDao.listPublished not implemented");
  },
  async findById(_id: string) {
    void _id;
    throw new Error("projectsDao.findById not implemented");
  },
};

export const submissionsDao = {
  async findByProjectAndCandidate(_projectId: string, _candidateId: string) {
    void _projectId;
    void _candidateId;
    throw new Error(
      "submissionsDao.findByProjectAndCandidate not implemented",
    );
  },
  async insert(_row: unknown) {
    void _row;
    throw new Error("submissionsDao.insert not implemented");
  },
};

export const evidenceDao = {
  async listByCandidate(_candidateId: string) {
    void _candidateId;
    throw new Error("evidenceDao.listByCandidate not implemented");
  },
};

export const candidatesDao = {
  async findById(id: string): Promise<Candidate | null> {
    const { data, error } = await createAdminClient()
      .from("candidates")
      .select("*")
      .eq("id", id)
      .maybeSingle<CandidateRow>();
    if (error) throw new Error(error.message);
    return data ? toCandidate(data) : null;
  },

  async findByUserId(userId: string): Promise<Candidate | null> {
    const { data, error } = await createAdminClient()
      .from("candidates")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle<CandidateRow>();
    if (error) throw new Error(error.message);
    return data ? toCandidate(data) : null;
  },
};

export const jobsDao = {
  async findById(_id: string) {
    void _id;
    throw new Error("jobsDao.findById not implemented");
  },
};
