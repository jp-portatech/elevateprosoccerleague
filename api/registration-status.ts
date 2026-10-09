// Vercel function: GET /api/registration-status?session_id=… → payment confirmation.
import { checkoutStatus } from '../server/checkout.js'

export function GET(request: Request): Promise<Response> {
  return checkoutStatus(request, process.env)
}
