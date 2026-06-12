import type { CartAddon, CartItem } from "@/types/database";

export function addonTotal(addons: CartAddon[] = []): number {
  return addons.reduce((sum, addon) => sum + addon.price, 0);
}

export function lineSubtotal(item: CartItem): number {
  return (item.unitPrice + addonTotal(item.addons)) * item.quantity;
}

export function cartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + lineSubtotal(item), 0);
}

export function formatCartLine(item: CartItem, formatCurrency: (v: number) => string): string {
  let line = `• ${item.quantity}x ${item.name} — ${formatCurrency(lineSubtotal(item))}`;

  if (item.addons && item.addons.length > 0) {
    const addonList = item.addons
      .map((a) => `${a.name} (+${formatCurrency(a.price)})`)
      .join(", ");
    line += `\n   _+ ${addonList}_`;
  }

  if (item.notes) {
    line += `\n   _Obs: ${item.notes}_`;
  }

  return line;
}
