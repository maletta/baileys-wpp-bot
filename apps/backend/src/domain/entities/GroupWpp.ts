export class GroupWpp {
  constructor(
    public readonly id: string,
    public readonly whatsappRegistry: string,
    public readonly name: string,
    public readonly linkedParent: string | null,
    public readonly imageUrl: string | null,
    public readonly notifyNewUserDetail: boolean,
    public readonly onlyRegisteredUserMode: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) { }

  public isCommunityGroup(): boolean {
    return this.linkedParent !== null;
  }

  public shouldNotifyNewUsers(): boolean {
    return this.notifyNewUserDetail;
  }

  public isRestrictedToRegisteredUsers(): boolean {
    return this.onlyRegisteredUserMode;
  }
}
