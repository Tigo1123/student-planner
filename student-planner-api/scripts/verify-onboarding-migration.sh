#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?Set DATABASE_URL to an EMPTY disposable test database}"
# This script only accepts the dedicated local onboarding test database.
case "$DATABASE_URL" in postgresql://taj@127.0.0.1:55439/onboarding_test) ;; *) echo 'Use the isolated onboarding_test database on port 55439.'; exit 1;; esac
if [ "$(psql "$DATABASE_URL" -Atc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")" != 0 ]; then echo 'Database must be empty'; exit 1; fi
migration_tmp=$(mktemp -d /tmp/onboarding-migration.XXXXXX)
cp prisma/schema.prisma "$migration_tmp/schema.prisma"
mkdir "$migration_tmp/migrations"
cp prisma/migrations/migration_lock.toml "$migration_tmp/migrations/"
for migration in prisma/migrations/202608*; do cp -r "$migration" "$migration_tmp/migrations/"; done
npx prisma migrate deploy --schema "$migration_tmp/schema.prisma"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO users (id,name,email,\"passwordHash\",\"updatedAt\") VALUES ('00000000-0000-4000-8000-000000000001','Existing user','existing-migration@example.com','unused',NOW())"
npm run prisma:migrate:deploy
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
DO $$ BEGIN
IF NOT (SELECT "onboardingCompleted" FROM users WHERE email='existing-migration@example.com') THEN RAISE EXCEPTION 'Existing account was not preserved'; END IF;
IF (SELECT "onboardingCompletedAt" IS NOT NULL FROM users WHERE email='existing-migration@example.com') THEN RAISE EXCEPTION 'Migration must not fabricate completion timestamps'; END IF;
END $$;
INSERT INTO users (id,name,email,"passwordHash","updatedAt") VALUES ('00000000-0000-4000-8000-000000000002','New user','new-migration@example.com','unused',NOW());
DO $$ BEGIN
IF (SELECT "onboardingCompleted" FROM users WHERE email='new-migration@example.com') THEN RAISE EXCEPTION 'New account default is wrong'; END IF;
END $$;
DELETE FROM users WHERE email IN ('existing-migration@example.com','new-migration@example.com');
SQL
npx prisma migrate status
npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code
