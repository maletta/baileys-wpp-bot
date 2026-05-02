/** Dígitos do número a partir de um JID PN `...@s.whatsapp.net`. */
export function cellphoneDigitsFromPnJid(pnJid: string): string {
  const local = pnJid.split('@')[0] ?? '';
  return local.replace(/\D/g, '');
}

export function isPnJid(jid: string): boolean {
  return jid.endsWith('@s.whatsapp.net');
}

export function isLidJid(jid: string): boolean {
  return jid.endsWith('@lid');
}
