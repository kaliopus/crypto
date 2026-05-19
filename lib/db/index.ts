import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@/lib/config';
import * as schema from './schema';

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqlInstance: ReturnType<typeof postgres> | null = null;

export function getSqlClient() {
  if (!env.databaseUrl) {
    if (env.allowMemoryDb) return null;
    throw new Error('DATABASE_URL is required. Set ALLOW_MEMORY_DB=true only for local demo or tests.');
  }
  if (!sqlInstance) {
    sqlInstance = postgres(env.databaseUrl, { prepare: false, max: 5 });
  }
  return sqlInstance;
}

export function getDb() {
  if (!dbInstance) {
    const client = getSqlClient();
    if (!client) return null;
    dbInstance = drizzle(client, { schema });
  }
  return dbInstance;
}
