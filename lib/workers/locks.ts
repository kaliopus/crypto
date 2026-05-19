let inMemoryLock = false;

export async function withWorkerLock<T>(work: () => Promise<T>): Promise<T | null> {
  if (inMemoryLock) return null;
  inMemoryLock = true;
  try {
    return await work();
  } finally {
    inMemoryLock = false;
  }
}
