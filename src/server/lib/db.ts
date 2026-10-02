import "server-only";

import { Pool, type QueryResult, type QueryResultRow } from "pg";

import { env } from "@/server/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var __projectitPgPool: Pool | undefined;
}

function getPool(): Pool {
  if (!globalThis.__projectitPgPool) {
    globalThis.__projectitPgPool = new Pool({
      connectionString: env.databaseUrl,
    });
  }
  return globalThis.__projectitPgPool;
}

/** Shared Postgres pool (Homebrew locally, host Postgres on staging). */
export const db = {
  get pool() {
    return getPool();
  },

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    return getPool().query<T>(text, params);
  },
};
