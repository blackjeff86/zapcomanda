import { createAdminClient } from "@/lib/supabase/admin";
import { sendList } from "@/lib/whatsapp/client";
import type { CartAddon, MenuItemAddon } from "@/types/database";

export async function getMenuItemAddons(menuItemId: string): Promise<MenuItemAddon[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("menu_item_addons")
    .select("*")
    .eq("menu_item_id", menuItemId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data || []) as MenuItemAddon[];
}

export async function sendAddonList(
  phone: string,
  itemName: string,
  addons: MenuItemAddon[],
  selectedAddons: CartAddon[],
  instanceId?: string,
  formatCurrency?: (value: number) => string
): Promise<void> {
  const fmt = formatCurrency || ((v: number) => `R$ ${v.toFixed(2)}`);
  const selectedIds = new Set(selectedAddons.map((a) => a.id));

  const available = addons.filter((a) => !selectedIds.has(a.id));

  const rows = available.map((addon) => ({
    id: `addon:${addon.id}`,
    title: addon.name,
    description: `+${fmt(Number(addon.price))}`,
  }));

  rows.push({
    id: "addon:done",
    title: selectedAddons.length > 0 ? "✅ Pronto, continuar" : "✅ Sem adicionais",
    description: "Ir para o próximo passo",
  });

  const selectedSummary =
    selectedAddons.length > 0
      ? `Selecionados: ${selectedAddons.map((a) => a.name).join(", ")}`
      : "Toque para escolher os adicionais";

  await sendList({
    phone,
    title: `Adicionais — ${itemName}`,
    description: selectedSummary,
    buttonText: "➕ Ver adicionais",
    rows,
    instanceId,
  });
}

export function addonFromId(addonId: string, addons: MenuItemAddon[]): CartAddon | null {
  const addon = addons.find((a) => a.id === addonId);
  if (!addon) return null;
  return {
    id: addon.id,
    name: addon.name,
    price: Number(addon.price),
  };
}
