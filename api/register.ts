// Vercel function: POST /api/register → Stripe Checkout URL. Logic lives in server/checkout.ts.
import { createCheckout } from '../server/checkout.js'

export function POST(request: Request): Promise<Response> {
  return createCheckout(request, process.env)
}
