export interface IncomingMessage {
  phone: string;
  text: string;
  instanceId?: string;
  buttonId?: string;
  isFromMe: boolean;
  customerName?: string;
}

function extractPhoneFromJid(jid: string): string {
  return jid.split("@")[0].replace(/\D/g, "");
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

/** Normalize Evolution API and Z-API webhook payloads into a common format. */
export function parseWebhookPayload(body: unknown): IncomingMessage | null {
  if (!body || typeof body !== "object") return null;

  const payload = body as Record<string, unknown>;

  // Evolution API — messages.upsert
  if (payload.event === "messages.upsert" && payload.data) {
    const data = payload.data as Record<string, unknown>;
    const key = data.key as Record<string, unknown> | undefined;
    const message = data.message as Record<string, unknown> | undefined;

    if (!key || key.fromMe) return null;

    const remoteJid = key.remoteJid as string;
    // Use full JID for LID-based contacts (@lid), extract number for regular contacts
    const phone = remoteJid.endsWith("@lid") ? remoteJid : extractPhoneFromJid(remoteJid);

    let text = "";
    let buttonId: string | undefined;

    if (message?.conversation) {
      text = String(message.conversation).trim();
    } else if (message?.extendedTextMessage) {
      const ext = message.extendedTextMessage as Record<string, unknown>;
      text = String(ext.text || "").trim();
    } else if (message?.buttonsResponseMessage) {
      const btn = message.buttonsResponseMessage as Record<string, unknown>;
      buttonId = String(btn.selectedButtonId || "");
      text = String(btn.selectedDisplayText || buttonId).trim();
    } else if (message?.listResponseMessage) {
      const list = message.listResponseMessage as Record<string, unknown>;
      const single = list.singleSelectReply as Record<string, unknown> | undefined;
      buttonId = String(single?.selectedRowId || "");
      text = String(list.title || buttonId).trim();
    }

    if (!text && !buttonId) return null;

    const customerName = data.pushName ? String(data.pushName).trim() : undefined;

    return {
      phone,
      text: normalizeText(text),
      buttonId,
      instanceId: String(payload.instance || ""),
      isFromMe: false,
      customerName: customerName || undefined,
    };
  }

  // Z-API — list reply
  if (payload.phone && payload.listResponseMessage) {
    const list = payload.listResponseMessage as Record<string, unknown>;
    const phone = String(payload.phone).replace(/\D/g, "");
    const buttonId = String(list.selectedRowId || list.id || "");
    const text = String(list.title || list.message || buttonId).trim();

    return {
      phone,
      text: normalizeText(text),
      buttonId,
      instanceId: String(payload.instanceId || ""),
      isFromMe: false,
    };
  }

  // Z-API — message received
  if (payload.phone && (payload.text || payload.message)) {
    const phone = String(payload.phone).replace(/\D/g, "");
    const text = String(payload.text || payload.message || "").trim();
    const fromMe = Boolean(payload.fromMe || payload.isFromMe);

    if (fromMe || !text) return null;

    return {
      phone,
      text: normalizeText(text),
      instanceId: String(payload.instanceId || ""),
      isFromMe: false,
    };
  }

  // Z-API — button reply
  if (payload.phone && payload.buttonReply) {
    const reply = payload.buttonReply as Record<string, unknown>;
    const phone = String(payload.phone).replace(/\D/g, "");
    const buttonId = String(reply.buttonId || reply.id || "");
    const text = String(reply.message || buttonId).trim();

    return {
      phone,
      text: normalizeText(text),
      buttonId,
      instanceId: String(payload.instanceId || ""),
      isFromMe: false,
    };
  }

  return null;
}
