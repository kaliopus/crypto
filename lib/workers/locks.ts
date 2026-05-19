import { getSqlClient } from '@/lib/db';

type LockSqlClient = {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<Array<Record<string, unknown>>>;
};

const WORKER_LOCK_NAMESPACE = 728374;
const CHECK_WATCHES_LOCK_KEY = 1;

let inMemoryLock = false;
let sqlClientOverride: LockSqlClient | null = null;

async function withInMemoryLock<T>(work: () => Promise<T>): Promise<T | null> {
  if (inMemoryLock) return null;
  inMemoryLock = true;
  try {
    return await work();
  } finally {
    inMemoryLock = false;
  }
}

export async function withWorkerLock<T>(work: () => Promise<T>): Promise<T | null> {
  const sql = sqlClientOverride ?? getSqlClient();
  if (!sql) return withInMemoryLock(work);

  const [lock] = await sql`
    select pg_try_advisory_lock(${WORKER_LOCK_NAMESPACE}, ${CHECK_WATCHES_LOCK_KEY}) as acquired
  `;
  if (!lock?.acquired) return null;

  try {
    return await work();
  } finally {
    await sql`
      select pg_advisory_unlock(${WORKER_LOCK_NAMESPACE}, ${CHECK_WATCHES_LOCK_KEY})
    `;
  }
}

export function __setWorkerLockSqlClientForTests(client: LockSqlClient | null) {
  sqlClientOverride = client;
}

export function __resetWorkerLockForTests() {
  inMemoryLock = false;
  sqlClientOverride = null;
}
