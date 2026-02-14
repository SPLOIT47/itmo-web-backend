CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
CREATE TYPE "OutboxStatus" AS ENUM ('NEW', 'SENT', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE TYPE "OutboxEventType" AS ENUM ('USER_REGISTERED', 'USER_CREDENTIALS_UPDATED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "User" (
    "userId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
    );

DO $$ BEGIN
ALTER TABLE "User" ADD CONSTRAINT "User_email_key" UNIQUE ("email");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
ALTER TABLE "User" ADD CONSTRAINT "User_login_key" UNIQUE ("login");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "RefreshToken" (
                                              "refreshTokenId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "revokedAt" TIMESTAMPTZ NULL,
    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("refreshTokenId"),
    CONSTRAINT "RefreshToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("userId")
    ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE INDEX IF NOT EXISTS "RefreshToken_userId_idx" ON "RefreshToken" ("userId");
CREATE INDEX IF NOT EXISTS "RefreshToken_userId_tokenHash_idx" ON "RefreshToken" ("userId", "tokenHash");
CREATE INDEX IF NOT EXISTS "RefreshToken_userId_revokedAt_idx" ON "RefreshToken" ("userId", "revokedAt");

CREATE TABLE IF NOT EXISTS "OutboxEvent" (
                                             "outboxEventId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventType" "OutboxEventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "sentAt" TIMESTAMPTZ NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT NULL,
    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("outboxEventId")
    );

CREATE INDEX IF NOT EXISTS "OutboxEvent_status_createdAt_idx"
    ON "OutboxEvent" ("status", "createdAt");