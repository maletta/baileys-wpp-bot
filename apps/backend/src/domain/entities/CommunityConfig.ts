export class CommunityConfig {
  constructor(
    public readonly id: string,
    public readonly groupWppId: string,
    public readonly notificationGroupId: string | null,
    public readonly welcomeMessageTemplate: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) { }

  public hasNotificationGroup(): boolean {
    return this.notificationGroupId !== null;
  }
}
