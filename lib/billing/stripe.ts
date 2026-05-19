export const PLANS = {
  free: {
    key: 'free',
    name: 'Free',
    watchLimit: 3
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    watchLimit: 50
  }
} as const;

export async function createCheckoutSessionStub() {
  return {
    ok: true,
    checkoutUrl: null,
    message: 'Stripe checkout is scaffolded. Configure STRIPE_SECRET_KEY to enable real checkout.'
  };
}
