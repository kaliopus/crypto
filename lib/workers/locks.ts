import { getSqlClient } from '@/lib/db';

type LockSqlClient = {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<Array<Record<string, unknown>>>;
  begin?<T>(work: (transaction: LockSqlClient) => Promise<T>): Promise<T>;
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
  const sql = (sqlClientOverride ?? getSqlClient()) as LockSqlClient | null;
  if (!sql) return withInMemoryLock(work);
  if (!sql.begin) throw new Error('Postgres transaction support is required for worker locking.');

  return sql.begin<T | null>(async (transaction) => {
    const [lock] = await transaction`
      select pg_try_advisory_xact_lock(${WORKER_LOCK_NAMESPACE}, ${CHECK_WATCHES_LOCK_KEY}) as acquired
    `;
    if (!lock?.acquired) return null;

    return await work();
  });
}

export function __setWorkerLockSqlClientForTests(client: LockSqlClient | null) {
  sqlClientOverride = client;
}

export function __resetWorkerLockForTests() {
  inMemoryLock = false;
  sqlClientOverride = null;
}
