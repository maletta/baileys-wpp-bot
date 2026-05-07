-- Pergunta «Qual seu rolê favorito?» — coluna `favoriteActivity` (texto livre).
ALTER TABLE "participant_forms" ADD COLUMN IF NOT EXISTS "favoriteActivity" TEXT NOT NULL DEFAULT '';
