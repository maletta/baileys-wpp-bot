/**
 * Resposta automática de teste (texto + botões + lista) para validar UI no WhatsApp.
 * Só corre quando alguém envia a mensagem de texto exactamente `teste-wpp` (grupo ou DM).
 *
 * Remover ou evoluir este ficheiro quando já não for necessário.
 * Desativar em runtime: BAILEYS_INTERACTIVE_PROBE=false
 */
import type { BaileysEventMap, WAMessage, WASocket } from '@whiskeysockets/baileys';
import { extractMessageContent, isJidNewsletter, isJidStatusBroadcast, proto } from '@whiskeysockets/baileys';
import { logger } from '@/shared/utils/logger';

/** Só dispara o probe quando o texto da mensagem for exactamente isto (após trim). */
const PROBE_TRIGGER_TEXT = 'teste-wpp';

const PLAIN_REPLY =
  '[Probe Baileys] Olá — resposta genérica de teste. A seguir tentamos mensagem com botões e lista.';

function probeEnabled(): boolean {
  const v = process.env.BAILEYS_INTERACTIVE_PROBE;
  if (v === undefined || v === '') return true;
  return v !== '0' && v.toLowerCase() !== 'false' && v.toLowerCase() !== 'no';
}

function maskJid(jid: string): string {
  const at = jid.indexOf('@');
  if (at <= 4) return '***';
  return `${jid.slice(0, 4)}***${jid.slice(at)}`;
}

function shouldSkipIncoming(msg: WAMessage): boolean {
  const key = msg.key;
  if (!key?.remoteJid) return true;
  if (key.fromMe) return true;
  if (msg.messageStubType != null) return true;
  const jid = key.remoteJid;
  if (isJidStatusBroadcast(jid)) return true;
  if (isJidNewsletter(jid)) return true;
  return false;
}

/** Texto simples recebido (texto normal ou legenda estendida); vazio se não for mensagem de texto. */
function getIncomingPlainText(msg: WAMessage): string {
  const inner = extractMessageContent(msg.message);
  if (!inner) return '';
  if (inner.conversation) return String(inner.conversation);
  const ext = inner.extendedTextMessage?.text;
  if (typeof ext === 'string') return ext;
  return '';
}

function isProbeTriggerMessage(msg: WAMessage): boolean {
  return getIncomingPlainText(msg).trim() === PROBE_TRIGGER_TEXT;
}

function buildButtonsProbe(): proto.IMessage {
  const BtnType = proto.Message.ButtonsMessage.Button.Type;
  const HeaderType = proto.Message.ButtonsMessage.HeaderType;

  return proto.Message.create({
    buttonsMessage: {
      headerType: HeaderType.EMPTY,
      contentText:
        'Mensagem com *botões* (probe).\nSe não vir botões, o cliente ou política do WhatsApp pode não suportar.',
      footerText: 'Baileys interactive probe — botões',
      buttons: [
        {
          buttonId: 'probe_btn_a',
          buttonText: { displayText: 'Opção A' },
          type: BtnType.RESPONSE
        },
        {
          buttonId: 'probe_btn_b',
          buttonText: { displayText: 'Opção B' },
          type: BtnType.RESPONSE
        }
      ]
    }
  });
}

function buildListProbe(): proto.IMessage {
  const ListType = proto.Message.ListMessage.ListType;

  return proto.Message.create({
    listMessage: {
      title: 'Lista (probe)',
      description: 'Escolha uma linha para testar lista interativa.',
      buttonText: 'Abrir lista',
      listType: ListType.SINGLE_SELECT,
      footerText: 'Baileys interactive probe — lista',
      sections: [
        {
          title: 'Secção',
          rows: [
            {
              rowId: 'probe_row_1',
              title: 'Linha 1',
              description: 'Teste'
            },
            {
              rowId: 'probe_row_2',
              title: 'Linha 2',
              description: 'Teste'
            }
          ]
        }
      ]
    }
  });
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Para cada mensagem recebida (notify) cujo texto é `teste-wpp`, responde no mesmo chat
 * com texto simples e tenta botões + lista via `relayMessage`.
 */
export async function handleMessagesUpsertInteractiveProbe(
  sock: WASocket,
  event: BaileysEventMap['messages.upsert']
): Promise<void> {
  if (!probeEnabled()) return;

  if (event.type !== 'notify') return;

  for (const msg of event.messages) {
    if (shouldSkipIncoming(msg)) continue;
    if (!isProbeTriggerMessage(msg)) continue;

    const jid = msg.key.remoteJid!;
    try {
      await sock.sendMessage(jid, { text: PLAIN_REPLY });

      await delay(350);
      await sock.relayMessage(jid, buildButtonsProbe(), {});

      await delay(350);
      await sock.relayMessage(jid, buildListProbe(), {});

      logger.info('Interactive probe: respostas enviadas', {
        chatKind: jid.endsWith('@g.us') ? 'group' : 'direct',
        remoteJidMasked: maskJid(jid)
      });
    } catch (error) {
      logger.warn('Interactive probe: falha ao responder', {
        remoteJidMasked: maskJid(jid),
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}
