/**
 * Normaliza identificador PN para `...@s.whatsapp.net` quando vier só com dígitos
 * (alguns payloads Baileys expõem `phoneNumber` sem sufixo).
 */
export function toPnJidIfPossible(input: string | undefined): string | undefined {
  if (!input) return undefined;
  if (input.endsWith('@s.whatsapp.net')) return input;
  const digits = input.replace(/\D/g, '');
  if (digits.length >= 10) return `${digits}@s.whatsapp.net`;
  return undefined;
}

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
