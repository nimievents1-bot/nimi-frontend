# nimi-web

Public-facing web application for **Nimi Events** — catering, event planning, gifting and the Pastry Cravings subscription.

Built with **Next.js 14 (App Router)**, **TypeScript strict**, **Tailwind CSS**, and the Nimi design system. Self-contained — no monorepo, no shared workspace.

---

## Quickstart

```bash
# Prerequisites: Node 20+, pnpm 9+
nvm use                            # picks up .nvmrc → Node 20
cp .env.example .env.local         # fill in real values
pnpm install
pnpm dev                           # http://localhost:3000
```

---

## Scripts

| Command            | What it does                                      |
| ------------------ | ------------------------------------------------- |
| `pnpm dev`         | Run the Next.js dev server on `:3000`             |
| `pnpm build`       | Production build (typecheck + bundle)             |
| `pnpm start`       | Run the production build                          |
| `pnpm lint`        | ESLint, fail on warnings                          |
| `pnpm typecheck`   | `tsc --noEmit` across the whole project           |
| `pnpm test`        | Vitest unit tests                                 |
| `pnpm test:e2e`    | Playwright E2E tests                              |
| `pnpm format`      | Prettier write across `src/**/*.{ts,tsx,css,md}`  |

---

## Project structure

```
nimi-web/
├── src/
│   ├── app/                          App Router
│   │   ├── layout.tsx                root layout — fonts, metadata, viewport
│   │   ├── page.tsx                  homepage (hero on dark)
│   │   ├── globals.css               Tailwind layers + brand defaults
│   │   ├── error.tsx                 global error boundary
│   │   ├── not-found.tsx             404
│   │   ├── robots.ts / sitemap.ts    SEO surfaces
│   │   ├── api/health/route.ts       liveness probe
│   │   └── (marketing)/
│   │       ├── layout.tsx            header + footer wrap
│   │       ├── catering/page.tsx
│   │       ├── about/page.tsx
│   │       └── faq/page.tsx
│   ├── components/
│   │   ├── brand/NimiPotMark.tsx     logo + wordmark
│   │   ├── primitives/               Button · Stamp · Field · Tag · Alert
│   │   └── patterns/                 Header · Footer · Hero · Card · Faq · Testimonial
│   └── lib/
│       ├── design-system/tokens.ts   single source of truth for tokens
│       ├── cn.ts                     classname merge utility
│       └── env.ts                    Zod-validated env (server + client)
├── tailwind.config.ts                derives theme from tokens.ts
├── next.config.ts                    security headers (CSP, HSTS, etc.)
├── .eslintrc.cjs                     strict TS + a11y + tailwind plugins
└── tsconfig.json                     strict, baseUrl + @/ path alias
```

---

## Design system

The visual language lives in two files:

- `src/lib/design-system/tokens.ts` — colours (orange + maroon ramps, cream surfaces, semantic), typography (Cormorant Garamond + Mulish), radii, shadows, motion.
- `tailwind.config.ts` — adapts the tokens above into Tailwind's theme.

The full reference document is in the project workspace: `Nimi-Events-Design-System.html`. **Never** hard-code a hex value in a component — always reference the Tailwind class derived from `tokens.ts`.

### Adding a new component

1. Create the component in `src/components/primitives/` (low-level) or `src/components/patterns/` (composed).
2. Style only with Tailwind utilities; use `cn()` from `@/lib/cn` to merge classnames.
3. Square edges by default (`rounded-none`); only tags use `rounded-pill`.
4. Cream is the page surface — never `bg-white`.
5. Italic-serif (`font-display italic`) is reserved for primary CTAs and pull-quotes.

---

## Security defaults

The dev server inherits the production security headers from `next.config.ts`:

- **CSP** — restricts script, style, font, image, and frame sources. Stripe and Cloudflare Turnstile are pre-allowed; tighten further before launch.
- **HSTS** — `max-age=63072000; includeSubDomains; preload`
- **Referrer-Policy** — `strict-origin-when-cross-origin`
- **X-Frame-Options** — `DENY`
- **X-Content-Type-Options** — `nosniff`
- **Permissions-Policy** — denies camera, microphone, geolocation by default.

When integrating a new third party, **add the source to the CSP first**, then test with the browser console open — CSP violations log there.

---

## Environment variables

Validated at boot via Zod (see `src/lib/env.ts`). The build fails early if anything is missing or malformed.

- `NEXT_PUBLIC_*` values are inlined into the client bundle. **Never** put secrets there.
- Server-only values are read via `serverEnv()` and protected from being bundled into the client.

See `.env.example` for the full list.

---

## Conventions

- TypeScript strict; no `any`, no `@ts-ignore` without an inline justification.
- Server Components by default. Mark `"use client"` only at the leaf where interactivity is needed.
- Forms: React Hook Form + Zod resolver. Server-side re-validation in the route handler.
- Tests: Vitest for units, Playwright for E2E. Critical journeys (catering booking, gift checkout, subscription create) gated in CI.

---

## Companion API

The API for this app lives in **`nimi-api/`** (separate folder, separate Git repo). The web app talks to it via `NEXT_PUBLIC_API_URL` for browser calls and `INTERNAL_API_URL` for Server Components.

---

## Licence

Proprietary — © Nimi Events.
