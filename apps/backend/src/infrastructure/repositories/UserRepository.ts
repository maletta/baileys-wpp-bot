import { PrismaClient } from '@prisma/client';
import { User, UserRole } from '@/domain/entities/User';
import { IUserRepository, CreateUserData, UpdateUserData } from '@/domain/interfaces/repositories/IUserRepository';

export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });

    return user ? this.mapToEntity(user) : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { googleId }
    });

    return user ? this.mapToEntity(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    return user ? this.mapToEntity(user) : null;
  }

  async create(userData: CreateUserData): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        googleId: userData.googleId,
        email: userData.email,
        displayName: userData.displayName || null,
        profilePicture: userData.profilePicture || null,
        role: (userData.role as UserRole) || UserRole.MEMBER
      }
    });

    return this.mapToEntity(user);
  }

  async update(id: string, userData: Partial<UpdateUserData>): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        googleId: userData.googleId,
        displayName: userData.displayName,
        profilePicture: userData.profilePicture,
        role: userData.role as UserRole
      }
    });

    return this.mapToEntity(user);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id }
    });
  }

  private mapToEntity(userData: any): User {
    return new User(
      userData.id,
      userData.googleId,
      userData.email,
      userData.displayName,
      userData.profilePicture,
      userData.role as UserRole,
      userData.createdAt,
      userData.updatedAt
    );
  }
}
