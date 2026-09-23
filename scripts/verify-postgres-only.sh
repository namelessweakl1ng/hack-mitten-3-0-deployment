#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "Checking PostgreSQL-only architecture..."

if grep -RniE 'provider[[:space:]]*=[[:space:]]*"sqlite"' \
  prisma src tests scripts \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  2>/dev/null; then
  echo "ERROR: SQLite Prisma provider detected."
  exit 1
fi

if grep -RniE 'DATABASE_URL[[:space:]]*=.*file:' \
  prisma src tests scripts .env.example \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  2>/dev/null; then
  echo "ERROR: SQLite DATABASE_URL detected."
  exit 1
fi

if grep -RniE 'db/custom\.db|custom\.db' \
  prisma src tests scripts \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  2>/dev/null; then
  echo "ERROR: Legacy SQLite database path detected."
  exit 1
fi

if ! grep -q 'provider[[:space:]]*=[[:space:]]*"postgresql"' \
  prisma/schema.prisma; then
  echo "ERROR: Prisma schema is not PostgreSQL."
  exit 1
fi

if ! grep -q 'provider[[:space:]]*=[[:space:]]*"postgresql"' \
  prisma/migrations/migration_lock.toml; then
  echo "ERROR: Prisma migration lock is not PostgreSQL."
  exit 1
fi

echo "PostgreSQL-only architecture check passed."
