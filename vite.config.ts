import react from '@vitejs/plugin-react'
import type { IncomingMessage } from 'node:http'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/**
 * Serves the Vercel functions in api/ during `npm run dev`, so registration → Stripe
 * Checkout can be tested locally. Put a Stripe *test* key in .env.local:
 *   STRIPE_SECRET_KEY=sk_test_...
 * In production, Vercel runs api/*.ts itself and this plugin isn't involved.
 */
function vercelApiDev(): Plugin {
  const routes: Record<string, string> = {
    '/register': '/api/register.ts',
    '/registration-status': '/api/registration-status.ts',
    '/stripe-webhook': '/api/stripe-webhook.ts',
  }
  const readBody = async (req: IncomingMessage) => {
    const chunks: Buffer[] = []
    for await (const chunk of req) chunks.push(chunk as Buffer)
    return Buffer.concat(chunks)
  }

  return {
    name: 'vercel-api-dev',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res, next) => {
        const file = routes[(req.url ?? '').split('?')[0]]
        if (!file) return next()
        try {
          const handler = (await server.ssrLoadModule(file))[req.method ?? 'GET']
          if (typeof handler !== 'function') {
            res.statusCode = 405
            return res.end()
          }
          const headers = new Headers()
          for (const [key, value] of Object.entries(req.headers)) {
            if (typeof value === 'string') headers.set(key, value)
          }
          const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
          const request = new Request(new URL(req.originalUrl ?? req.url ?? '/', `http://${req.headers.host}`), {
            method: req.method,
            headers,
            body: hasBody ? await readBody(req) : undefined,
          })
          const response: Response = await handler(request)
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (error) {
          next(error)
        }
      })
    },
  }
}

// https://vite.dev/config/
// Images are imported straight from ./elevatepro-website-assets (see src/content/images.ts),
// so Vite fingerprints them and only the files the site uses end up in dist/.
export default defineConfig(({ mode }) => {
  // Server-only secrets for the dev API (never exposed to the browser bundle).
  Object.assign(process.env, loadEnv(mode, process.cwd(), ['STRIPE_', 'RESEND_']))
  return {
    plugins: [react(), vercelApiDev()],
  }
})
