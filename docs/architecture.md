# Architecture

## Before and after

The previous application mixed React pages, API handlers, Prisma, SMTP, authentication, and filesystem uploads in one Next.js project. Its production guidance assumed systemd, nginx, and durable Linux paths.

The workspace now has two independently deployable Next.js applications. The frontend is only UI and proxies `/api/*` to the backend. The backend owns all validation, authorization, database transactions, email, exports, and storage. Prisma continues to use Supabase PostgreSQL; Supabase's query SDK is not a replacement for Prisma.

Private files use opaque `supabase://bucket/object` references in PostgreSQL. Those values never appear in registration or coordinator JSON. Authorized endpoints download the objects with a server-only service-role client and stream bytes with `private, no-store` and `nosniff` headers. Participant downloads derive a safe filename from the participant's name.

Registration uses authoritative Zod validation, a unique database constraint for exact team names, canonical-name checks protected by PostgreSQL advisory locks, and a capacity lock inside the creation transaction. Uploaded objects are removed when creation fails. Payment and participant objects use UUID names and server-selected buckets/paths.

## Request flow

Browser → frontend `/api/*` rewrite → backend route → authorization/validation → Prisma/Supabase Storage. Cross-origin direct backend requests are rejected unless their origin is listed in `BACKEND_CORS_ORIGINS`.
