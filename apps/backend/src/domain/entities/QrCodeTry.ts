export class QrCodeTry {
  constructor(
    public readonly id: string,
    public readonly userId: string | null,
    public readonly ipAddress: string | null,
    public readonly createdAt: Date
  ) { }

  public isRecent(minutes: number = 5): boolean {
    const now = new Date();
    const diff = now.getTime() - this.createdAt.getTime();
    return diff < minutes * 60 * 1000;
  }

  public static create(data: {
    id: string;
    userId?: string | null;
    ipAddress?: string | null;
    createdAt?: Date;
  }): QrCodeTry {
    return new QrCodeTry(
      data.id,
      data.userId || null,
      data.ipAddress || null,
      data.createdAt || new Date()
    );
  }
}

