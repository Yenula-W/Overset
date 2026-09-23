# Overset

AI localization workspace for manhwa, webtoons, manga, and comics.

**Same artwork. Same panels. Same bubbles. Different language.**

*Overset* is the typographic term for text that runs past the frame holding it
— the exact condition a translated speech bubble falls into, and the problem
this product spends most of its effort solving well.

Overset takes a chapter you own or are authorized to translate, finds every
text region, translates it with the surrounding story in mind, removes only the
original text, fits the translation back into the same bubbles, and exports at
the original dimensions — without the translator leaving the app.

## Three principles

1. **Preserve the artwork.** A translated page differs from the original in one
   respect only: the language of the text. Panels, bubbles, expressions, line
   art, and page dimensions are untouched. The pipeline never sends a whole page
   through generative regeneration to remove dialogue.
2. **Translate the story, not isolated sentences.** Every bubble is translated
   with the chapter, scene, conversation, speaker profile, glossary, and
   translation memory as structured context.
3. **AI assists; humans decide.** Recognized text, speaker, region boundaries,
   reading order, wording, and typesetting are all editable. Uncertainty is
   flagged rather than papered over.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Lucide.

```bash
npm install
npm run dev          # http://localhost:3000
npm run build
npm run typecheck
npm run build:check  # production build into .next-check, leaving the dev cache alone
```

## Layout

```
src/
  app/
    (marketing)/   Public site: home, how it works, pricing, teams, privacy, docs, help…
    (auth)/        Signup, login, password reset, onboarding
    (app)/         Workspace: dashboard, projects, translate, glossary, characters,
                   memory, team, usage, settings
    (editor)/      The translation editor, full viewport
    api/           Server routes — the only place provider keys are used
  components/
    ui/            Button, Card, Badge, Input, Tabs, Modal, Table, states, toast…
    marketing/     Nav, footer, sections, pricing table
    app/           Sidebar, upload zone, processing, editor panels
    demo/          Original fictional comic artwork and the page renderer
  lib/
    types/domain   The shared data model
    providers/     OCR, vision, translation, cleaning, typesetting interfaces
    pipeline.ts    Stage definitions, states, and retry semantics
    billing.ts     Plans, credit packs, and the per-page cost model
    server/        Server-only env, authorization, rate limiting, upload validation
```

## Architecture notes

**Providers are swappable.** Every external capability sits behind an interface
in `src/lib/providers`. Nothing in the UI knows which vendor is answering, so
providers can be benchmarked on cost and quality and replaced without a rewrite.

**Keys stay on the server.** `src/lib/server/env.ts` imports `server-only`, so
importing it from client code is a build error. Requests flow
`browser → Overset backend → providers → Overset backend → editor`. No
provider key reaches client JavaScript, HTML, network requests, or localStorage.

**Stages are separately addressable.** `src/lib/pipeline.ts` defines each stage
with its own state, dependencies, retry semantics, and cost center. A chapter
that fails at cleaning retries cleaning — it does not re-run and re-bill OCR.

**Pricing is configuration.** `src/lib/billing.ts` holds plans, allowances, and
credit packs alongside `COST_MODEL_CENTS_PER_PAGE` and a margin helper. The
listed prices are an opening concept and must be validated against measured
cost per page before production limits are locked in.

**Usage is server-side.** Page counts are billing data and are never taken from
the client.

## Demo content

All demo artwork, characters, dialogue, and project names are original fiction
created for Overset. The demo comic page is drawn from scratch as SVG in
`src/components/demo/artwork.tsx`. No commercial manhwa art or text appears
anywhere in the product or its marketing.

## Deployment

Deployed on Vercel from `main`; every push to `main` builds and promotes to
production. `vercel.json` pins the framework to `nextjs` — without it the
project can fall back to the "Other" preset, where the Next.js build succeeds
and Vercel then fails looking for a `public/` output directory that a Next app
never produces.

Set the provider keys from `.env.example` as Vercel environment variables. None
of them may be prefixed `NEXT_PUBLIC_`.

## Status

The marketing site, authentication and onboarding, workspace, and translation
editor are built against a shared domain model and a mock service layer. The
provider implementations, database, session store, and payment integration are
the remaining work, and the seams for all of them are in place.
