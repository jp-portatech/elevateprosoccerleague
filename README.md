# ElevatePro Soccer League website

Live at **https://www.elevateprosoccer.com** (Vercel; `elevateprosoccer.com` redirects to `www`),
in English and Spanish (**https://www.elevateprosoccer.com/es**).

Single-page React + TypeScript + Vite site for ElevatePro Soccer League, built from the
image pack in `elevatepro-website-assets/`. Registration fees are paid through Stripe
Checkout, and a welcome email goes out after each payment, using small Vercel functions in `api/`.

## Run it

```bash
npm install
npm run dev       # local dev server (also serves api/ for testing Stripe locally)
npm run check     # type-check (site + server functions) + lint (oxlint with jsx-a11y rules)
npm run build     # production build to dist/, with every public page pre-rendered
npm run preview   # serve the production build locally (no api/ routes)
```

## Where things live

| What | File |
| --- | --- |
| League details: divisions and birth-date cutoffs, season date, games, playoff teams, venue and amenities, awards, prices, contact, social links, online-payments switch | `src/config/league.ts` |
| Stripe Checkout logic (validation, pricing, metadata) | `server/checkout.ts` |
| Vercel functions | `api/register.ts`, `api/registration-status.ts`, `api/stripe-webhook.ts` |
| Post-payment emails: webhook handling, sending (Resend), wording | `server/webhook.ts`, `server/email.ts`, `server/emails/registrationEmails.ts` |
| Contact form ("Not ready to register?"): section, fields and validation, server, emails | `src/sections/Contact.tsx`, `src/contact/leadForm.ts`, `server/lead.ts`, `server/emails/leadEmails.ts` |
| Look shared by every email (header, footer, boxes, season details) | `server/emails/layout.ts` |
| Admin dashboard at `/admin`: screens, team suggestions, server actions, database | `src/admin/`, `server/admin.ts`, `server/db.ts`, `server/emails/teamEmails.ts` |
| Ad landing pages `/join-as-a-player` and `/register-a-team`: offer terms and confirmation switches | `src/config/landing.ts` |
| Landing pages: sections, information-request dialog, submission adapter | `src/landing/`, `join-as-a-player.html`, `register-a-team.html` |
| Email sender, reply-to and league-copy addresses | `email` in `src/config/league.ts` |
| Browser side of registration (submit, redirect, draft restore) | `src/registration/submitRegistration.ts` |
| Registration form fields and validation (shared with the server) | `src/registration/forms.ts` |
| FAQ answers (built from the config) | `src/content/faq.tsx` |
| Image registry (paths, sizes, alt text) | `src/content/images.ts` |
| Page title, description, canonical URL and link-preview tags | `index.html` (English), `es.html` (Spanish) |
| Search engines: pre-rendering, structured data, nearby cities | `src/prerender.tsx`, `scripts/prerender.mjs`, `src/seo/structuredData.ts`, `venue.nearbyCities` in `league.ts` |
| Privacy policy page at `/privacy` and `/es/privacy` (wording and "Last updated" date) | `src/privacy/PrivacyPage.tsx`, `privacy.html`, `es/privacy.html` |
| Languages: URLs, the EN/ES switch, remembering the choice, titles shown after switching | `src/i18n/`, `src/components/LanguageToggle.tsx` |
| Link-preview image, robots.txt, sitemap.xml (served as-is from the site root) | `public/` |
| Design tokens (colors, fonts, spacing) | `src/styles/base.css` |

The privacy policy describes what the site actually collects and who handles it (Stripe, Resend,
Vercel, the Gmail inbox). If you add a form field, a service, analytics or cookies, update
`src/privacy/PrivacyPage.tsx` and its `LAST_UPDATED` date in the same change. `vercel.json` turns on
`cleanUrls`, which serves `privacy.html` at `/privacy`.

Axe House Sports appears as the official venue partner in the header, the Venue section and the
footer. Change the wording with `venue.partnerLabel` in `league.ts`, or set it to `null` to remove the
partnership everywhere. The logo was supplied by Axe House and is used with their permission. The web
versions are trimmed copies of `brand/axe_house_sports_logo.png` (see `venueLogo` in `src/content/images.ts`).

Anything set to `null` in `league.ts` is unconfirmed, so the site hides it or shows "coming soon".
Instagram and Facebook links in the footer and the search-engine data come from `social`; a profile
set to `null` shows as "coming soon".

## English and Spanish

Every page exists in both languages: `/` and `/privacy` in English, `/es` and `/es/privacy` in
Spanish. The **EN | ES** switch in the header (on every screen size) changes the language in place,
without reloading, and swaps the address so a refresh or a shared link keeps the language. The
browser remembers the choice, so a family who picked Spanish sees Spanish on their next visit.

- **Editing text:** each section keeps its English and Spanish side by side in a `COPY` object at
  the top of its file (for example `src/sections/Hero.tsx`). League details in `league.ts` that
  visitors read (amenities, awards, price units, the partner label) are written as `{ en, es }`.
  TypeScript refuses to build if a Spanish line is missing, so the two languages can't drift apart.
- **Registration in Spanish:** form labels, hints and error messages (`src/registration/forms.ts`,
  also used by the server), Stripe's checkout page (Latin American Spanish), the confirmation
  message and the **welcome email** are all in Spanish. Stripe returns Spanish-speaking families to `/es`.
- **The league copy stays in English**, with every answer as typed. Its subject ends in "· Spanish"
  and it notes the family registered in Spanish, so you know which language to reply in.
- **Titles and link previews:** `es.html` and `es/privacy.html` hold the Spanish page titles,
  descriptions and preview text that Google, WhatsApp and Facebook read. `src/i18n/pageMeta.ts`
  repeats the titles for in-page switching; keep the two in sync.

The Spanish translation uses friendly "tú" and Latin American terms ("fútbol indoor",
"cancha", "inscripción"). Have a native speaker from the league read it before promoting the
Spanish site.

## Search engines

- **Pre-rendered pages:** `npm run build` (which Vercel runs) builds the site, then renders every
  public page's full HTML ahead of time (`src/prerender.tsx` → `scripts/prerender.mjs`). Search
  engines, link previews and slow phones get the text and images without running JavaScript, and
  React then takes over the page in the browser (`src/mount.tsx`). The page draws fresh instead
  when the visit will look different: a visitor who chose the other language before, or a return
  from Stripe. `npm run dev` doesn't pre-render. Code that reads the browser (`window`,
  `localStorage`, today's date) has to run in effects or event handlers, not while a component
  first draws, or the build fails or the page flickers.
- **Structured data:** the homepages carry schema.org data built from `league.ts`
  (`src/seo/structuredData.ts`): the league as a sports organization, the site name, and the season
  as an event with its start date, venue and prices. Google can use it in event listings and richer
  results. Check it with Google's Rich Results Test after changing the season.
- **Wording:** titles and descriptions (`index.html`, `es.html`, `src/i18n/pageMeta.ts`) are kept
  under about 155 characters so Google doesn't cut them off. The venue FAQ names the nearby cities in
  `venue.nearbyCities`, so the site can come up for searches there too.
- **Ad landing pages** are marked `noindex`, so they stay out of search results and searches lead to
  the full homepage. Ads aren't affected. `public/sitemap.xml` lists the homepage and privacy
  policy in both languages.

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

## Contact form (leads)

The **"Not ready to register?"** section (after the FAQ, linked as **Contact** in the menu) collects
name, email, phone, what they're interested in, their player's age group, a message, and an optional
**"Yes, send me news and offers by email and text"** checkbox. When someone sends it:

1. The league inbox gets a **"New contact request"** email with everything they entered, whether they
   agreed to news and offers, and which language they used. Reply to write back, or tap **Call**.
2. They get a **thank-you email** in their language, with a Register button and the season details.
3. They're saved to your **Resend contact list**. People who ticked the box can receive
   Broadcasts; everyone else is saved as unsubscribed, so Broadcasts skip them. Follow up with them
   one-to-one only.

Only step 1 has to work: if it fails, the visitor is told. Steps 2 and 3 never block the form.
Spam protection: a hidden field that only bots fill in, plus a minimum time on the form.

**Setup (one time):**

1. **Give the Resend key Full access.** The key from "Registration emails" is Sending access, which
   can send email but can't add contacts. Resend → **API Keys → Create** with **Full access** →
   replace `RESEND_API_KEY` in Vercel (Production and Preview) → **Redeploy** → delete the old key in
   Resend. Until then, leads still reach the inbox; they just aren't added to the contact list.
2. **Optional segment:** in Resend, create a segment such as "Website leads", copy its ID and add it
   in Vercel as `RESEND_LEADS_SEGMENT_ID`, then redeploy. New leads are added to it, so you can send a
   Broadcast to just them.
3. Send a test message from the site with your own email address.

**Emailing your leads later:** Resend → **Broadcasts** → pick the segment. Resend adds the
unsubscribe link and skips unsubscribed contacts. US rules (CAN-SPAM) also require your mailing
address in marketing emails. Text messages need an SMS service, which isn't set up; the checkbox
records consent for when you add one.

Each contact form message sends 2 emails, which count toward Resend's daily limit along with
registration emails.

## Admin dashboard (`/admin`)

A private dashboard for the people running the league, at **https://www.elevateprosoccer.com/admin**.
It isn't linked from the site and is hidden from search engines.

- **Overview:** teams, individual players, placed vs. waiting per age group, money collected, new leads.
  **Import from Stripe** adds paid registrations that aren't in the dashboard yet (safe to repeat).
- **Players:** every individually registered player with parent contacts, experience, teammate request,
  team and payment. Search, filter, add private notes, mark withdrawn (refunds happen in Stripe),
  download a CSV.
- **Teams:** registered teams (signed up and paid as a team) and league teams (formed from individual
  players). Edit names and coach details, download rosters as CSV, and **Send team info**: each placed
  player's family gets a "Meet your team" email in their language with the coach's contact, and the
  coach gets the roster with parent contacts. Families never see other children's details.
- **Team builder:** per age group, the players waiting for a team. **Suggest teams** splits them into
  the number of teams you choose, balancing experience and age and keeping teammate requests together.
  Nothing is saved until you create the teams. Move any player with the Team menu, including onto a
  registered team that needs more players.
- **Leads:** contact-form requests with a status (new, contacted, registered, not interested) and notes.

New paid registrations and leads appear automatically. Test-mode (sandbox) payments are labeled TEST
and hidden by default once live payments start.

**Setup (one time):**

1. **Database:** Vercel → the project → **Storage → Create Database → Neon** (Free plan) → connect it to
   this project (Production and Preview). Vercel adds `DATABASE_URL`. The tables are created
   automatically on first use.
2. **Password:** Vercel → **Settings → Environment Variables** → `ADMIN_PASSWORD`, at least 12
   characters and not used anywhere else (Production and Preview). Share it only with league organizers.
   Changing it signs everyone out. After 8 wrong tries from one place, sign-in pauses for 15 minutes.
3. **Redeploy**, open `/admin`, sign in, and press **Import from Stripe** on the Overview.

Without these two settings, `/admin` shows what's missing and the rest of the site works as before.

## Advertising landing pages

Two focused pages for ads, each with one action and no site menu or footer links. They're hidden
from search results (`noindex`), so they only get visitors from your ads and links:

| Audience | English (English ads) | Spanish (Spanish ads) |
| --- | --- | --- |
| Parents of children without a team | **https://www.elevateprosoccer.com/join-as-a-player** | **https://www.elevateprosoccer.com/es/join-as-a-player** |
| Coaches and organizers bringing a team | **https://www.elevateprosoccer.com/register-a-team** | **https://www.elevateprosoccer.com/es/register-a-team** |

Each language version is the same page code (`src/landing/`) with its text in a `COPY` object of
English and Spanish; the HTML file (`es/join-as-a-player.html`, …) sets the language. The versions
don't link to each other, so each ad's audience stays on one page. Spanish requests get Spanish
error messages, success message and confirmation email; the league copy is marked "Spanish".

Every button on a page ("Secure Your Child's Spot" / "Hold a Spot for My Team"; in Spanish
"Asegura el lugar de tu hijo" / "Aparta un lugar para mi equipo") opens the
same short **information request** dialog. It collects contact details only, never a child's name,
birth date or payment, and it says clearly that it doesn't reserve a spot or complete registration.
Success appears only after the server confirms receipt.

**Where requests go:** `src/landing/submitInquiry.ts` (the one adapter) posts to `/api/contact`
(`server/lead.ts`), the same pipeline as the homepage contact form. The league inbox gets a
"New player inquiry" or "New team inquiry" email, the person gets a confirmation, and the request
appears in the admin dashboard's **Leads** tab with the page it came from and its campaign tags.
These forms don't ask for marketing consent, so people are saved to Resend as unsubscribed from
promotions. Needs `RESEND_API_KEY`; without it the dialog says requests aren't connected yet.

**Campaign tags:** add UTM tags to your ad links and they're recorded with each request, e.g.
`https://www.elevateprosoccer.com/register-a-team?utm_source=facebook&utm_medium=paid_social&utm_campaign=fall-teams`.
Only `utm_source`, `utm_medium`, `utm_campaign`, `utm_term` and `utm_content` are kept.

**Offer terms (`src/config/landing.ts`):** prices, dates, venue, divisions and games come from
`league.ts`. Terms the mockups proposed are switched **off** until the league confirms them, and the
pages show neutral "ask us" copy instead:

| Term | Setting | Now |
| --- | --- | --- |
| First Game Guarantee (player refund) | `player.guarantee.confirmed` | off |
| Team refund policy | `team.guarantee` (needs its own text) | none approved |
| 100% placement guarantee, balanced team with dedicated coach, jersey included | `player.proposed` | off |
| Certified referees, skill-matched divisions, online roster management | `team.proposed` | off |
| Two-team discount | `twoTeamDiscount` | "Ask about the discount", no amount |
| 5v5 format, live scores and standings | `format`, `liveStandings` | on (from the landing-page brief) |

## Before launch

- Replace the venue image (a generic indoor field, not Axe House Sports) with a real Axe House
  Sports photo in `src/content/images.ts`.
- Check the transparent logo's lettering against `brand/elevatepro-logo-original.png`. The
  background was removed automatically.
- Replace the illustrative photos with real league photography when available.
- Decide on refund and roster policies before taking payments. The site doesn't state any.
- Add `https://www.elevateprosoccer.com/privacy` as the privacy policy URL in Stripe
  (Settings → Business → Public details).
