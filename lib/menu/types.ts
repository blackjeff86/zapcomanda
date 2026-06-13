import type { MenuItem, MenuItemAddon } from "@/types/database";

export interface MenuItemWithAddons extends MenuItem {
  addons: MenuItemAddon[];
}

export function normalizeMenuItemRow(
  raw: Record<string, unknown>
): MenuItemWithAddons {
  const addonsRaw = raw.menu_item_addons ?? raw.addons;
  const addons = Array.isArray(addonsRaw) ? addonsRaw : [];

  return {
    id: String(raw.id),
    establishment_id: String(raw.establishment_id),
    name: String(raw.name),
    description: (raw.description as string | null) ?? null,
    price: Number(raw.price),
    photo_url: (raw.photo_url as string | null) ?? null,
    category: String(raw.category),
    is_active: Boolean(raw.is_active),
    is_daily: Boolean(raw.is_daily),
    sort_order: Number(raw.sort_order),
    created_at: String(raw.created_at),
    updated_at: String(raw.updated_at),
    addons: addons.map((a) => ({
      id: String((a as MenuItemAddon).id),
      menu_item_id: String((a as MenuItemAddon).menu_item_id ?? raw.id),
      name: String((a as MenuItemAddon).name),
      price: Number((a as MenuItemAddon).price),
      is_active: Boolean((a as MenuItemAddon).is_active ?? true),
      sort_order: Number((a as MenuItemAddon).sort_order ?? 0),
      created_at: String((a as MenuItemAddon).created_at ?? ""),
      updated_at: String((a as MenuItemAddon).updated_at ?? ""),
    })),
  };
}
