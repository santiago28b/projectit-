import "server-only";

import { db } from "@/server/lib/db";
import type {
  Candidate,
  Company,
  SwitcherAccount,
  User,
  UserRole,
} from "@/server/models/domain";

import {
  type CandidateRow,
  type CompanyRow,
  type UserRow,
  toCandidate,
  toCompany,
  toUser,
} from "../mappers";

export const pgUsersDao = {
  async findById(id: string): Promise<User | null> {
    const { rows } = await db.query<UserRow>(
      `select id, name, email, role, company_id, profile_data, created_at, updated_at
       from public.users
       where id = $1`,
      [id],
    );
    return rows[0] ? toUser(rows[0]) : null;
  },

  /** Every seeded account for the role switcher, Candidates first. */
  async listForSwitcher(): Promise<SwitcherAccount[]> {
    const { rows } = await db.query<{
      id: string;
      name: string;
      role: UserRole;
      company_name: string | null;
    }>(
      `select u.id, u.name, u.role, c.name as company_name
       from public.users u
       left join public.companies c on c.id = u.company_id
       where u.role <> 'platform_admin'
       order by u.role, u.name`,
    );
    return rows.map((row) => ({
      userId: row.id,
      name: row.name,
      role: row.role,
      companyName: row.company_name,
    }));
  },
};

export const pgCompaniesDao = {
  async findById(id: string): Promise<Company | null> {
    const { rows } = await db.query<CompanyRow>(
      `select id, name, description, logo_url, website, created_at, updated_at
       from public.companies
       where id = $1`,
      [id],
    );
    return rows[0] ? toCompany(rows[0]) : null;
  },
};

export { pgProjectsDao } from "./projects";
export { pgSubmissionsDao } from "./submissions";

export const pgCandidatesDao = {
  async findById(id: string): Promise<Candidate | null> {
    const { rows } = await db.query<CandidateRow>(
      `select id, user_id, university, location, region, skills, created_at, updated_at
       from public.candidates
       where id = $1`,
      [id],
    );
    return rows[0] ? toCandidate(rows[0]) : null;
  },

  async findByUserId(userId: string): Promise<Candidate | null> {
    const { rows } = await db.query<CandidateRow>(
      `select id, user_id, university, location, region, skills, created_at, updated_at
       from public.candidates
       where user_id = $1`,
      [userId],
    );
    return rows[0] ? toCandidate(rows[0]) : null;
  },
};
