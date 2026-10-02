/**
 * Data-access objects (DB layer).
 * Implementations: `pg/` (DATABASE_URL) or `supabase/` (service-role JS).
 * Selected by DATABASE_BACKEND (default: pg).
 *
 * Client-side HTTP access lives in src/client/repos — not here.
 */

import "server-only";

import { getDatabaseBackend } from "@/server/lib/databaseBackend";

import {
  pgCandidatesDao,
  pgCompaniesDao,
  pgUsersDao,
} from "./pg";
import {
  supabaseCandidatesDao,
  supabaseCompaniesDao,
  supabaseUsersDao,
} from "./supabase";

const backend = getDatabaseBackend();

export const usersDao =
  backend === "supabase" ? supabaseUsersDao : pgUsersDao;

export const companiesDao =
  backend === "supabase" ? supabaseCompaniesDao : pgCompaniesDao;

export const candidatesDao =
  backend === "supabase" ? supabaseCandidatesDao : pgCandidatesDao;

// Candidate-flow DAOs are Postgres-only: the team runs local Postgres, and
// DATABASE_URL can also point at a Supabase connection string.
export { pgProjectsDao as projectsDao } from "./pg/projects";
export { pgSubmissionsDao as submissionsDao } from "./pg/submissions";

export const evidenceDao = {
  async listByCandidate(_candidateId: string) {
    void _candidateId;
    throw new Error("evidenceDao.listByCandidate not implemented");
  },
};

export const jobsDao = {
  async findById(_id: string) {
    void _id;
    throw new Error("jobsDao.findById not implemented");
  },
};
