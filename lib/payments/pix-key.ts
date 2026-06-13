import { z } from "zod";

export const PIX_KEY_TYPES = [
  "cpf",
  "cnpj",
  "email",
  "phone",
  "random",
] as const;

export type PixKeyType = (typeof PIX_KEY_TYPES)[number];

export const PIX_KEY_TYPE_LABELS: Record<PixKeyType, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  email: "E-mail",
  phone: "Celular",
  random: "Chave aleatória",
};

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizePixKey(type: PixKeyType, key: string): string {
  const trimmed = key.trim();
  if (type === "phone" || type === "cpf" || type === "cnpj") {
    return digitsOnly(trimmed);
  }
  if (type === "email") return trimmed.toLowerCase();
  return trimmed;
}

export function validatePixKey(type: PixKeyType, key: string): boolean {
  const normalized = normalizePixKey(type, key);
  if (!normalized) return false;

  switch (type) {
    case "cpf":
      return normalized.length === 11;
    case "cnpj":
      return normalized.length === 14;
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
    case "phone":
      const phone = normalized.startsWith("55") ? normalized : `55${normalized}`;
      return phone.length >= 12 && phone.length <= 13;
    case "random":
      return normalized.length >= 8 && normalized.length <= 77;
    default:
      return false;
  }
}

export const pixKeySchema = z
  .object({
    pix_key_type: z.enum(PIX_KEY_TYPES).optional().nullable(),
    pix_key: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const key = data.pix_key?.trim() ?? "";
    if (!key) {
      if (data.pix_key_type) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pix_key"],
          message: "Informe a chave Pix",
        });
      }
      return;
    }
    if (!data.pix_key_type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pix_key_type"],
        message: "Selecione o tipo da chave Pix",
      });
      return;
    }
    if (!validatePixKey(data.pix_key_type, key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pix_key"],
        message: "Chave Pix inválida para o tipo selecionado",
      });
    }
  });

export function formatPixKeyForDisplay(
  type: PixKeyType | null | undefined,
  key: string | null | undefined
): string | null {
  if (!type || !key?.trim()) return null;
  const normalized = normalizePixKey(type, key);
  if (type === "phone" && normalized.length >= 10) {
    const withCountry = normalized.startsWith("55") ? normalized : `55${normalized}`;
    return `+${withCountry}`;
  }
  if (type === "cpf" && normalized.length === 11) {
    return normalized.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  if (type === "cnpj" && normalized.length === 14) {
    return normalized.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5"
    );
  }
  return key.trim();
}

export function buildPixPaymentInstructions(
  type: PixKeyType,
  key: string,
  amount: number,
  establishmentName: string
): string {
  const display = formatPixKeyForDisplay(type, key) ?? key.trim();
  const amountFormatted = amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    `*Chave Pix (${PIX_KEY_TYPE_LABELS[type]}):*\n` +
    `${display}\n\n` +
    `*Valor:* ${amountFormatted}\n` +
    `*Beneficiário:* ${establishmentName}\n\n` +
    `Copie a chave e pague no app do seu banco. Envie o comprovante se necessário.`
  );
}
