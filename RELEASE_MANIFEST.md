# HACKMITTEN 3.0 — Release Manifest

Production release cleanup. Generated as part of the Hackmitten 3.0
production-readiness pass.

---

## Included — what ships

### Application

- `src/app/` — Next.js App Router pages and ~30 API route handlers
  - Public: `/`, `/register`, `/login`, `/pass/[qrToken]`
  - Admin: `/admin/*` (15 sections, role-gated)
  - Coordinator: `/coordinator`
  - Food admin: `/food-admin`
  - API: `/api/auth/*`, `/api/registrations/*`, `/api/admin/*`,
    `/api/food/*`, `/api/pass/*`, `/api/config`, `/api/event-state`,
    `/api/meals`, `/api/sponsors`, `/api/gallery`, `/api/coordinators`,
    `/api/winners`, `/api/phases`
- `src/components/` — UI (shadcn/ui), sections, admin managers,
  coordinator portal, public nav, auth providers, three / space-scene
- `src/lib/` — auth, db, api-auth, permissions, validators, upload,
  constants, audit, change-history, event-state, email

### Database

- `prisma/schema.prisma` — PostgreSQL schema (14 models, 7 enums)
- `prisma/migrations/20260921000000_init/migration.sql` — base migration
  that creates every table from an empty schema
- `prisma/migrations/migration_lock.toml` — locks provider to `postgresql`
- `prisma/seed.ts` — **production bootstrap** (admin / config / meals,
  reads all credentials from env, fails loudly if required vars are missing)
- `prisma/seed-demo.ts` — **development demo data** (refuses to run when
  `NODE_ENV=production`)

### Configuration

- `next.config.ts` — `output: "standalone"`, `images.remotePatterns` for
  any HTTPS host (for Vercel Blob URLs), no `ignoreBuildErrors`, default
  `reactStrictMode: true`
- `.env.example` — names every env var the app and seed scripts expect
- `tsconfig.json`, `eslint.config.mjs`, `tailwind.config.ts`,
  `postcss.config.mjs`, `components.json`
- `package.json` — `bun run db:seed`, `bun run db:seed:demo`,
  `bun run db:migrate:deploy`, plus the existing `dev` / `build` / `start` /
  `lint` / `db:*` scripts

### Tests

- `tests/validators.test.ts` — Zod schemas (registration, payment, food
  check-in, BERSERK recovery)
- `tests/permissions.test.ts` — role × permission matrix
- `tests/event-state.test.ts` — event lifecycle
- `tests/food-checkin.test.ts` — DB duplicate-prevention (skipped when no
  PostgreSQL DATABASE_URL is available)

### Documentation

- `README.md` — concise setup + deployment guide
- `HUMAN_DEVELOPER_GUIDE.md` — engineering reference
- `RELEASE_MANIFEST.md` — this file

---

## Removed — what was cleaned up

| Removed path                       | Reason                                                            |
|------------------------------------|-------------------------------------------------------------------|
| `scripts/seed.ts`                  | Replaced by `prisma/seed.ts` + `prisma/seed-demo.ts` (env-driven) |
| `scripts/clear-data.ts`            | One-shot helper, not needed in production                          |
| `scripts/*.png`                    | AI screenshots, not source                                          |
| `scripts/*.sh`                     | One-shot build helpers, not part of the runtime                    |
| `scripts/` (whole directory)       | Now empty — removed                                                |
| `upload/`                          | Staging area for AI-pasted images (mount point, kept empty)         |
| `tool-results/`                    | Agent scratch dir, not part of the app                             |
| `skills/`                          | Bundled AI skills directory                                         |
| `examples/`                        | Demo code (websocket etc.), not part of the app                    |
| `mini-services/`                   | Sidecar services (chat / python runtime) — not part of the app     |
| `.zscripts/`                       | Local automation scripts                                            |
| `Caddyfile`                        | Internal reverse-proxy config — production uses Vercel's edge      |
| `DOCUMENTATION.md`                 | Replaced by `HUMAN_DEVELOPER_GUIDE.md` + `README.md`                |
| `download/`                        | Previous ZIP artifacts                                              |
| `z-ai-web-dev-sdk` (package.json)  | Was only used by removed skills/examples; not imported anywhere in `src/` |
| `db/custom.db`                     | Old SQLite file from the dev environment                            |

---

## Externalized — what moved off the repo

| Concern              | Before                                            | After                                                                  |
|----------------------|---------------------------------------------------|------------------------------------------------------------------------|
| Database             | SQLite file at `db/custom.db`                     | PostgreSQL via `DATABASE_URL` (Neon / Vercel Postgres / self-hosted)   |
| File uploads         | Local-only `/public/uploads/`                     | Vercel Blob (`@vercel/blob`) in production, local fallback in dev      |
| Admin credentials    | Hardcoded fallbacks in `scripts/seed.ts`          | Required env vars (`ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`) |
| BERSERK secret       | Persisted to `.env.local`                         | Required env var `HM3_BERSERK_SECRET` (or generated + printed once)   |
| Coordinator account  | Always created with `change-me` password         | Optional — created only if both `COORDINATOR_USERNAME` and `_PASSWORD` are set |
| Food admin account   | Always created with `change-me` password         | Optional — created only if both `FOOD_ADMIN_USERNAME` and `_PASSWORD` are set |
| NextAuth secret      | Hardcoded dev fallback `"dev-only-secret-..."`   | Required env var `NEXTAUTH_SECRET` — throws at startup if missing     |
| UPI ID               | Hardcoded `"hackmitten@upi"` fallback             | Pulled from event config only (admin-edited at `/admin/settings`)     |

---

## Required environment variables

Production deployment must set every required variable below. See
`.env.example` for a copy-paste template.

### Required

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `ADMIN_USERNAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `HM3_BERSERK_SECRET` (or capture the one printed by `bun run db:seed`)
- `BLOB_READ_WRITE_TOKEN`
- `BLOB_STORE_ID`

### Optional

- `COORDINATOR_USERNAME`, `COORDINATOR_PASSWORD`, `COORDINATOR_EMAIL`
- `FOOD_ADMIN_USERNAME`, `FOOD_ADMIN_PASSWORD`, `FOOD_ADMIN_EMAIL`
- `EMAIL_API_URL`, `EMAIL_API_KEY`, `EMAIL_FROM`

---

## Deployment prerequisites

1. **Vercel project** linked to this repo. Framework preset: **Next.js**.
   Build command: `next build`. Output: standalone (handled by
   `next.config.ts`).
2. **Neon PostgreSQL** (or any managed Postgres). Whitelist Vercel IPs (or
   use the pooled connection string). Copy the connection string into
   `DATABASE_URL`.
3. **Vercel Blob** store created. Copy the read/write token and store id
   into `BLOB_READ_WRITE_TOKEN` and `BLOB_STORE_ID`.
4. **Secrets** populated on Vercel (see the list above).
5. **Migration deploy** step. Either:
   - Run `bun run db:migrate:deploy` as part of the Vercel build script, or
   - Run it once from your machine before the first deploy.
6. **Seed** step. Run `bun run db:seed` once after the first successful
   deploy to create the super admin, event config singleton, and default
   meals. Do NOT run `bun run db:seed:demo` in production — it will refuse.

---

## Known operational notes

- **`bun run build`** no longer copies `.next/static` and `public/` into
  `.next/standalone/`. With Next.js 16 + `output: "standalone"`, the
  standalone output already includes everything needed. If you serve from
  `.next/standalone/`, verify static asset serving on your host (Vercel
  handles this automatically).
- **`bun run start`** runs the standalone server. Vercel deployments do not
  use this — Vercel builds and serves the app directly.
- **`bun test`** runs the validators / permissions / event-state tests
  unconditionally. The food-checkin DB test auto-skips when `DATABASE_URL`
  is missing or not a postgres URL, so the suite still passes in CI
  without a live database.
- **`public/uploads/`** is git-ignored. Files uploaded in dev mode stay on
  disk; they are not part of the release.
- **`.env` and `.env.local`** are git-ignored. The seed scripts do not
  write to them — they read from `process.env`.
- **BERSERK recovery secret** is the only fallback for lost super-admin
  passwords. Store it in your team's secret manager immediately after
  running `bun run db:seed` for the first time.
- **Migrations are committed**. Never edit a migration in place — add a
  new one with `bun run db:migrate --name <change>`.
- **Change history + rollback** is per-row, per-section. Find a destructive
  change at `/admin/change-history` and click Rollback to restore the
  previous state.
- **Audit log** is append-only and never cleaned automatically. Admins can
  bulk-delete via `/admin/audit` (super admin only).
