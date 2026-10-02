/**
 * Data-access objects (DB layer).
 * Implementations: `pg/` (DATABASE_URL) or `supabase/` (service-role JS).
 * Selected by DATABASE_BACKEND (default: pg).
 *
 * Client-side HTTP access lives in src/client/repos — not here.
 */

import "server-only";

import { getDatabaseBackend } from "@/server/lib/databaseBackend";

import type { ProjectsDao } from "./pg/projects";
import {
  pgCandidatesDao,
  pgCompaniesDao,
  pgProjectsDao,
  pgUsersDao,
} from "./pg";
import {
  supabaseCandidatesDao,
  supabaseCompaniesDao,
  supabaseProjectsDao,
  supabaseUsersDao,
} from "./supabase";

const backend = getDatabaseBackend();

export const usersDao =
  backend === "supabase" ? supabaseUsersDao : pgUsersDao;

export const companiesDao =
  backend === "supabase" ? supabaseCompaniesDao : pgCompaniesDao;

export const candidatesDao =
  backend === "supabase" ? supabaseCandidatesDao : pgCandidatesDao;

export const projectsDao = (
  backend === "supabase" ? supabaseProjectsDao : pgProjectsDao
) as ProjectsDao;

// Submissions are Postgres-only (local DB or DATABASE_URL to Supabase).
export { pgSubmissionsDao as submissionsDao } from "./pg/submissions";
export { pgAssessmentDao as assessmentDao } from "./pg/assessment";

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
