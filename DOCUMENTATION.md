# HACKMITTEN 3.0 — Project Documentation & Refactor Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Environment Variables](#environment-variables)
6. [Database Schema](#database-schema)
7. [Authentication & Roles](#authentication--roles)
8. [API Reference](#api-reference)
9. [Admin Dashboard](#admin-dashboard)
10. [Coordinator Portal](#coordinator-portal)
11. [Food System](#food-system)
12. [Public Website](#public-website)
13. [Registration Flow](#registration-flow)
14. [QR System](#qr-system)
15. [Change History & Rollback](#change-history--rollback)
16. [Email System](#email-system)
17. [Testing](#testing)
18. [Deployment](#deployment)
19. [Refactor Guide](#refactor-guide)

---

## Architecture Overview

```
                    HACKMITTEN 3.0
                           │
              ┌────────────┴────────────┐
              │                         │
        PUBLIC EXPERIENCE          ADMIN EXPERIENCE
              │                         │
           Next.js 16                Next.js 16
        (App Router + RSC)        Role-based routes
              │                         │
      React Three Fiber         NextAuth sessions
      Three.js + Drei           Prisma ORM
      GSAP + Lenis              Zod validation
              │                         │
              └────────────┬────────────┘
                           │
                         API
                  (Next.js Route Handlers)
                           │
                         Prisma
                           │
                       SQLite (dev)
                       PostgreSQL (prod)
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| 3D / Animation | React Three Fiber, Three.js, Drei, @react-three/postprocessing |
| Smooth Scroll | Lenis |
| Database | Prisma ORM + SQLite (dev), PostgreSQL-ready |
| Auth | NextAuth.js v4 (credentials, JWT sessions, bcrypt) |
| QR | qrcode.react (pass generation), qrcode (coordinator download), html5-qrcode (food scanner) |
| State | Zustand (registration form) + TanStack Query (server data) |
| Validation | Zod (server + client) |
| Tests | Bun test |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                     # Public landing page
│   ├── layout.tsx                   # Root layout + providers
│   ├── globals.css                  # Design tokens & glass utilities
│   ├── register/page.tsx            # Multi-step registration
│   ├── login/page.tsx               # 3-button role selector
│   ├── pass/[qrToken]/page.tsx      # Participant digital pass
│   ├── admin/
│   │   ├── page.tsx                 # Dashboard
│   │   ├── registrations/           # Registration management
│   │   ├── teams/                   # Team CRUD (add/edit/delete)
│   │   ├── food/                    # Food dashboard
│   │   ├── audit/                   # Audit log (with delete)
│   │   ├── settings/                # Event configuration
│   │   ├── timeline/                # Phase CRUD
│   │   ├── gallery/                 # Gallery CRUD
│   │   ├── coordinators/            # Coordinator CRUD
│   │   ├── sponsors/                # Sponsor CRUD
│   │   ├── winners/                 # Winner CRUD
│   │   ├── meals/                   # Meal CRUD
│   │   ├── change-history/          # Rollback system
│   │   ├── credentials/             # BERSERK password change
│   │   └── users/                   # Admin user management
│   ├── coordinator/page.tsx         # Coordinator portal
│   ├── food-admin/page.tsx          # Food QR scanner
│   └── api/
│       ├── auth/[...nextauth]/      # NextAuth
│       ├── registrations/           # Public registration API
│       ├── admin/                   # Admin APIs
│       ├── food/                    # Food check-in APIs
│       ├── coordinator/              # Coordinator team APIs
│       ├── pass/[qrToken]/          # Public pass lookup
│       ├── gallery/                 # Public gallery
│       ├── coordinators/            # Public coordinators
│       ├── sponsors/                # Public sponsors
│       ├── winners/                 # Public winners
│       ├── phases/                  # Public phases
│       ├── meals/                   # Public meals
│       ├── config/                  # Public event config
│       └── event-state/             # Event lifecycle state
├── components/
│   ├── three/                       # SpaceScene, scroll progress hook
│   ├── sections/                    # Hero, About, Timeline, Gallery, Coordinators, Sponsors, Venue, Winners, CTA, Footer
│   ├── public/                      # Public nav
│   ├── register/                    # Multi-step store + steps
│   ├── admin/                       # Admin shell + managers
│   └── coordinator/                 # Coordinator shell + portal
├── lib/
│   ├── auth.ts                      # NextAuth config
│   ├── api-auth.ts                  # requireSession / requirePermission
│   ├── permissions.ts               # Role → permission matrix
│   ├── validators.ts                # Zod schemas
│   ├── audit.ts                     # Audit log writer
│   ├── change-history.ts            # Change history recorder
│   ├── upload.ts                    # Image storage + MIME sniffing
│   ├── email.ts                     # Email system (approval emails)
│   ├── event-state.ts               # Event lifecycle single source of truth
│   ├── constants.ts                 # ID generators + password generators
│   └── db.ts                        # Prisma client
prisma/
└── schema.prisma                    # 14 models
scripts/
├── seed.ts                          # Database seed (uses env vars)
└── clear-data.ts                     # Clear all data except admin accounts
tests/
├── validators.test.ts               # Zod schema tests
├── permissions.test.ts               # Role permission tests
├── event-state.test.ts               # Event state tests
└── food-checkin.test.ts              # Duplicate prevention tests
```

## Getting Started

```bash
# 1. Install dependencies
bun install

# 2. Copy environment variables
cp .env.example .env

# 3. Set your credentials in .env
# Edit .env with your admin username, password, etc.

# 4. Create database
bun run db:push

# 5. Seed database
bun run scripts/seed.ts

# 6. Start dev server
bun run dev
```

## Environment Variables

See `.env.example` for all variables. Key ones:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite or PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret for JWT sessions (min 32 chars) |
| `NEXTAUTH_URL` | Your deployment URL |
| `ADMIN_USERNAME` | Super admin username |
| `ADMIN_EMAIL` | Super admin email |
| `ADMIN_PASSWORD` | Super admin password (use a strong one!) |
| `COORDINATOR_USERNAME` | Coordinator username |
| `COORDINATOR_PASSWORD` | Coordinator password |
| `FOOD_ADMIN_USERNAME` | Food admin username |
| `FOOD_ADMIN_PASSWORD` | Food admin password |
| `HM3_BERSERK_SECRET` | Recovery secret for password changes (auto-generated) |
| `EMAIL_API_URL` | Email provider API endpoint (optional in dev) |
| `EMAIL_API_KEY` | Email provider API key (optional in dev) |

**⚠️ NEVER commit `.env` or `.env.local` to git. They are in `.gitignore`.**

## Database Schema

14 models with proper relations and constraints:

- **User** — Admin/coordinator/food admin accounts (bcrypt hashed passwords)
- **EventConfig** — Singleton with all event settings (40+ configurable fields)
- **HackathonPhase** — Timeline phases (CRUD via admin)
- **Team** — Registered teams (unique team name, registration ID)
- **Participant** — Team members (exactly one leader, unique QR token)
- **Payment** — Payment records (PENDING/VERIFIED/REJECTED)
- **PaymentScreenshot** — Uploaded payment screenshots
- **Meal** — Food meal types (BREAKFAST/LUNCH/SNACKS/DINNER/CUSTOM)
- **FoodCheckIn** — Meal check-in records (unique per participant+meal)
- **CoordinatorProfile** — Public coordinator profiles
- **GalleryItem** — Gallery images
- **Sponsor** — Sponsor logos with tiers
- **Winner** — Winner entries with images
- **AuditLog** — Admin action history (deletable by super admin)
- **ChangeHistory** — Rollback system (previous/new state snapshots)

## Authentication & Roles

| Role | Permissions |
|------|-------------|
| SUPER_ADMIN | Everything — all admin, config, teams, payments, food, audit, users, credentials |
| COORDINATOR | View approved teams + participant IDs, meal consumption (read-only), CSV export |
| FOOD_ADMIN | Scan QR, view food consumption, manage meals |
| PARTICIPANT | (No admin access) |

- Login at `/login` with 3 buttons: ADMIN, COORDINATOR, FOOD COORDINATOR
- Login accepts username OR email + password
- All sessions are JWT-based with role attached
- BERSERK recovery system for super admin password changes
- Logout redirects to `/login`

## API Reference

### Public APIs
- `GET /api/config` — Event configuration
- `GET /api/event-state` — Event lifecycle state (UPCOMING/REGISTRATION_OPEN/REGISTRATION_CLOSED/LIVE/ENDED)
- `GET /api/gallery` — Gallery items
- `GET /api/coordinators` — Coordinator profiles (visible only)
- `GET /api/sponsors` — Sponsors (visible only)
- `GET /api/winners` — Winners (only if winnersVisible=true)
- `GET /api/phases` — Timeline phases (visible only)
- `GET /api/meals` — All meals
- `POST /api/registrations` — Create team registration (enforces deadline)
- `GET /api/registrations/check-team-name?name=...` — Team name availability
- `GET /api/pass/[qrToken]` — Participant pass lookup

### Admin APIs (auth + permission required)
- `GET/POST /api/admin/teams` — List + manually create teams
- `PATCH/DELETE /api/admin/teams/[id]` — Edit + delete teams
- `POST /api/admin/teams/[id]/approve` — Approve team (generates IDs + QR + sends emails)
- `PATCH /api/admin/teams/[id]/approve` — Revert approval (action: "revert")
- `POST /api/admin/teams/[id]/reject` — Reject team
- `GET /api/admin/registrations` — Paginated registration list
- `GET /api/admin/registrations/[id]` — Registration detail
- `POST /api/admin/payments/[id]/verify` — Verify payment
- `POST /api/admin/payments/[id]/reject` — Reject payment
- `GET/PATCH /api/admin/config` — Event config (PATCH accepts JSON or multipart)
- `GET/POST /api/admin/audit` — Audit log list
- `DELETE /api/admin/audit/[id]` — Delete single log
- `POST /api/admin/audit/bulk-delete` — Bulk delete logs
- `GET/POST /DELETE /api/admin/coordinators` — Coordinator CRUD
- `GET/POST/DELETE /api/admin/sponsors` — Sponsor CRUD
- `GET/POST/DELETE /api/admin/winners` — Winner CRUD
- `GET/POST/DELETE /api/admin/gallery` — Gallery CRUD
- `GET/POST/DELETE /api/admin/meals` — Meal CRUD
- `GET/POST /DELETE /api/admin/phases` — Phase CRUD
- `GET/POST /api/admin/users` — Admin user management
- `POST /api/admin/credentials` — Change super admin credentials (BERSERK)
- `GET/POST /api/admin/change-history` — Change history + rollback
- `POST /api/admin/change-history/[id]/rollback` — Rollback a change
- `GET /api/admin/export` — CSV export of all registrations

### Food APIs
- `POST /api/food/check-in` — Scan QR (accepts qrToken or participantId)
- `GET /api/food/check-ins` — Check-in history
- `GET /api/food/stats` — Per-meal eaten/not-eaten statistics
- `GET /api/food/team-status` — Team × meal consumption matrix

### Coordinator APIs
- `GET /api/coordinator/teams` — Approved teams with member participant IDs

## Admin Dashboard

Located at `/admin`. Super admin only. Sections:

1. **Dashboard** — Stats overview (teams, payments, food check-ins, sponsors)
2. **Registrations** — Search/filter/payment verification/team approval
3. **Teams** — Add/edit/delete teams manually
4. **Food Check-ins** — Meal consumption visualization (eaten/not eaten, team matrix)
5. **Audit Log** — All admin actions (deletable with confirmation)
6. **Event Settings** — All event config (name, timing, hero, about, footer, UPI, social, winners)
7. **Timeline** — Phase CRUD
8. **Gallery** — Image CRUD with replace image
9. **Coordinators** — Coordinator CRUD with photo upload
10. **Sponsors** — Sponsor CRUD with logo upload
11. **Winners** — Winner CRUD with image upload + visibility toggle
12. **Meals** — Meal CRUD (accessible by food admin)
13. **Change History** — Rollback any admin change
14. **Credentials** — BERSERK password change
15. **Admin Users** — Create/delete admin accounts

## Coordinator Portal

Located at `/coordinator`. Coordinator + super admin access.

- **Approved Teams tab** — Card grid of approved teams, click to see member details + participant IDs
- **Meal Consumption tab** — Per-meal eaten/not-eaten statistics with team breakdown
- **CSV export** — Download all teams as spreadsheet
- **QR download** — Download each participant's QR code as PNG (named after the participant)
- No audit log access, no payment data, no admin settings

## Food System

Located at `/food-admin` (scanner) and `/admin/food` (dashboard).

- **Scanner** — Camera-based QR scanning + manual token entry
- **Dashboard** — 4 tabs: Consumption (progress bar + eaten/not-eaten lists), Team Status (matrix), Scanner (link), History
- Duplicate prevention via DB unique constraint `[participantId, mealId]`
- Accepts both qrToken and participantId for backwards compatibility
- Meal management at `/admin/meals` (food admin + super admin)

## Public Website

- **Hero** — Cinematic 3D black hole + countdown + registration CTA
- **About** — Stats (duration, team size, fee, prize, venue)
- **Timeline** — Phase cards with live/active/upcoming states
- **Gallery** — Coverflow carousel with grayscale→color transition
- **Coordinators** — Student + faculty coordinator cards (full color)
- **Sponsors** — Logos grouped by tier (full color)
- **Venue** — Google Maps embed + link
- **Winners** — Conditional (only when winnersVisible=true, replaces normal sections)
- **CTA** — "JOIN THE MISSION" with registration button
- **Footer** — Contact, venue, social links, college logo

### Event State System

Single source of truth at `src/lib/event-state.ts`:
- States: UPCOMING → REGISTRATION_OPEN → REGISTRATION_CLOSED → LIVE → ENDED
- Derived from EventConfig timestamps
- Registration API rejects when closed
- Public CTAs hide when closed
- All consumers use the same logic

### 3D Animation

The space scene uses the original cinematic implementation:
- Black hole with custom GLSL accretion disk shader
- Multi-layer particle fields
- Scroll-driven camera movement (smooth damping)
- Post-processing (Bloom + Vignette) on desktop
- Mobile: reduced particles, no post-processing, graceful fallback
- Respects `prefers-reduced-motion`

## Registration Flow

1. **Team** — Team name (with live duplicate check)
2. **Members** — 3-4 members, exactly one leader, @gmail.com email, 10-digit phone, college required
3. **Details** — Review summary
4. **Payment** — UPI ID + QR (from admin config), transaction ID, screenshot upload (max 8MB, MIME + magic-number validation)
5. **Submit** — "Payment Under Review" confirmation

Server-side validation:
- Team name unique
- 3-4 members, exactly one leader
- @gmail.com email required
- 10-digit phone (numbers only)
- College required per member
- Registration deadline enforced

## QR System

- Each approved participant gets a 96-bit opaque hex token
- QR encodes ONLY the token (no PII)
- Pass page at `/pass/[qrToken]` shows team name, registration ID, participant ID, QR, verified badge
- PNG download: 1000×1414 composite canvas with QR
- Coordinator QR download: simple QR + name at bottom, named after participant
- Food scanner accepts both qrToken and participantId

## Change History & Rollback

Every admin mutation records previous + new state:
- Supported sections: EVENT_CONFIG, PHASE, GALLERY, SPONSOR, COORDINATOR, WINNER, MEAL, TEAM, PAYMENT
- Rollback restores previousState; the rollback itself is also recorded
- A → B → A is fully visible in history
- Cannot rollback CREATE actions

## Email System

Approval emails sent automatically when a team is approved:
- HTML email with team name, registration ID, participant ID, pass link
- Styled in Hackmitten visual identity
- In dev: logged to console
- In production: sent via configurable EMAIL_API_URL

## Testing

```bash
bun test                    # All tests
bun test tests/validators.test.ts       # Zod schemas
bun test tests/permissions.test.ts     # Role permissions
bun test tests/event-state.test.ts     # Event lifecycle
bun test tests/food-checkin.test.ts    # Duplicate prevention
```

## Deployment

1. Set all environment variables in production
2. Use PostgreSQL: `DATABASE_URL=postgresql://...`
3. Set strong `NEXTAUTH_SECRET` (min 32 chars)
4. Set real `ADMIN_PASSWORD` and `HM3_BERSERK_SECRET`
5. Configure `EMAIL_API_URL` for real email sending
6. Run `bun run db:push` then `bun run scripts/seed.ts`
7. `bun run build` then `bun run start`

## Refactor Guide

### Key Architecture Decisions

1. **Event State is the single source of truth** — `src/lib/event-state.ts` computes state from timestamps. All consumers (registration API, public nav, hero, register page, admin) use the same logic. Never duplicate event timing logic.

2. **Permissions are server-enforced** — `src/lib/permissions.ts` defines the role→permission matrix. `requirePermission()` is called in every protected API. Never rely on UI hiding.

3. **Change History is automatic** — `recordChange()` is called in every mutation API. The rollback system restores previousState safely.

4. **Uploads are validated** — `src/lib/upload.ts` validates MIME type + magic-number sniffing + size limits. Never trust client-provided filenames.

5. **QR tokens are opaque** — Never encode PII in QR codes. The token resolves server-side.

6. **Admin config drives the public site** — All public content (hero, about, footer, gallery, sponsors, coordinators, winners, venue, UPI) is database-driven. Admin changes take effect immediately via TanStack Query cache invalidation.

### Common Refactor Patterns

**Adding a new admin section:**
1. Create the Prisma model in `schema.prisma`
2. Create API routes at `src/app/api/admin/[section]/` with `requirePermission()`
3. Add `recordChange()` calls for rollback support
4. Create the admin component at `src/components/admin/[section]-manager.tsx`
5. Create the admin page at `src/app/admin/[section]/page.tsx`
6. Add to the NAV array in `src/components/admin/shell.tsx`
7. Add the permission to `src/lib/permissions.ts`

**Adding a new public section:**
1. Create the API route at `src/app/api/[section]/route.ts`
2. Create the section component at `src/components/sections/[section].tsx`
3. Add to `src/app/page.tsx`
4. Add to nav links in `src/components/public/nav.tsx`

**Changing the 3D animation:**
- The animation lives entirely in `src/components/three/space-scene.tsx`
- Scroll progress comes from `src/components/three/use-scroll-progress.ts` (Lenis)
- The scene is `position: fixed` behind all content with `pointer-events: none`
- Mobile fallback: reduced particles, no post-processing, or static gradient

**Changing registration validation:**
- Update `src/lib/validators.ts` (server-side)
- Update `src/components/register/steps.tsx` (client-side)
- Both must match — never trust frontend validation alone
