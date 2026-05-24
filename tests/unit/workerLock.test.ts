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
    const tx = vi.fn(async (strings: TemplateStringsArray) => {
      const query = strings.join('');
      if (query.includes('pg_try_advisory_xact_lock')) return [{ acquired: true }];
      return [];
    });
    const sql = Object.assign(vi.fn(), {
      begin: vi.fn(async (work) => work(tx))
    });
    __setWorkerLockSqlClientForTests(sql);

    await expect(withWorkerLock(async () => 'checked')).resolves.toBe('checked');

    expect(sql.begin).toHaveBeenCalledTimes(1);
    expect(tx).toHaveBeenCalledTimes(1);
  });

  it('skips work when the advisory lock is already held', async () => {
    const work = vi.fn(async () => 'checked');
    const tx = vi.fn(async () => [{ acquired: false }]);
    const sql = Object.assign(vi.fn(), {
      begin: vi.fn(async (callback) => callback(tx))
    });
    __setWorkerLockSqlClientForTests(sql);

    await expect(withWorkerLock(work)).resolves.toBeNull();

    expect(work).not.toHaveBeenCalled();
    expect(sql.begin).toHaveBeenCalledTimes(1);
    expect(tx).toHaveBeenCalledTimes(1);
  });
});
