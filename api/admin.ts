// Vercel function: POST /api/admin ← the admin dashboard (/admin). Logic lives in server/admin.ts.
import { handleAdmin } from '../server/admin.js'

export function POST(request: Request): Promise<Response> {
  return handleAdmin(request, process.env)
}
