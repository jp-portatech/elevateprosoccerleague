// Vercel function: POST /api/winter-survey ← the winter training survey (/winter-survey). Logic lives in server/winterSurvey.ts.
import { handleWinterSurvey } from '../server/winterSurvey.js'

export function POST(request: Request): Promise<Response> {
  return handleWinterSurvey(request, process.env)
}
