-- Foto do formulário na base (BYTEA) + tipo MIME; photoUrl passa a poder ser vazio.
ALTER TABLE "participant_forms" ADD COLUMN IF NOT EXISTS "photo" BYTEA;
ALTER TABLE "participant_forms" ADD COLUMN IF NOT EXISTS "photoMimeType" VARCHAR(64);

-- Garantir default para novas linhas (dados antigos mantêm photoUrl preenchido).
ALTER TABLE "participant_forms" ALTER COLUMN "photoUrl" SET DEFAULT '';
UPDATE "participant_forms" SET "photoUrl" = '' WHERE "photoUrl" IS NULL;
