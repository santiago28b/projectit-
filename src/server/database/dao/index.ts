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

export const jobsDao = {
  async findById(_id: string) {
    void _id;
    throw new Error("jobsDao.findById not implemented");
  },
};
