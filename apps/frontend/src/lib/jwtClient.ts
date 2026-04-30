/**
 * Decodifica payload JWT (sem verificar assinatura) para checagem de expiração no cliente.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** true se exp (segundos) já passou ou payload inválido */
export function isJwtExpired(token: string, skewSeconds = 60): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  const expMs = payload.exp * 1000;
  return Date.now() >= expMs - skewSeconds * 1000;
}

export function isLikelyJwtString(value: unknown): value is string {
  return typeof value === 'string' && value.split('.').length === 3;
}
