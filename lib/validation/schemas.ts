import { z } from 'zod';

export const chainKeySchema = z.enum(['ethereum', 'base', 'arbitrum', 'optimism']);
export const protocolKeySchema = z.enum(['aave-v3']);
export const walletAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid EVM wallet address');
export const healthFactorSchema = z.coerce.number().min(1.01).max(10);

export const checkQuerySchema = z.object({
  chain: chainKeySchema,
  wallet: walletAddressSchema,
  protocol: protocolKeySchema.default('aave-v3'),
  targetHealthFactor: healthFactorSchema.default(1.4)
});

export const createWatchSchema = z.object({
  walletAddress: walletAddressSchema,
  chainKey: chainKeySchema,
  protocolKey: protocolKeySchema.default('aave-v3'),
  minHealthFactor: z.coerce.number().min(1).max(5).default(1.25),
  targetHealthFactor: healthFactorSchema.default(1.4),
  telegramChatId: z.string().trim().min(1).max(64).optional().or(z.literal(''))
});

export const updateWatchSchema = z.object({
  minHealthFactor: z.coerce.number().min(1).max(5).optional(),
  targetHealthFactor: healthFactorSchema.optional(),
  telegramChatId: z.string().trim().max(64).optional().or(z.literal('')),
  isActive: z.boolean().optional()
});
