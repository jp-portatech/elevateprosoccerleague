# ElevatePro Soccer League website

Live at **https://www.elevateprosoccer.com** (Vercel; `elevateprosoccer.com` redirects to `www`).

Single-page React + TypeScript + Vite site for ElevatePro Soccer League, built from the
image pack in `elevatepro-website-assets/`. Registration fees are paid through Stripe
Checkout, and a welcome email goes out after each payment, using small Vercel functions in `api/`.

## Run it

```bash
npm install
npm run dev       # local dev server (also serves api/ for testing Stripe locally)
npm run check     # type-check (site + server functions) + lint (oxlint with jsx-a11y rules)
npm run build     # production build to dist/
npm run preview   # serve the production build locally (no api/ routes)
```

## Where things live

| What | File |
| --- | --- |
| League details: divisions and birth-date cutoffs, season date, games, playoff teams, venue and amenities, awards, prices, contact, social links, online-payments switch | `src/config/league.ts` |
| Stripe Checkout logic (validation, pricing, metadata) | `server/checkout.ts` |
| Vercel functions | `api/register.ts`, `api/registration-status.ts`, `api/stripe-webhook.ts` |
| Post-payment emails: webhook handling, sending (Resend), wording and layout | `server/webhook.ts`, `server/email.ts`, `server/emails/registrationEmails.ts` |
| Email sender, reply-to and league-copy addresses | `email` in `src/config/league.ts` |
| Browser side of registration (submit, redirect, draft restore) | `src/registration/submitRegistration.ts` |
| Registration form fields and validation (shared with the server) | `src/registration/forms.ts` |
| FAQ answers (built from the config) | `src/content/faq.tsx` |
| Image registry (paths, sizes, alt text) | `src/content/images.ts` |
| Page title, description, canonical URL and link-preview tags | `index.html` |
| Link-preview image, robots.txt, sitemap.xml (served as-is from the site root) | `public/` |
| Design tokens (colors, fonts, spacing) | `src/styles/base.css` |

Anything set to `null` in `league.ts` is unconfirmed, so the site hides it or shows "coming soon".
Social links are placeholders: add each profile URL to `social` and it becomes a link.

## How registration and payment work

1. A family or coach fills in the team or player form. The form checks the fields, including
   that a player's date of birth fits the chosen division.
2. The form is sent to `/api/register`, which validates it again and creates a Stripe Checkout
   session priced from `league.ts` ($350 per team, $50 per player). The browser never sets the amount.
3. The visitor pays on Stripe's hosted checkout page.
4. Stripe notifies `/api/stripe-webhook`, which emails a branded **welcome email** to the family or
   coach and a **copy with every form answer** to the league inbox (see "Registration emails").
5. Stripe sends them back to the site, which confirms the payment with `/api/registration-status`
   and shows a "You're registered!" message. If they back out, the form reopens with their details
   still filled in.

**Where registrations show up:** Stripe Dashboard → Payments. Every form answer is attached to the
payment as metadata (team name, coach, player name, date of birth, guardian, phone, and so on),
and Payments → Export includes those columns. No separate database is needed. The league also
gets an email for each paid registration.

## Turning on payments

1. Create or log in to the league's Stripe account. In the Dashboard, under
   Settings → Customer emails, turn on **Successful payments** so families get receipts. Optionally,
   in your notification settings, turn on emails for **Successful payments** so the league is
   notified too.
2. **Test locally first** (optional): copy `.env.example` to `.env.local` and set
   `STRIPE_SECRET_KEY` to your **test** key (`sk_test_…`). In `src/config/league.ts`, set
   `registration.onlinePayments: true` and run `npm run dev`. Pay with Stripe's test card
   `4242 4242 4242 4242` (any future date, any CVC).
3. **Deploy to Vercel:** import the repository. Vercel detects Vite and builds `dist/` plus the
   `api/` functions automatically. Under Project → Settings → Environment Variables, add
   `STRIPE_SECRET_KEY`: the test key for Preview, the live key (`sk_live_…`) for Production.
4. Set `registration.onlinePayments: true` in `league.ts` and deploy.
5. Make one real low-risk check on production, such as a live payment you refund afterwards.

Keep secret keys out of the code and out of git. `.env.local` is already ignored.

## Registration emails

After a successful payment, Stripe calls `/api/stripe-webhook`. The site then sends, through
[Resend](https://resend.com):

- a **welcome email** to the parent/guardian or coach: payment confirmation, registration
  summary, what happens next, season details and directions. Replies go to the league's Gmail.
- a **league copy** to `email.notify` with every form answer and a link to the payment in Stripe.
  Replying to it emails the family.

The wording is in `server/emails/registrationEmails.ts`. Edit freely and push. The handler verifies
Stripe's signature, never sends the same email twice, and returns an error if sending fails, so
Stripe retries for up to 3 days. Emails that fail before Resend is set up still go out once it is.

**Setup (one time):**

1. **Resend:** create an account at resend.com → **Domains → Add domain** → `elevateprosoccer.com`.
   Add the DNS records Resend shows (DKIM and SPF; DMARC recommended) in GoDaddy → DNS, next to
   the website's records. Don't change or remove the existing A/CNAME records. Wait until Resend
   shows the domain as **Verified**.
2. **Resend API key:** Resend → **API Keys → Create** (sending access) → add it in Vercel →
   Settings → Environment Variables as `RESEND_API_KEY` (Production and Preview).
3. **Stripe webhook:** Stripe Dashboard → Developers → **Webhooks** (Workbench → Event
   destinations) → **Add endpoint**:
   - URL: `https://www.elevateprosoccer.com/api/stripe-webhook` (keep the `www`: the bare domain
     redirects, and Stripe doesn't follow redirects)
   - Events: `checkout.session.completed` and `checkout.session.async_payment_succeeded`

   Copy the endpoint's **signing secret** (`whsec_…`) into Vercel as `STRIPE_WEBHOOK_SECRET`.
4. **Redeploy** so the new variables take effect (Vercel → Deployments → ⋯ → Redeploy).
5. Make a test registration using your own email as the parent's email. You should get the welcome
   email, and the league inbox should get the copy.

Sandbox and live webhooks are separate. When you switch Stripe to the live account, add the same
endpoint in live mode and update `STRIPE_WEBHOOK_SECRET` with the live signing secret.
Resend's free plan allows 100 emails a day. Each registration sends 2.

## Before launch

- Add Instagram/Facebook profile URLs to `social` (currently shown as "coming soon").
- Replace the illustrative venue image with a real Axe House Sports photo, and remove its
  "not Axe House Sports" caption in `src/sections/Venue.tsx`.
- Check the transparent logo's lettering against `brand/elevatepro-logo-original.png`. The
  background-removed version was AI-derived.
- Replace the AI-generated illustrative photos with real league photography when available.
- Decide on refund and roster policies before taking payments. The site doesn't state any.
