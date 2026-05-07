-- CreateEnum
CREATE TYPE "ParticipantTemporaryTokenType" AS ENUM ('AUTHORIZE_PARTICIPANT');

-- CreateEnum
CREATE TYPE "ParticipantAuthorizationContext" AS ENUM ('PUBLIC_FORM');

-- CreateTable
CREATE TABLE IF NOT EXISTS "participant_temporary_tokens" (
    "id" TEXT NOT NULL,
    "idParticipantWpp" TEXT NOT NULL,
    "type" "ParticipantTemporaryTokenType" NOT NULL,
    "context" "ParticipantAuthorizationContext" NOT NULL,
    "otpHash" TEXT NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSentAt" TIMESTAMP(3),
    "resendCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participant_temporary_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "participant_temporary_tokens_idParticipantWpp_type_context_idx" ON "participant_temporary_tokens"("idParticipantWpp", "type", "context");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "participant_temporary_tokens_expiresAt_idx" ON "participant_temporary_tokens"("expiresAt");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'participant_temporary_tokens_idParticipantWpp_fkey'
  ) THEN
    ALTER TABLE "participant_temporary_tokens" ADD CONSTRAINT "participant_temporary_tokens_idParticipantWpp_fkey" FOREIGN KEY ("idParticipantWpp") REFERENCES "participants_wpp"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
