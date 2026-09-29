# Security model

The frontend contains no database, SMTP, or Supabase service-role credentials. All mutations, authentication, authorization, and upload validation occur in the backend. The frontend's `/api/*` rewrite keeps normal browser traffic same-origin; the backend also enforces `BACKEND_CORS_ORIGINS` for direct cross-origin requests.

`passport-images` and `payment-screenshots` are private Supabase buckets. The backend stores opaque object references, selects paths from trusted database rows, and streams authorized responses with `Cache-Control: private, no-store` and `X-Content-Type-Options: nosniff`. Uploads are size-limited, magic-byte checked, decoded by Sharp, and stored under UUID paths.

Report vulnerabilities privately to the repository owner. Never commit `.env` files, production database URLs, service-role keys, SMTP passwords, or bootstrap passwords.
