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

/** The contract both backends meet (services and test fakes depend on this). */
export type MatchingRepository = typeof pgMatchingRepository;

export const matchingRepository: MatchingRepository =
  getDatabaseBackend() === "supabase"
    ? supabaseMatchingRepository
    : pgMatchingRepository;
