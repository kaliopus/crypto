export const runtime = 'nodejs';

import { createCheckoutSessionStub } from '@/lib/billing/stripe';

export async function POST() {
  const result = await createCheckoutSessionStub();
  return Response.json(result);
}
