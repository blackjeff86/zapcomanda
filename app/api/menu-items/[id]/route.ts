import { NextRequest, NextResponse } from "next/server";
import { getEstablishmentForApi } from "@/lib/api/establishment-access";
import { normalizeMenuItemRow } from "@/lib/menu/types";
import { resolveMenuItemIsDaily } from "@/lib/plans/features";
import { createAdminClient } from "@/lib/supabase/admin";
import { menuItemSchema } from "@/lib/validations/onboarding";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const patchSchema = menuItemSchema.partial().extend({
  is_active: z.boolean().optional(),
  is_daily: z.boolean().optional(),
});

const MENU_SELECT = "*, menu_item_addons(*)";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const access = await getEstablishmentForApi();

    if (!access) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    if (access.devMock) {
      return NextResponse.json({ ok: true, id: params.id, ...parsed.data });
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.description !== undefined)
      updates.description = parsed.data.description || null;
    if (parsed.data.price !== undefined) updates.price = parsed.data.price;
    if (parsed.data.category !== undefined) updates.category = parsed.data.category;
    if (parsed.data.photo_url !== undefined)
      updates.photo_url = parsed.data.photo_url || null;
    if (parsed.data.is_active !== undefined) updates.is_active = parsed.data.is_active;
    if ("combo_partner_id" in parsed.data) updates.combo_partner_id = parsed.data.combo_partner_id ?? null;
    if ("combo_price" in parsed.data) updates.combo_price = parsed.data.combo_price ?? null;
    if ("stock_quantity" in parsed.data) updates.stock_quantity = parsed.data.stock_quantity ?? null;
    if ("low_stock_threshold" in parsed.data) updates.low_stock_threshold = parsed.data.low_stock_threshold ?? null;
    if (parsed.data.is_daily !== undefined) {
      if (
        parsed.data.is_daily &&
        !resolveMenuItemIsDaily(
          access.establishment.plan,
          access.establishment.category,
          true
        )
      ) {
        return NextResponse.json(
          { error: "Cardápio do dia é exclusivo do plano Pro" },
          { status: 403 }
        );
      }
      updates.is_daily = resolveMenuItemIsDaily(
        access.establishment.plan,
        access.establishment.category,
        parsed.data.is_daily
      );
    }

    if (access.bypass) {
      const admin = createAdminClient();
      const { data: existing, error: findError } = await admin
        .from("menu_items")
        .select("establishment_id")
        .eq("id", params.id)
        .single();

      if (findError || !existing) {
        return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
      }

      if (existing.establishment_id !== access.establishment.id) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await admin
          .from("menu_items")
          .update(updates)
          .eq("id", params.id);

        if (error) throw error;
      }

      if (parsed.data.addons) {
        await admin.from("menu_item_addons").delete().eq("menu_item_id", params.id);
        const addons = parsed.data.addons.filter((a) => a.name.trim());
        if (addons.length > 0) {
          await admin.from("menu_item_addons").insert(
            addons.map((addon, index) => ({
              menu_item_id: params.id,
              name: addon.name.trim(),
              price: addon.price,
              sort_order: index,
            }))
          );
        }
      }

      const { data: full } = await admin
        .from("menu_items")
        .select(MENU_SELECT)
        .eq("id", params.id)
        .single();

      return NextResponse.json(normalizeMenuItemRow(full as Record<string, unknown>));
    }

    const supabase = await createClient();

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .schema("zapcomanda")
        .from("menu_items")
        .update(updates)
        .eq("id", params.id);

      if (error) throw error;
    }

    if (parsed.data.addons) {
      await supabase
        .schema("zapcomanda")
        .from("menu_item_addons")
        .delete()
        .eq("menu_item_id", params.id);

      const addons = parsed.data.addons.filter((a) => a.name.trim());
      if (addons.length > 0) {
        await supabase.schema("zapcomanda").from("menu_item_addons").insert(
          addons.map((addon, index) => ({
            menu_item_id: params.id,
            name: addon.name.trim(),
            price: addon.price,
            sort_order: index,
          }))
        );
      }
    }

    const { data: full } = await supabase
      .schema("zapcomanda")
      .from("menu_items")
      .select(MENU_SELECT)
      .eq("id", params.id)
      .single();

    return NextResponse.json(normalizeMenuItemRow(full as Record<string, unknown>));
  } catch (error) {
    console.error("Menu item update error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const access = await getEstablishmentForApi();

    if (!access) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (access.devMock) {
      return NextResponse.json({ ok: true });
    }

    if (access.bypass) {
      const admin = createAdminClient();
      const { error } = await admin
        .from("menu_items")
        .update({ is_active: false })
        .eq("id", params.id)
        .eq("establishment_id", access.establishment.id);

      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .schema("zapcomanda")
      .from("menu_items")
      .update({ is_active: false })
      .eq("id", params.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Menu item delete error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
