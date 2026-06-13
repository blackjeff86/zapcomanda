export function calculateChangeAmount(tenderAmount: number, orderTotal: number): number {
  return Math.round((tenderAmount - orderTotal) * 100) / 100;
}

export function parseMoneyInput(value: string): number {
  const digits = value.replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits) / 100;
}

export function formatMoneyInput(value: number): string {
  if (!value || value <= 0) return "";
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
