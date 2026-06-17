import { createHmac } from "crypto";

export const CRM_USERS = [
  { nome: "Jefferson", telefone: "21994622697" },
  { nome: "Deborah",   telefone: "21998081325" },
  { nome: "Gerson",    telefone: "21968890510" },
];

const SECRET = process.env.CRM_SESSION_SECRET ?? "zapcomanda-crm-2025";

export function normalizarTelefone(tel: string): string {
  const digits = tel.replace(/\D/g, "");
  // Remove DDI 55 se presente, pega os últimos 11 dígitos (DDD + número)
  return digits.replace(/^55/, "").slice(-11);
}

export function findCrmUser(telefone: string) {
  const normalized = normalizarTelefone(telefone);
  return CRM_USERS.find((u) => u.telefone === normalized) ?? null;
}

export function criarToken(telefone: string): string {
  const sig = createHmac("sha256", SECRET).update(telefone).digest("hex");
  return Buffer.from(`${telefone}:${sig}`).toString("base64url");
}

export function verificarToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const colonIdx = decoded.lastIndexOf(":");
    if (colonIdx === -1) return null;
    const telefone = decoded.slice(0, colonIdx);
    const sig = decoded.slice(colonIdx + 1);
    const expected = createHmac("sha256", SECRET).update(telefone).digest("hex");
    if (sig !== expected) return null;
    return telefone;
  } catch {
    return null;
  }
}
