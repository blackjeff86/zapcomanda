import type { MenuItemWithAddons } from "@/lib/menu/types";

export type MenuItemFormState = {
  name: string;
  description: string;
  price: string;
  category: string;
  photo_url: string;
  is_daily: boolean;
  is_combo: boolean;
  combo_partner_id: string;
  combo_price: string;
  addons: Array<{ name: string; price: string }>;
};

export const EMPTY_MENU_ITEM_FORM: MenuItemFormState = {
  name: "",
  description: "",
  price: "",
  category: "Geral",
  photo_url: "",
  is_daily: false,
  is_combo: false,
  combo_partner_id: "",
  combo_price: "",
  addons: [],
};

export function menuItemToFormState(item: MenuItemWithAddons): MenuItemFormState {
  return {
    name: item.name,
    description: item.description ?? "",
    price: String(item.price),
    category: item.category,
    photo_url: item.photo_url ?? "",
    is_daily: item.is_daily,
    is_combo: item.combo_partner_id !== null,
    combo_partner_id: item.combo_partner_id ?? "",
    combo_price: item.combo_price != null ? String(item.combo_price) : "",
    addons: item.addons.map((a) => ({
      name: a.name,
      price: String(a.price),
    })),
  };
}

export function formStateToPayload(form: MenuItemFormState) {
  const comboEnabled = form.is_combo && form.combo_partner_id;
  return {
    name: form.name,
    description: form.description,
    price: Number(form.price),
    category: form.category,
    photo_url: form.photo_url,
    is_daily: form.is_daily,
    combo_partner_id: comboEnabled ? form.combo_partner_id : null,
    combo_price: comboEnabled && form.combo_price ? Number(form.combo_price) : null,
    addons: form.addons
      .filter((a) => a.name.trim())
      .map((a) => ({ name: a.name.trim(), price: Number(a.price) || 0 })),
  };
}

export function mergeDevMockItem(
  item: MenuItemWithAddons,
  form: MenuItemFormState
): MenuItemWithAddons {
  const ts = new Date().toISOString();
  const payload = formStateToPayload(form);

  return {
    ...item,
    name: payload.name,
    description: payload.description || null,
    price: payload.price,
    category: payload.category,
    photo_url: payload.photo_url || null,
    is_daily: payload.is_daily,
    combo_partner_id: payload.combo_partner_id ?? null,
    combo_price: payload.combo_price ?? null,
    is_combo: payload.combo_partner_id != null,
    updated_at: ts,
    addons: payload.addons.map((addon, index) => ({
      id: item.addons[index]?.id ?? `mock-addon-${item.id}-${index}`,
      menu_item_id: item.id,
      name: addon.name,
      price: addon.price,
      is_active: true,
      sort_order: index,
      created_at: item.addons[index]?.created_at ?? ts,
      updated_at: ts,
    })),
  };
}
