# HACKMITTEN 3.0

Hackathon platform for Hackmitten 3.0 — public landing page, multi-step team
registration, role-based admin dashboards, QR participant passes, and a
mobile food check-in scanner.

> Black is the universe. White is information. Red is energy.

## Tech stack

- **Framework**: Next.js 16 (App Router, Turbopack, standalone output)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York)
- **3D**: React Three Fiber, Three.js, Drei, @react-three/postprocessing, Lenis
- **Database**: PostgreSQL (Neon / Vercel Postgres / self-hosted) + Prisma 6
- **Auth**: NextAuth.js v4 — credentials provider, JWT sessions, bcrypt(12)
- **File storage**: @vercel/blob in production, local `/public/uploads/` in dev
- **QR**: qrcode.react (pass render), html5-qrcode (scanner)
- **State**: Zustand (registration form), TanStack Query (server data)
- **Validation**: Zod (client + server)
- **Tests**: bun test

## Quickstart

```bash
bun install                  # install dependencies
cp .env.example .env        # then edit .env (set DATABASE_URL, NEXTAUTH_SECRET, ADMIN_*)
bun run db:generate          # generate Prisma client
bun run db:migrate:deploy   # apply migrations
bun run db:seed              # bootstrap: super admin + event config + default meals
bun run db:seed:demo         # optional: load demo data (dev only — refuses in prod)
bun run dev                  # start dev server on port 3000
```

View the app from the **Preview Panel** on the right. Do not navigate to
`http://localhost:3000` directly.

## Environment variables

Copy `.env.example` to `.env` and fill in real values. See
`HUMAN_DEVELOPER_GUIDE.md` for the full table. Required for production:

- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — JWT signing secret (`openssl rand -base64 32`)
- `NEXTAUTH_URL` — public URL
- `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` — bootstrap super admin
- `HM3_BERSERK_SECRET` — required for credential rotation (or capture the one printed by `db:seed`)
- `BLOB_READ_WRITE_TOKEN`, `BLOB_STORE_ID` — Vercel Blob (required for file uploads in prod)

Optional: `COORDINATOR_*`, `FOOD_ADMIN_*`, `EMAIL_API_URL`, `EMAIL_API_KEY`,
`EMAIL_FROM` (a verified sender address; required in production).

> The seed scripts read from `process.env` only. They never write to
> `.env.local` or any file.

## Database

| Task                          | Command                                |
|-------------------------------|----------------------------------------|
| Generate Prisma client         | `bun run db:generate`                  |
| Create a new migration         | `bun run db:migrate --name <change>`   |
| Apply migrations (dev)         | `bun run db:migrate`                   |
| Apply migrations (prod / CI)    | `bun run db:migrate:deploy`            |
| Reset DB + re-apply migrations  | `bun run db:reset`                    |
| Bootstrap production data       | `bun run db:seed`                      |
| Load demo data (dev only)        | `bun run db:seed:demo`                |

Migration files live in `prisma/migrations/` and are committed. The base
migration `20260921000000_init` creates every table from an empty schema.

## Development

```bash
bun run dev      # Next.js dev server on port 3000
bun run lint     # ESLint (must pass)
bun run build    # production build (must pass)
bun test         # all tests
```

Tests:
- `tests/validators.test.ts` — Zod schemas (registration, payment, food, BERSERK)
- `tests/permissions.test.ts` — role × permission matrix
- `tests/event-state.test.ts` — event lifecycle (UPCOMING / OPEN / LIVE / ENDED)
- `tests/food-checkin.test.ts` — DB duplicate prevention (skipped when no PostgreSQL DATABASE_URL)

## Deployment

1. Provision PostgreSQL (Neon recommended). Set `DATABASE_URL` with
   `?sslmode=require`.
2. Set every required env var on Vercel (see list above).
3. Run `bun run db:migrate:deploy` once (either from your machine or as
   part of the build).
4. Run `bun run db:seed` once to create the super admin, event config
   singleton, and default meals. Capture the printed `HM3_BERSERK_SECRET`
   if you did not pre-set it.
5. Do NOT run `bun run db:seed:demo` in production — it refuses anyway
   when `NODE_ENV=production`.
6. Build and deploy. Vercel handles the standalone output automatically.

Post-deploy: log in at `/login`, configure event timing / fee / UPI at
`/admin/settings`, add real coordinators / sponsors / gallery / winners.

## Security

- All secrets come from environment variables — no hardcoded credentials.
- `NEXTAUTH_SECRET` is required (no dev fallback). The app throws at
  startup if it is missing.
- Admin passwords are bcrypt-hashed at cost 12. The BERSERK recovery secret
  is also bcrypt-hashed; only the original plaintext will work.
- File uploads validate MIME type, sniff the magic number, and enforce an
  8 MB limit before storing.
- Every admin mutation is gated by `requirePermission()` against the
  role × permission matrix (see `src/lib/permissions.ts`).
- The audit log is append-only. Change history supports per-row rollback
  at `/admin/change-history`.

## Project structure

```
prisma/
  schema.prisma              PostgreSQL schema (14 models)
  migrations/                Prisma migration history (committed)
  seed.ts                    Production bootstrap (admin + config + meals)
  seed-demo.ts               Development demo data (refuses in prod)
src/
  app/                       Next.js App Router (pages + ~30 API routes)
  components/
    three/space-scene.tsx   Black-hole 3D scene — do not modify
    sections/                Public landing sections
    register/                Multi-step registration form
    admin/                   Admin managers (one per resource)
    coordinator/             Coordinator portal
    public/                  Public nav
    auth/                    Session / query providers
    ui/                      shadcn/ui components
  lib/                       auth, db, api-auth, permissions, validators,
                            upload, constants, audit, change-history,
                            event-state, email
tests/                       bun test suite
HUMAN_DEVELOPER_GUIDE.md     Engineering reference (read this first)
RELEASE_MANIFEST.md          What ships / what was cleaned up
```

## Read more

- `HUMAN_DEVELOPER_GUIDE.md` — architecture, models, business rules,
  incident recovery, deployment checklist.
- `RELEASE_MANIFEST.md` — what's included, what was removed, what was
  externalized.
