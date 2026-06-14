/** Escurece um hex #RRGGBB para barras e fundos (amount 0–1). */
export function darkenHex(hex: string, amount = 0.35): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return "#4B2C20";

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  const mix = (channel: number) =>
    Math.max(0, Math.min(255, Math.round(channel * (1 - amount))));

  const toHex = (n: number) => n.toString(16).padStart(2, "0");

  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  if (local.length === 11) {
    return local.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (local.length === 10) {
    return local.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

export function isStoreOpenForOrders(isManuallyClosed: boolean): boolean {
  return !isManuallyClosed;
}
