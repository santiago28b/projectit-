/**
 * Data-access objects (DB layer).
 * Implementations: `pg/` (DATABASE_URL) or `supabase/` (service-role JS).
 * Selected by DATABASE_BACKEND (default: pg).
 *
 * Client-side HTTP access lives in src/client/repos — not here.
 */

import "server-only";

import { getDatabaseBackend } from "@/server/lib/databaseBackend";

import type { AssessmentDao } from "./pg/assessment";
import type { ProjectsDao } from "./pg/projects";
import type { SubmissionsDao } from "./pg/submissions";
import {
  pgAssessmentDao,
  pgCandidatesDao,
  pgCompaniesDao,
  pgProjectsDao,
  pgSubmissionsDao,
  pgUsersDao,
} from "./pg";
import { supabaseAssessmentDao } from "./supabase/assessment";
import {
  supabaseCandidatesDao,
  supabaseCompaniesDao,
  supabaseProjectsDao,
  supabaseUsersDao,
} from "./supabase";
import { supabaseSubmissionsDao } from "./supabase/submissions";

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

export const submissionsDao = (
  backend === "supabase" ? supabaseSubmissionsDao : pgSubmissionsDao
) as SubmissionsDao;

export const assessmentDao = (
  backend === "supabase" ? supabaseAssessmentDao : pgAssessmentDao
) as AssessmentDao;

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
