import Stripe from 'stripe'

/** Stripe client using fetch, which runs on Vercel's Node runtime and is easy to stub in tests. */
export function stripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, { httpClient: Stripe.createFetchHttpClient() })
}
