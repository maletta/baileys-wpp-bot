import type { ParticipantPortalAuthState } from '@/presentation/middlewares/hybridParticipantAuthMiddleware';

export class ParticipantPortalAuthError extends Error {
  constructor(
    message: string,
    readonly statusCode: number = 403
  ) {
    super(message);
    this.name = 'ParticipantPortalAuthError';
  }
}

export function participantIdsFromPortal(auth: ParticipantPortalAuthState | undefined): string[] {
  if (!auth) {
    return [];
  }
  if (auth.kind === 'participant_jwt') {
    return [auth.participantId];
  }
  return auth.participantIds;
}

export function resolveTargetParticipantId(
  auth: ParticipantPortalAuthState,
  queryOrBodyParticipantId?: string
): string {
  if (auth.kind === 'participant_jwt') {
    return auth.participantId;
  }
  const ids = auth.participantIds;
  if (ids.length === 1) {
    return ids[0];
  }
  if (queryOrBodyParticipantId && ids.includes(queryOrBodyParticipantId)) {
    return queryOrBodyParticipantId;
  }
  throw new ParticipantPortalAuthError(
    'Informe o parâmetro participantId quando existem vários participantes vinculados à sua conta.',
    400
  );
}

export function assertParticipantAllowed(
  auth: ParticipantPortalAuthState | undefined,
  participantId: string
): void {
  if (!auth) {
    throw new ParticipantPortalAuthError('Não autenticado', 401);
  }
  if (auth.kind === 'participant_jwt') {
    if (auth.participantId !== participantId) {
      throw new ParticipantPortalAuthError('Participante não autorizado', 403);
    }
    return;
  }
  if (!auth.participantIds.includes(participantId)) {
    throw new ParticipantPortalAuthError('Participante não autorizado', 403);
  }
}
