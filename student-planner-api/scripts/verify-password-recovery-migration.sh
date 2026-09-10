#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?Set DATABASE_URL to the disposable recovery_migration_test database}"
case "$DATABASE_URL" in postgresql://taj@127.0.0.1:55439/recovery_migration_test) ;; *) echo 'Use the isolated recovery_migration_test database on port 55439.'; exit 1;; esac
if [ "$(psql "$DATABASE_URL" -Atc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")" != 0 ]; then echo 'Database must be empty'; exit 1; fi
recovery_tmp=$(mktemp -d /tmp/recovery-migration.XXXXXX)
cp prisma/schema.prisma "$recovery_tmp/schema.prisma"
mkdir "$recovery_tmp/migrations"
cp prisma/migrations/migration_lock.toml "$recovery_tmp/migrations/"
for migration in prisma/migrations/202608* prisma/migrations/20260909*; do cp -r "$migration" "$recovery_tmp/migrations/"; done
npx prisma migrate deploy --schema "$recovery_tmp/schema.prisma"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO users (id,name,email,\"passwordHash\",\"updatedAt\",\"onboardingCompleted\") VALUES ('00000000-0000-4000-8000-000000000001','Existing recovery user','recovery-migration@example.com','preserved-password-hash',NOW(),true)"
npm run prisma:migrate:deploy
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM users WHERE email='recovery-migration@example.com' AND "passwordHash"='preserved-password-hash' AND "sessionVersion"=0 AND "resetPasswordTokenHash" IS NULL AND "resetPasswordExpiresAt" IS NULL AND "onboardingCompleted") THEN RAISE EXCEPTION 'Existing account changed unexpectedly'; END IF;
END $$;
DELETE FROM users WHERE email='recovery-migration@example.com';
SQL
npx prisma migrate status
npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code
