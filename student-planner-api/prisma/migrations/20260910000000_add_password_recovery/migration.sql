ALTER TABLE "users" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "resetPasswordTokenHash" TEXT,
ADD COLUMN "resetPasswordExpiresAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "users_resetPasswordTokenHash_key" ON "users"("resetPasswordTokenHash");
