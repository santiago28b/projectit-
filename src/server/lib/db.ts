import "server-only";

import {
  Pool,
  type PoolClient,
  type QueryResult,
  type QueryResultRow,
} from "pg";

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

  /** Run `fn` in one transaction: all writes commit together or none do. */
  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await getPool().connect();
    try {
      await client.query("begin");
      const result = await fn(client);
      await client.query("commit");
      return result;
    } catch (err) {
      await client.query("rollback");
      throw err;
    } finally {
      client.release();
    }
  },
};
