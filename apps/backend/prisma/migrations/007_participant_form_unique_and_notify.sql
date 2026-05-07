-- Unique 1:1 formulário por participante + preferência de envio ao grupo
ALTER TABLE "participant_forms" ADD COLUMN IF NOT EXISTS "sendFormMessageToGroup" BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS "participant_forms_idParticipantWpp_key" ON "participant_forms"("idParticipantWpp");
