/**
 * Review DAO — selected by DATABASE_BACKEND (default: pg).
 */

import "server-only";

import { getDatabaseBackend } from "@/server/lib/databaseBackend";

import { pgReviewDao } from "./pg/review";
import { supabaseReviewDao } from "./supabase/review";

export const reviewDao =
  getDatabaseBackend() === "supabase" ? supabaseReviewDao : pgReviewDao;
