/**
 * Matching + Evidence data access (Person C).
 * Selected by DATABASE_BACKEND (default: pg).
 */

import "server-only";

import { getDatabaseBackend } from "@/server/lib/databaseBackend";

import { pgMatchingRepository } from "./pgMatching";
import { supabaseMatchingRepository } from "./supabaseMatching";

export {
  toCandidate,
  toEvidence,
  toJob,
  toProject,
} from "./matchingMappers";

export const matchingRepository =
  getDatabaseBackend() === "supabase"
    ? supabaseMatchingRepository
    : pgMatchingRepository;
