-- AlterTable
ALTER TABLE "groups_wpp" ADD COLUMN IF NOT EXISTS "isCommunity" BOOLEAN NOT NULL DEFAULT false;
