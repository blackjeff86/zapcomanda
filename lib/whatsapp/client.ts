type WhatsAppProvider = "evolution" | "zapi";

interface SendTextOptions {
  phone: string;
  message: string;
  instanceId?: string;
}

interface SendButtonsOptions {
  phone: string;
  title: string;
  buttons: Array<{ id: string; label: string }>;
  instanceId?: string;
}

export interface ListRow {
  id: string;
  title: string;
  description?: string;
}

export interface SendListOptions {
  phone: string;
  title: string;
  description: string;
  buttonText: string;
  rows: ListRow[];
  footerText?: string;
  instanceId?: string;
}

function getProvider(): WhatsAppProvider {
  return (process.env.WHATSAPP_PROVIDER as WhatsAppProvider) || "evolution";
}

function normalizePhone(phone: string): string {
  if (phone.includes("@")) return phone;
  return phone.replace(/\D/g, "");
}

async function resolveLid(lid: string, baseUrl: string, apiKey: string, instance: string): Promise<string> {
  try {
    const res = await fetch(`${baseUrl}/contact/findContacts/${instance}`, {
      headers: { apikey: apiKey },
    });
    if (!res.ok) return lid;
    const contacts: Array<Record<string, string>> = await res.json();
    if (!Array.isArray(contacts)) return lid;
    const match = contacts.find((c) => c.id === lid || c.lid === lid);
    if (match?.id && !match.id.endsWith("@lid")) return match.id.split("@")[0];
  } catch {}
  return lid;
}

export async function sendText({
  phone,
  message,
  instanceId,
}: SendTextOptions): Promise<void> {
  const provider = getProvider();
  const normalizedPhone = normalizePhone(phone);

  if (provider === "evolution") {
    const baseUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;
    const instance = instanceId || process.env.EVOLUTION_INSTANCE_NAME;

    if (!baseUrl || !apiKey || !instance) {
      throw new Error("Evolution API não configurada");
    }

    const sendTo = async (number: string) =>
      fetch(`${baseUrl}/message/sendText/${instance}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: apiKey },
        body: JSON.stringify({ number, textMessage: { text: message } }),
      });

    let response = await sendTo(normalizedPhone);

    if (!response.ok && normalizedPhone.endsWith("@lid")) {
      const resolved = await resolveLid(normalizedPhone, baseUrl, apiKey, instance);
      if (resolved !== normalizedPhone) response = await sendTo(resolved);
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Evolution API error: ${error}`);
    }

    return;
  }

  const zapiUrl = process.env.ZAPI_INSTANCE_URL;
  const zapiToken = process.env.ZAPI_TOKEN;

  if (!zapiUrl || !zapiToken) {
    throw new Error("Z-API não configurada");
  }

  const response = await fetch(`${zapiUrl}/send-text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Token": zapiToken,
    },
    body: JSON.stringify({
      phone: normalizedPhone,
      message,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Z-API error: ${error}`);
  }
}

export async function sendButtons({
  phone,
  title,
  buttons,
  instanceId,
}: SendButtonsOptions): Promise<void> {
  const provider = getProvider();
  const normalizedPhone = normalizePhone(phone);

  if (provider === "evolution") {
    const baseUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;
    const instance = instanceId || process.env.EVOLUTION_INSTANCE_NAME;

    if (!baseUrl || !apiKey || !instance) {
      throw new Error("Evolution API não configurada");
    }

    const response = await fetch(
      `${baseUrl}/message/sendButtons/${instance}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
        },
        body: JSON.stringify({
          number: normalizedPhone,
          title,
          buttons: buttons.map((btn) => ({
            buttonId: btn.id,
            buttonText: { displayText: btn.label },
            type: 1,
          })),
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Evolution API error: ${error}`);
    }

    return;
  }

  const zapiUrl = process.env.ZAPI_INSTANCE_URL;
  const zapiToken = process.env.ZAPI_TOKEN;

  if (!zapiUrl || !zapiToken) {
    throw new Error("Z-API não configurada");
  }

  const response = await fetch(`${zapiUrl}/send-button-list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Token": zapiToken,
    },
    body: JSON.stringify({
      phone: normalizedPhone,
      message: title,
      buttonList: {
        buttons: buttons.map((btn) => ({
          id: btn.id,
          label: btn.label,
        })),
      },
    }),
  });

  if (!response.ok) {
    const list = buttons.map((btn, index) => `${index + 1}. ${btn.label}`).join("\n");
    await sendText({
      phone: normalizedPhone,
      message: `${title}\n\n${list}`,
      instanceId,
    });
  }
}

export async function sendList({
  phone,
  title,
  description,
  buttonText,
  rows,
  footerText,
  instanceId,
}: SendListOptions): Promise<void> {
  const provider = getProvider();
  const normalizedPhone = normalizePhone(phone);

  if (provider === "evolution") {
    const baseUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;
    const instance = instanceId || process.env.EVOLUTION_INSTANCE_NAME;

    if (!baseUrl || !apiKey || !instance) {
      throw new Error("Evolution API não configurada");
    }

    const response = await fetch(
      `${baseUrl}/message/sendList/${instance}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
        },
        body: JSON.stringify({
          number: normalizedPhone,
          title,
          description,
          buttonText,
          footerText: footerText || "ZapComanda",
          sections: [
            {
              title: "Opções",
              rows: rows.map((row) => ({
                title: row.title.slice(0, 24),
                description: (row.description || "").slice(0, 72),
                rowId: row.id,
              })),
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Evolution API error: ${error}`);
    }

    return;
  }

  const zapiUrl = process.env.ZAPI_INSTANCE_URL;
  const zapiToken = process.env.ZAPI_TOKEN;

  if (!zapiUrl || !zapiToken) {
    throw new Error("Z-API não configurada");
  }

  const response = await fetch(`${zapiUrl}/send-option-list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Token": zapiToken,
    },
    body: JSON.stringify({
      phone: normalizedPhone,
      message: title,
      optionList: {
        title: description,
        buttonLabel: buttonText,
        options: rows.map((row) => ({
          id: row.id,
          title: row.title,
          description: row.description || "",
        })),
      },
    }),
  });

  if (!response.ok) {
    const fallback = rows
      .map((row, index) => `${index + 1}. ${row.title}${row.description ? ` — ${row.description}` : ""}`)
      .join("\n");

    await sendText({
      phone: normalizedPhone,
      message: `${title}\n\n${description}\n\n${fallback}`,
      instanceId,
    });
  }
}
