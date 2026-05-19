import { afterEach, describe, expect, it, vi } from 'vitest';
import { __resetWorkerLockForTests, __setWorkerLockSqlClientForTests, withWorkerLock } from '@/lib/workers/locks';

describe('worker lock', () => {
  afterEach(() => {
    __resetWorkerLockForTests();
  });

  it('falls back to an in-memory lock when Postgres is unavailable', async () => {
    let release!: () => void;
    const first = withWorkerLock(async () => {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return 'first';
    });

    const second = await withWorkerLock(async () => 'second');

    expect(second).toBeNull();
    release();
    await expect(first).resolves.toBe('first');
  });

  it('uses a Postgres advisory lock when a SQL client is available', async () => {
    const sql = vi.fn(async (strings: TemplateStringsArray) => {
      const query = strings.join('');
      if (query.includes('pg_try_advisory_lock')) return [{ acquired: true }];
      if (query.includes('pg_advisory_unlock')) return [{ pg_advisory_unlock: true }];
      return [];
    });
    __setWorkerLockSqlClientForTests(sql);

    await expect(withWorkerLock(async () => 'checked')).resolves.toBe('checked');

    expect(sql).toHaveBeenCalledTimes(2);
  });

  it('skips work when the advisory lock is already held', async () => {
    const work = vi.fn(async () => 'checked');
    const sql = vi.fn(async () => [{ acquired: false }]);
    __setWorkerLockSqlClientForTests(sql);

    await expect(withWorkerLock(work)).resolves.toBeNull();

    expect(work).not.toHaveBeenCalled();
    expect(sql).toHaveBeenCalledTimes(1);
  });
});
