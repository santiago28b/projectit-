import type {
  Candidate,
  Company,
  User,
  UserRole,
} from "@/server/models/domain";

/** Row shapes as Postgres / Supabase return them (snake_case). */
export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company_id: string | null;
  profile_data: Record<string, unknown>;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface CompanyRow {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  website: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface CandidateRow {
  id: string;
  user_id: string;
  university: string | null;
  location: string | null;
  region: string | null;
  skills: string[];
  created_at: string | Date;
  updated_at: string | Date;
}

/** pg returns Date; Supabase returns ISO strings — normalize to string. */
function toIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    companyId: row.company_id,
    profileData: row.profile_data,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function toCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    logoUrl: row.logo_url,
    website: row.website,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function toCandidate(row: CandidateRow): Candidate {
  return {
    id: row.id,
    userId: row.user_id,
    university: row.university,
    location: row.location,
    region: row.region,
    skills: row.skills,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}
