# ElevatePro Soccer League website

Single-page React + TypeScript + Vite site for ElevatePro Soccer League, built from the
image pack in `elevatepro-website-assets/`. Registration fees are paid through Stripe
Checkout, using two small Vercel functions in `api/`.

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
| Vercel functions | `api/register.ts`, `api/registration-status.ts` |
| Browser side of registration (submit, redirect, draft restore) | `src/registration/submitRegistration.ts` |
| Registration form fields and validation (shared with the server) | `src/registration/forms.ts` |
| FAQ answers (built from the config) | `src/content/faq.tsx` |
| Image registry (paths, sizes, alt text) | `src/content/images.ts` |
| Page title, description and social meta tags | `index.html` |
| Design tokens (colors, fonts, spacing) | `src/styles/base.css` |

Anything set to `null` in `league.ts` is unconfirmed, so the site hides it or shows "coming soon".
Social links are placeholders: add each profile URL to `social` and it becomes a link.

## How registration and payment work

1. A family or coach fills in the team or player form. The form checks the fields, including
   that a player's date of birth fits the chosen division.
2. The form is sent to `/api/register`, which validates it again and creates a Stripe Checkout
   session priced from `league.ts` ($350 per team, $50 per player). The browser never sets the amount.
3. The visitor pays on Stripe's hosted checkout page. Stripe emails them a receipt.
4. Stripe sends them back to the site, which confirms the payment with `/api/registration-status`
   and shows a "You're registered!" message. If they back out, the form reopens with their details
   still filled in.

**Where registrations show up:** Stripe Dashboard → Payments. Every form answer is attached to the
payment as metadata (team name, coach, player name, date of birth, guardian, phone, and so on),
and Payments → Export includes those columns. No separate database is needed to start. To also get
an email or spreadsheet row per registration, add a Stripe webhook later.

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

## Before launch

- Add Instagram/Facebook profile URLs to `social` (currently shown as "coming soon").
- Replace the illustrative venue image with a real Axe House Sports photo, and remove its
  "not Axe House Sports" caption in `src/sections/Venue.tsx`.
- Check the transparent logo's lettering against `brand/elevatepro-logo-original.png`. The
  background-removed version was AI-derived.
- Replace the AI-generated illustrative photos with real league photography when available.
- Add `og:image` and a canonical URL in `index.html` once the production domain is known.
- Decide on refund and roster policies before taking payments. The site doesn't state any.
