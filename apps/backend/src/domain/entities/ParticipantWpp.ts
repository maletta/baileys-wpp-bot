export class ParticipantWpp {
  constructor(
    public readonly id: string,
    public readonly whatsappRegistry: string,
    public readonly cellphone: string,
    public readonly infoName: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) { }

  public getDisplayName(): string {
    return this.infoName || this.cellphone;
  }

  public getFormattedPhone(): string {
    // Remove WhatsApp suffix and format phone
    return this.whatsappRegistry.replace('@s.whatsapp.net', '');
  }

  public static extractPhoneFromRegistry(whatsappRegistry: string): string {
    return whatsappRegistry.split('@')[0];
  }
}
