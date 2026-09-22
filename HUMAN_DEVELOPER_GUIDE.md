# HACKMITTEN 3.0 — Human Developer Guide

A practical engineering reference for the Hackmitten 3.0 hackathon platform.
Read this once before touching code or deploying.

---

## 1. What Hackmitten is

Hackmitten is a 24-hour national-level hackathon run by Maharaja Institute of
Technology Thandavapura. The platform powers:

- A cinematic public landing page (3D black-hole scene, real-time countdown,
  configurable hero / about / timeline / gallery / coordinators / sponsors /
  winners / CTA sections).
- A multi-step team registration flow with team leader, college, members,
  UPI payment screenshot upload.
- A super-admin dashboard for verifying payments, approving teams, managing
  event config, meals, sponsors, coordinators, winners, gallery, audit log,
  users, and change history (with rollback).
- A coordinator dashboard (read-only operational view).
- A mobile-first food-admin scanner that reads participant QR codes and
  records meal check-ins with duplicate prevention at the database layer.
- A public digital pass page at `/pass/[qrToken]` with PNG download for
  printing.

---

## 2. Architecture

```
                Public (SSR + client)
                         │
                    Next.js 16 (App Router)
                         │
              ┌──────────┴──────────┐
              │                     │
     React Three Fiber         TanStack Query
     Three.js / Drei           Zustand (registration form)
     Lenis (smooth scroll)
              │                     │
              └──────────┬──────────┘
                         │
                  Next.js Route Handlers (api/)
                         │
              NextAuth (JWT sessions, bcrypt, BERSERK 2FA)
                         │
                    Prisma ORM
                         │
                  PostgreSQL (Neon)
                         │
        Files: Vercel Blob (prod) → /public/uploads/ (dev fallback)
```

| Layer              | Technology                                                   |
|--------------------|--------------------------------------------------------------|
| Framework          | Next.js 16 (App Router, Turbopack)                           |
| Language           | TypeScript 5                                                 |
| Styling            | Tailwind CSS 4 + shadcn/ui (New York)                        |
| 3D / animation     | React Three Fiber, Three.js, Drei, @react-three/postprocessing |
| Smooth scroll      | Lenis                                                        |
| Database           | PostgreSQL (Neon / Vercel Postgres / self-hosted) + Prisma 6 |
| Auth               | NextAuth.js v4 — credentials provider, JWT, bcrypt(12)        |
| File storage       | @vercel/blob in production, local filesystem in development   |
| QR pass           | qrcode.react (render), html5-qrcode (scanner)                |
| State (client)     | Zustand (form), TanStack Query (server data)                  |
| Validation         | Zod (client + server)                                         |
| Tests              | `bun test` (Bun's built-in test runner)                      |

---

## 3. Directory structure

```
prisma/
  schema.prisma              PostgreSQL schema (14 models)
  migrations/                Prisma migration history (committed)
  seed.ts                    Production bootstrap (admin + config + meals)
  seed-demo.ts               Development-only demo data (refuses to run in prod)
src/
  app/
    page.tsx                 Public landing page (client component)
    layout.tsx               Root layout (SessionProvider + QueryProvider)
    register/                5-step team registration
    login/                   Role-aware login
    pass/[qrToken]/         Public digital pass + PNG download
    admin/                  Super admin / coordinator dashboard pages
    coordinator/            Coordinator dashboard
    food-admin/             Mobile QR scanner
    api/                    ~30 route handlers (auth, public, admin, food)
  components/
    three/space-scene.tsx   Black-hole 3D scene — DO NOT MODIFY
    sections/                Public landing sections
    register/               Multi-step store + steps
    admin/                  Admin managers (one per resource)
    coordinator/            Coordinator portal
    public/                 Public nav
    auth/                   Session/query providers
    ui/                     shadcn/ui components
  lib/
    auth.ts                 NextAuth config — requires NEXTAUTH_SECRET
    db.ts                   Prisma client singleton
    api-auth.ts             requireSession / requirePermission helpers
    permissions.ts          Role × permission matrix
    validators.ts           Zod schemas
    upload.ts               Vercel Blob / local upload with MIME sniff
    constants.ts            Strong password / BERSERK / QR token generators
    audit.ts                Audit log writer
    change-history.ts       Change history + rollback helpers
    event-state.ts          Event lifecycle (UPCOMING / REGISTRATION_OPEN / LIVE / ENDED)
    email.ts                Optional email (console fallback in dev)
tests/                      Bun test suite (validators, permissions, event-state, food-checkin)
```

---

## 4. Authentication & roles

| Role          | Login route     | Capabilities                                              |
|---------------|-----------------|----------------------------------------------------------|
| SUPER_ADMIN   | `/login`        | Full access — payments, teams, config, sponsors, winners, gallery, phases, meals, users, audit, credentials |
| COORDINATOR   | `/login`        | Dashboard, registration list (read-only), audit log     |
| FOOD_ADMIN    | `/login`        | `/food-admin` mobile scanner, food history               |
| PARTICIPANT   | n/a             | No admin access — only their team / pass                 |

Sessions are JWT-based, 7-day max age. `NEXTAUTH_SECRET` is required (no
fallback). The login form accepts username or email (case-insensitive email,
case-sensitive username).

### BERSERK recovery

The super admin can rotate their own username + password only by supplying
the `HM3_BERSERK_SECRET` as a second factor. The secret is hashed (bcrypt 12)
and stored in `User.recoveryHash`. It is generated at bootstrap seed time. If
you lose it, recovery requires direct DB access to reset the hash.

---

## 5. Database models & relationships

```
User 1───* AuditLog
User 1───* FoodCheckIn
User 1───* Payment           (verifiedBy)
User 1───* ChangeHistory      (changedBy + rolledBackBy)
User 1───1 CoordinatorProfile (optional link)

Team 1───* Participant
Team 1───1 Payment           (unique)
Team 1───* AuditLog
Payment 1───* PaymentScreenshot
Participant 1───* FoodCheckIn
Meal 1───* FoodCheckIn
              └ unique(participantId, mealId)   ← duplicate prevention

EventConfig     singleton row (id = "singleton")
HackathonPhase  configurable timeline (8 default rows)
CoordinatorProfile / GalleryItem / Sponsor / Winner — content tables
ChangeHistory   full previousState / newState JSON for rollback
```

Enums: `Role`, `RegistrationStatus`, `PaymentStatus`, `MealType`,
`CoordinatorType`, `SponsorTier`, `ChangeHistorySection`.

---

## 6. Business rules

- **Team size**: 3–4 members. Enforced on client + server (`validators.ts`).
- **Team leader**: exactly one member must have `isLeader = true`. Enforced.
- **Unique team name**: server-side check at `/api/registrations/check-team-name`.
- **Unique emails within team**: enforced at submit.
- **@gmail.com emails** + 10-digit phone (Indian mobile) required per member.
- **Registration deadline**: server-side enforced. Returns 403 if past.
- **Payment flow**:
  1. Team created → `DRAFT`
  2. Payment submitted (transactionId) → `PAYMENT_PENDING`
  3. Screenshot uploaded → still `PAYMENT_PENDING`
  4. Super admin verifies → `PaymentStatus.VERIFIED`, team → `PAYMENT_VERIFIED`
  5. Super admin approves team → `APPROVED`, each participant gets a
     `participantId` + opaque `qrToken`. Pass links can be emailed.
- **QR / pass**:
  - `qrToken` is a 24-byte random hex string (96 bits of entropy).
  - QR encodes only the token — no PII in the QR itself.
  - Pass page at `/pass/[qrToken]` resolves `token → participant → team`.
  - PNG pass (1000×1414) is composited client-side for printing.
- **Food check-in**:
  - DB unique constraint `[participantId, mealId]` prevents duplicates even
    under concurrent scans (returns `ALREADY_CHECKED_IN` 409).
  - Scanner at `/food-admin` (camera + manual token entry).
  - Admin can manage meals (Breakfast / Lunch / Snacks / Dinner / Custom).

---

## 7. File storage

`src/lib/upload.ts` does both:

1. **Vercel Blob (production)** — when both `BLOB_READ_WRITE_TOKEN` and
   `BLOB_STORE_ID` are set, files are uploaded via `@vercel/blob.put()`. The
   returned `https://*.public.blob.vercel-storage.com/...` URL is stored in
   the DB (e.g. `Sponsor.logoUrl`, `PaymentScreenshot.filePath`).
2. **Local filesystem (dev fallback)** — when Blob env vars are absent,
   files are written to `public/uploads/` and a `/uploads/...` URL is
   returned. This directory is git-ignored.

Both code paths validate MIME type, sniff the magic number, and enforce an
8 MB size limit before storing.

The returned `StoredFile.relativePath` is the URL you put in `<img src>` or
`<Image src>`. The `next.config.ts` `images.remotePatterns` allows any HTTPS
hostname for blob URLs.

---

## 8. Environment variables

| Name                        | Required | Purpose                                                          |
|-----------------------------|:--------:|------------------------------------------------------------------|
| `DATABASE_URL`               | yes      | PostgreSQL connection string (Neon / Vercel Postgres / self-hosted). Used by Prisma. |
| `NEXTAUTH_SECRET`           | yes      | JWT signing secret. Generate with `openssl rand -base64 32`.      |
| `NEXTAUTH_URL`              | yes      | Public URL of the deployment (used for callback URLs).            |
| `ADMIN_USERNAME`            | seed     | Bootstrap super admin username. Required for `bun run db:seed`.  |
| `ADMIN_EMAIL`               | seed     | Bootstrap super admin email. Required for `bun run db:seed`.      |
| `ADMIN_PASSWORD`            | seed     | Bootstrap super admin password. Required for `bun run db:seed`.   |
| `HM3_BERSERK_SECRET`        | seed     | BERSERK recovery secret for credential rotation. If absent at seed time, one is generated and printed once to stdout. Save it before deploying. |
| `COORDINATOR_USERNAME`      | optional | Coordinator login. Coordinator account is created only if both username and password are set. |
| `COORDINATOR_PASSWORD`      | optional | Coordinator password (paired with `COORDINATOR_USERNAME`).        |
| `COORDINATOR_EMAIL`         | optional | Coordinator email. Defaults to `<username>@hackmitten.local`.     |
| `FOOD_ADMIN_USERNAME`       | optional | Food admin login. Created only if both username and password are set. |
| `FOOD_ADMIN_PASSWORD`       | optional | Food admin password (paired with `FOOD_ADMIN_USERNAME`).          |
| `FOOD_ADMIN_EMAIL`          | optional | Food admin email. Defaults to `<username>@hackmitten.local`.     |
| `BLOB_READ_WRITE_TOKEN`     | optional | Vercel Blob read/write token. When set with `BLOB_STORE_ID`, file uploads go to Blob. |
| `BLOB_STORE_ID`             | optional | Vercel Blob store id (paired with `BLOB_READ_WRITE_TOKEN`).       |
| `EMAIL_API_URL`             | optional | Email provider endpoint. If unset, emails are logged to console. |
| `EMAIL_API_KEY`             | optional | Bearer token for the email provider.                            |
| `EMAIL_FROM`                | optional | `From:` header for outbound emails.                              |

> The seed scripts never write to `.env.local` or any file. They read from
> `process.env` and fail loudly when required variables are missing.

---

## 9. Local development setup

```bash
# 1. Install dependencies
bun install

# 2. Create your .env (copy from .env.example and fill in real values)
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL, NEXTAUTH_SECRET, ADMIN_*

# 3. Generate the Prisma client + apply migrations
bun run db:generate
bun run db:migrate:deploy          # applies existing migrations
# (for local-only schema changes: bun run db:migrate --name <change>)

# 4. Bootstrap the production-shaped data (admin + config + default meals)
bun run db:seed

# 5. Optionally load demo content (teams / sponsors / gallery / etc.)
#    Refuses to run with NODE_ENV=production.
bun run db:seed:demo

# 6. Run the dev server (Next.js on port 3000)
bun run dev
```

Open the **Preview Panel** to view the app. Do not navigate to
`http://localhost:3000` directly — it is an internal address.

---

## 10. Database workflow

| Task                              | Command                                          |
|-----------------------------------|--------------------------------------------------|
| Regenerate Prisma client           | `bun run db:generate`                            |
| Create a new migration             | `bun run db:migrate --name <change>`             |
| Apply migrations (dev)             | `bun run db:migrate`                             |
| Apply migrations (prod / CI)       | `bun run db:migrate:deploy`                      |
| Reset DB and re-apply all migrations | `bun run db:reset`                            |
| Push schema without a migration    | `bun run db:push --accept-data-loss` (destructive) |
| Bootstrap production data          | `bun run db:seed`                                |
| Load demo data (dev only)          | `bun run db:seed:demo`                           |

Migration files live in `prisma/migrations/` and are committed. The base
migration `20260921000000_init` creates every table from an empty schema.

---

## 11. Testing

```bash
bun test                                  # all tests
bun test tests/validators.test.ts         # Zod schemas (registration, payment, food, BERSERK)
bun test tests/permissions.test.ts        # Role × permission matrix
bun test tests/event-state.test.ts        # Event lifecycle (UPCOMING / OPEN / LIVE / ENDED)
bun test tests/food-checkin.test.ts       # DB duplicate prevention (skipped if DATABASE_URL is not postgres)
bun run lint                              # ESLint
bun run build                             # Production build
```

The food-checkin test needs a live PostgreSQL instance and is automatically
skipped when `DATABASE_URL` is missing or not a postgres URL.

---

## 12. Deployment checklist

Pre-deploy (each item is a hard requirement):

1. **Database** — provisioned PostgreSQL (Neon recommended). `DATABASE_URL`
   is set with `?sslmode=require` and a healthy connection.
2. **Migrations applied** — `bun run db:migrate:deploy` runs cleanly.
3. **Secrets** — `NEXTAUTH_SECRET` set (≥ 32 chars, base64-encoded).
4. **Admin credentials** — `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
   set to strong values. `HM3_BERSERK_SECRET` set (or capture the one printed
   by the seed script).
5. **Blob** — `BLOB_READ_WRITE_TOKEN` + `BLOB_STORE_ID` set on Vercel.
6. **NEXTAUTH_URL** — set to the production domain.
7. **Build** — `bun run build` passes locally with the production env.
8. **Seed** — `bun run db:seed` runs cleanly. Do NOT run `db:seed:demo` in
   production — it will refuse anyway because `NODE_ENV=production`.

Post-deploy:

- Visit `/login` and log in with the admin credentials.
- Visit `/admin/settings` and adjust event timing, fee, prize pool, UPI ID,
  UPI QR URL.
- Visit `/admin/meals` and configure meal times.
- Visit `/admin/coordinators` and add the real coordinator profiles.
- Visit `/admin/sponsors`, `/admin/gallery`, `/admin/winners` to upload
  real assets.

---

## 13. Incident recovery

### Lost super-admin password

If you have the BERSERK secret: log in once with the old password (if any
admin still has it) and rotate via `/admin/credentials`.

If the password is lost AND no one can log in: rotate via the DB directly.

```sql
-- Generate a new bcrypt hash first, then run:
UPDATE "User"
SET "passwordHash" = '<new bcrypt hash>'
WHERE "username" = '<admin username>';
```

### Lost BERSERK secret

You must reset `recoveryHash` to a known bcrypt hash via SQL, then use that
plaintext to rotate via `/admin/credentials`. There is no other recovery
path — by design.

```sql
-- bcrypt('new-berserk-secret', 12)
UPDATE "User"
SET "recoveryHash" = '<new bcrypt hash>'
WHERE "role" = 'SUPER_ADMIN';
```

### Bad config (broken public site)

Most public-site breakage is config-driven. Fix at `/admin/settings` or
temporarily reset the singleton:

```sql
UPDATE "EventConfig" SET "heroVisible" = true, "winnersVisible" = false WHERE id = 'singleton';
```

### Rollback a destructive admin change

`/admin/change-history` lists every mutation with previousState / newState
snapshots. Select a row and click **Rollback** — the previousState is
restored and the rollback is itself recorded.

### Rollback a bad migration

```bash
# Add a new migration that reverses the bad one:
bun run db:migrate --name revert_<change>
# Then deploy:
bun run db:migrate:deploy
```

Never edit a committed migration. Always add a new one.

---

## 14. What NOT to do

- Do not modify `src/components/three/space-scene.tsx` — the 3D scene is
  tuned for the cinematic experience and must stay intact.
- Do not run `bun run db:seed:demo` in production.
- Do not commit `.env`, `.env.local`, or any file containing real secrets.
- Do not commit files in `public/uploads/` — they are user-generated and
  git-ignored.
- Do not edit committed migrations in place — add a new one instead.
- Do not bypass `requirePermission()` in API routes — every mutation must
  go through the role × permission matrix.
