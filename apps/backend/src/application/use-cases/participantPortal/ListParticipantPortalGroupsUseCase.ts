import type { PrismaClient } from '@prisma/client';
import { participantIdsFromPortal } from '@/shared/utils/participantPortalAuth';
import type { ParticipantPortalAuthState } from '@/presentation/middlewares/hybridParticipantAuthMiddleware';

export interface ParticipantPortalGroupRow {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
}

export class ListParticipantPortalGroupsUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(auth: ParticipantPortalAuthState): Promise<ParticipantPortalGroupRow[]> {
    const ids = participantIdsFromPortal(auth);
    if (ids.length === 0) {
      return [];
    }

    const memberships = await this.prisma.participantGroupWpp.findMany({
      where: {
        idParticipantWpp: { in: ids },
        deleted: false
      },
      include: {
        group: true
      }
    });

    const map = new Map<string, ParticipantPortalGroupRow>();
    for (const m of memberships) {
      const g = m.group;
      if (!map.has(g.id)) {
        map.set(g.id, {
          id: g.id,
          name: g.name,
          description: g.description ?? null,
          imageUrl: g.imageUrl ?? null
        });
      }
    }

    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt'));
  }
}
