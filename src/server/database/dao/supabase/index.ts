import "server-only";

import { createAdminClient } from "@/server/lib/supabase/admin";
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

export const supabaseUsersDao = {
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

export const supabaseCompaniesDao = {
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

export const supabaseCandidatesDao = {
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
