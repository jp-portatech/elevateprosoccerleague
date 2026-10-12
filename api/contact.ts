// Vercel function: POST /api/contact ← "Not ready to register?" form. Logic lives in server/lead.ts.
import { handleLead } from '../server/lead.js'

export function POST(request: Request): Promise<Response> {
  return handleLead(request, process.env)
}
