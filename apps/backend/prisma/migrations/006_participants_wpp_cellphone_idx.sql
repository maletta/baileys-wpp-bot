-- CreateIndex (lookup OTP por ParticipantsWpp.cellphone)
CREATE INDEX IF NOT EXISTS "participants_wpp_cellphone_idx" ON "participants_wpp"("cellphone");
