import { createStaticPix, hasError } from "pix-utils";
import { normalizePixKey, type PixKeyType } from "@/lib/payments/pix-key";

function formatPixKeyForBrCode(type: PixKeyType, key: string): string {
  const normalized = normalizePixKey(type, key);
  if (type === "phone") {
    const withCountry = normalized.startsWith("55") ? normalized : `55${normalized}`;
    return `+${withCountry}`;
  }
  return normalized;
}

function sanitizePixText(value: string, maxLength: number): string {
  const ascii = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim();

  return (ascii.slice(0, maxLength) || "ZapComanda").toUpperCase();
}

export function generateDirectPixBrCode(
  pixKeyType: PixKeyType,
  pixKey: string,
  amount: number,
  establishmentName: string,
  orderRef?: string
): string {
  const ref = orderRef?.trim().slice(0, 25);

  const pix = createStaticPix({
    merchantName: sanitizePixText(establishmentName, 25),
    merchantCity: "BRASIL",
    pixKey: formatPixKeyForBrCode(pixKeyType, pixKey),
    transactionAmount: Math.round(amount * 100) / 100,
    infoAdicional: ref ? `Pedido ${ref}` : undefined,
    txid: ref,
  });

  if (hasError(pix)) {
    throw new Error("Não foi possível gerar o Pix copia e cola");
  }

  return pix.toBRCode();
}
