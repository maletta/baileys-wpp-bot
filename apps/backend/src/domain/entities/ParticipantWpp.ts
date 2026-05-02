export class ParticipantWpp {
  constructor(
    public readonly id: string,
    public readonly whatsappRegistry: string,
    public readonly cellphone: string,
    public readonly jid: string | null,
    public readonly lid: string | null,
    public readonly infoName: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}
