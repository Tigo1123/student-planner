-- Existing accounts keep access. Only subsequent inserts start incomplete.
BEGIN;
ALTER TABLE "users" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN "onboardingDraft" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN "onboardingRevision" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "academicProfile" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "users" ALTER COLUMN "onboardingCompleted" SET DEFAULT false;
COMMIT;
