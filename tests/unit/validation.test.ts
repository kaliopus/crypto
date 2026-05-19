import { describe, expect, it } from 'vitest';
import { checkQuerySchema } from '@/lib/validation/schemas';

describe('validation', () => {
  it('rejects bad wallet addresses', () => {
    expect(checkQuerySchema.safeParse({ chain: 'base', wallet: 'bad', protocol: 'aave-v3', targetHealthFactor: '1.4' }).success).toBe(false);
  });

  it('rejects bad chains', () => {
    expect(
      checkQuerySchema.safeParse({
        chain: 'polygon',
        wallet: '0x0000000000000000000000000000000000000001',
        protocol: 'aave-v3',
        targetHealthFactor: '1.4'
      }).success
    ).toBe(false);
  });
});
