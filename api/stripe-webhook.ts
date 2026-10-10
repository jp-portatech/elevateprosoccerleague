// Vercel function: POST /api/stripe-webhook ← Stripe. Logic lives in server/webhook.ts.
import { handleStripeWebhook } from '../server/webhook.js'

export function POST(request: Request): Promise<Response> {
  return handleStripeWebhook(request, process.env)
}
