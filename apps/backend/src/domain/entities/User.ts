export enum UserRole {
  HIGH_LEVEL_ADMIN = 'HIGH_LEVEL_ADMIN',
  GROUP_ADMIN = 'GROUP_ADMIN',
  MEMBER = 'MEMBER',
  DEVELOPER = 'DEVELOPER'
}

export class User {
  constructor(
    public readonly id: string,
    public readonly googleId: string,
    public readonly email: string,
    public readonly displayName: string | null,
    public readonly profilePicture: string | null,
    public readonly role: UserRole,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) { }

  public isHighLevelAdmin(): boolean {
    return this.role === UserRole.HIGH_LEVEL_ADMIN;
  }

  public isDeveloper(): boolean {
    return this.role === UserRole.DEVELOPER;
  }

  public canManageConnections(): boolean {
    return this.isHighLevelAdmin() || this.isDeveloper();
  }

  public canManageGroups(): boolean {
    return this.role !== UserRole.MEMBER;
  }
}
