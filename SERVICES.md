# Service activation

Production runs at `https://useoverset.com` (`www` redirects there). The domain is registered and served by Vercel, so its DNS records are managed in the Vercel dashboard. Supabase Auth's Site URL and redirect allowlist must include `https://useoverset.com/auth/callback`.

Cloud accounts, private page storage, RLS, server usage and job reservations require the three Supabase variables in `.env.example`. Apply migrations 0001–0004 in order. The production project already has these migrations, its Site URL, callback allowlist and Vercel production credentials configured. Local development uses `.env.local`; previews need their own deployment configuration and exact authorized callback URL.

## AI

Set `ANTHROPIC_API_KEY`. Default model: `claude-sonnet-5-5`; `OVERSET_AI_MODEL` can override it. OCR, contextual translation, literal text, alternatives, romanization and separate proofreading use a server-only provider adapter. Processing validates original images from private storage and reserves verified pages transactionally. Human edits are compared before AI saves; approval/edit snapshots can be restored in History. A failed page can retry from the editor. Long pages are tiled for OCR. Large chapters may require multiple page requests; this is not a detached worker queue.

Existing detected regions with filled source text are preserved; OCR fills empty regions or detects regions when none exist. Inspect detection and reading order before approval. AI requires quality evaluation on authorized chapters and a cost benchmark before launch. Token/model records are measured; monetary cost placeholders in `billing.ts` are estimates, not margins.

Artwork text is cleaned with a local clone brush: choose nearby source pixels, paint only the required text, then compare. This is manual restoration, not generative inpainting. Plain bubble cleanup and typesetting retain original dimensions. PNG is the lossless export option; JPEG/WebP encoding can change pixels across the image. Check results before export.

## Email

Set `RESEND_API_KEY`, a verified `OVERSET_EMAIL_FROM`, and `OVERSET_CONTACT_EMAIL`. Invitations, chapter completion and comments use an outbox with bounded retries. Contact submission fails clearly when email is unavailable. Set a random `CRON_SECRET` for the daily Vercel retry job; owners can also POST `/api/email/retry` with their verified session.

Configure [custom SMTP in Supabase](https://supabase.com/docs/guides/auth/auth-smtp) using the verified email provider. Supabase's default sender restricts recipient addresses and throughput. Resend also offers a [Supabase integration](https://supabase.com/partners/resend). Public signup is not launch-ready until SMTP and actual signup/reset email delivery have been tested. New user passwords must be entered by the account holder.

## Payments

A payment link alone cannot grant secure entitlements. Supply `STRIPE_SECRET_KEY`; run `node scripts/configure-stripe.mjs` in Stripe test mode first. This prepares products, monthly/yearly prices, credit packs, the billing portal and signed webhook. It makes no payments. `--live` explicitly configures a live account using the concept prices in `src/lib/billing.ts`.

The script writes private `.env.stripe-setup` with price IDs, portal ID and the webhook secret on first creation. It never prints secrets. Add these values to Vercel and redeploy. If rerun against an existing webhook, retain its current signing secret; Stripe does not return it again. Remove the output file before a rerun (do not commit it). Configure Stripe's account and tax/business requirements in its dashboard.

Test upgrades, invoices, cancellation, renewal, stale/duplicate webhook delivery and credit purchases with Stripe test cards before accepting money. Webhook fulfillment is the sole authority for entitlements. Page and seat limits are enforced on the server/database. Project/glossary limits, publisher API and analytics remain future work; do not advertise them as finished services.

## Verification

`npm run typecheck`, `npm run build:check`, `node --test tests/*.test.mjs`.

With Supabase server credentials loaded, `node scripts/smoke-cloud.mjs` creates disposable confirmed accounts, verifies live RLS/private storage and deployed authenticated APIs, then removes them. It sends no email and does not test real signup confirmation. Set `OVERSET_SITE_URL` if testing another deployment.

Final activation requires AI and email provider credentials, verified email sender/SMTP and Stripe account credentials. Store all private credentials server-side in Vercel, never in client code or commits.
