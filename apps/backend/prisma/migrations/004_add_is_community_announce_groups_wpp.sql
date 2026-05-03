-- AlterTable
ALTER TABLE "groups_wpp" ADD COLUMN IF NOT EXISTS "isCommunityAnnounce" BOOLEAN NOT NULL DEFAULT false;
