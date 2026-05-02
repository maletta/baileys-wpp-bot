export class ParticipantGroupWpp {
  constructor(
    public readonly id: string,
    public readonly idGroupWpp: string,
    public readonly idParticipantWpp: string,
    public readonly name: string | null,
    public readonly linkedParent: string | null,
    public readonly admin: boolean,
    public readonly deleted: boolean,
    public readonly removedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}
