-- AlterTable groups_wpp: description
ALTER TABLE "groups_wpp" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- AlterTable participants_wpp: jid, lid
ALTER TABLE "participants_wpp" ADD COLUMN IF NOT EXISTS "jid" TEXT;
ALTER TABLE "participants_wpp" ADD COLUMN IF NOT EXISTS "lid" TEXT;
