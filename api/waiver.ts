// Vercel function: POST /api/waiver ← the facility waiver (/waiver). Logic lives in server/waiver.ts.
import { handleWaiver } from '../server/waiver.js'

export function POST(request: Request): Promise<Response> {
  return handleWaiver(request, process.env)
}
