import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeMenuItemRow } from "@/lib/menu/types";
import { createClient } from "@/lib/supabase/server";

const MENU_SELECT = "*, menu_item_addons(*)";

export async function loadMenuItems(establishmentId: string, useAdmin: boolean) {
  if (useAdmin) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("menu_items")
      .select(MENU_SELECT)
      .eq("establishment_id", establishmentId)
      .order("sort_order", { ascending: true });

    return (data ?? []).map((row) =>
      normalizeMenuItemRow(row as Record<string, unknown>)
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .schema("zapcomanda")
    .from("menu_items")
    .select(MENU_SELECT)
    .eq("establishment_id", establishmentId)
    .order("sort_order", { ascending: true });

  return (data ?? []).map((row) =>
    normalizeMenuItemRow(row as Record<string, unknown>)
  );
}
