# Hackmitten 3.0

Hackmitten is a small, deliberately simple Bun workspace for the Hackmitten registration event. The browser application and privileged API deploy independently to Vercel; PostgreSQL and private binary objects are hosted by Supabase.

## Workspace

- `frontend/` — Next.js public, registration, pass, administrator, coordinator, and food-admin UI. It contains no Prisma client or server credentials.
- `backend/` — Next.js API, NextAuth, Prisma, email, registration/payment/meal workflows, exports, and private Supabase Storage access.
- `shared/` — small transport-only types.
- `docs/` — architecture and deployment runbooks.

## Local development

```sh
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
bun install
bun run dev
```

The frontend listens on `http://localhost:3000`; the backend listens on `http://localhost:3001`. `BACKEND_API_ORIGIN` makes the frontend proxy `/api/*`, keeping browser calls and authentication cookies same-origin.

Useful checks are `bun run lint`, `bun run typecheck`, `bun run test`, and `bun run build`.

## Production

Create two Vercel projects from this repository: one with **Root Directory** `frontend`, and one with **Root Directory** `backend`. See [the deployment runbook](docs/deployment.md) before migrating or deploying.
