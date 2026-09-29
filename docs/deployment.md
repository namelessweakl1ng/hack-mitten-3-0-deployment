# Vercel and Supabase deployment

## Supabase preparation

1. Keep the existing PostgreSQL data and apply checked-in migrations with `bun run db:migrate:deploy` from a controlled environment.
2. Create `passport-images`, `payment-screenshots`, and `images` buckets. **Keep `passport-images` and `payment-screenshots` private.** No public policy or anonymous read rule is needed; access is streamed by authorized backend endpoints.
3. Set the backend's service-role key only in the backend Vercel project. Never use a `NEXT_PUBLIC_` name for it.

`DATABASE_URL` is the Supabase pooled runtime connection (transaction pooler, normally port 6543). `DIRECT_URL` is the direct/session connection (normally port 5432) used by Prisma migrations. Test migration connectivity before a production deploy and never use `prisma migrate reset` against production.

## Vercel projects

Create two projects from the same Git repository:

| Project | Root Directory | Purpose |
| --- | --- | --- |
| frontend | `frontend/` | Website and all browser UI |
| backend | `backend/` | API, auth, Prisma, SMTP, storage |

Set frontend `NEXT_PUBLIC_APP_URL` and `BACKEND_API_ORIGIN` to the public frontend and backend origins. Set backend `NEXTAUTH_URL` to the frontend origin, a strong `NEXTAUTH_SECRET`, both database URLs, `BACKEND_CORS_ORIGINS` (comma-separated frontend origins), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, SMTP values, and bootstrap user values documented in `backend/.env.example`.

Deploy the backend after migrations, then deploy the frontend. Verify login and cookies through the frontend origin. Do not configure a persistent Vercel directory or `/tmp` storage.

## Release verification

Manually verify: register 3–4 members (leader first) and optional photos; submit a payment screenshot; verify payment and approve the team; confirm registration/participant IDs and QR passes; sign in as coordinator; open the approved team; preview each photo and download it as the participant's name with `.jpg`, `.png`, or `.webp`.
