import { NextRequest, NextResponse } from "next/server";
import { getEstablishmentForApi } from "@/lib/api/establishment-access";
import { getDevMockMenuItems } from "@/lib/dev-mock";
import { normalizeMenuItemRow } from "@/lib/menu/types";
import { resolveMenuItemIsDaily } from "@/lib/plans/features";
import { createAdminClient } from "@/lib/supabase/admin";
import { menuItemSchema } from "@/lib/validations/onboarding";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const createMenuItemSchema = menuItemSchema.extend({
  is_daily: z.boolean().optional(),
});

const MENU_SELECT = "*, menu_item_addons(*)";

export async function GET() {
  const access = await getEstablishmentForApi();

  if (!access) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (access.devMock) {
    return NextResponse.json(getDevMockMenuItems());
  }

  try {
    if (access.bypass) {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("menu_items")
        .select(MENU_SELECT)
        .eq("establishment_id", access.establishment.id)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return NextResponse.json(
        (data ?? []).map((row) => normalizeMenuItemRow(row as Record<string, unknown>))
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .schema("zapcomanda")
      .from("menu_items")
      .select(MENU_SELECT)
      .eq("establishment_id", access.establishment.id)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return NextResponse.json(
      (data ?? []).map((row) => normalizeMenuItemRow(row as Record<string, unknown>))
    );
  } catch (error) {
    console.error("Menu items list error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await getEstablishmentForApi();

    if (!access) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createMenuItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    if (parsed.data.is_daily !== undefined && !resolveMenuItemIsDaily(
      access.establishment.plan,
      access.establishment.category,
      parsed.data.is_daily
    ) && parsed.data.is_daily) {
      return NextResponse.json(
        { error: "Cardápio do dia é exclusivo do plano Pro" },
        { status: 403 }
      );
    }

    if (access.devMock) {
      const ts = new Date().toISOString();
      return NextResponse.json(
        normalizeMenuItemRow({
          id: `mock-${Date.now()}`,
          establishment_id: access.establishment.id,
          name: parsed.data.name,
          description: parsed.data.description || null,
          price: parsed.data.price,
          photo_url: parsed.data.photo_url || null,
          category: parsed.data.category,
          is_active: true,
          is_daily: resolveMenuItemIsDaily(
            access.establishment.plan,
            access.establishment.category,
            parsed.data.is_daily
          ),
          combo_partner_id: parsed.data.combo_partner_id ?? null,
          combo_price: parsed.data.combo_price ?? null,
          sort_order: 99,
          created_at: ts,
          updated_at: ts,
          menu_item_addons: (parsed.data.addons ?? []).map((a, i) => ({
            id: `mock-addon-${Date.now()}-${i}`,
            name: a.name,
            price: a.price,
            is_active: true,
            sort_order: i,
          })),
        })
      );
    }

    const itemRow = {
      establishment_id: access.establishment.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      price: parsed.data.price,
      photo_url: parsed.data.photo_url || null,
      category: parsed.data.category,
      is_daily: resolveMenuItemIsDaily(
        access.establishment.plan,
        access.establishment.category,
        parsed.data.is_daily
      ),
      combo_partner_id: parsed.data.combo_partner_id ?? null,
      combo_price: parsed.data.combo_price ?? null,
      sort_order: 99,
    };

    if (access.bypass) {
      const admin = createAdminClient();
      const { data: inserted, error } = await admin
        .from("menu_items")
        .insert(itemRow)
        .select("id")
        .single();

      if (error) throw error;

      const addons = (parsed.data.addons ?? []).filter((a) => a.name.trim());
      if (addons.length > 0) {
        await admin.from("menu_item_addons").insert(
          addons.map((addon, index) => ({
            menu_item_id: inserted.id,
            name: addon.name.trim(),
            price: addon.price,
            sort_order: index,
          }))
        );
      }

      const { data: full } = await admin
        .from("menu_items")
        .select(MENU_SELECT)
        .eq("id", inserted.id)
        .single();

      return NextResponse.json(normalizeMenuItemRow(full as Record<string, unknown>));
    }

    const supabase = await createClient();
    const { data: inserted, error } = await supabase
      .schema("zapcomanda")
      .from("menu_items")
      .insert(itemRow)
      .select("id")
      .single();

    if (error) throw error;

    const addons = (parsed.data.addons ?? []).filter((a) => a.name.trim());
    if (addons.length > 0) {
      await supabase.schema("zapcomanda").from("menu_item_addons").insert(
        addons.map((addon, index) => ({
          menu_item_id: inserted.id,
          name: addon.name.trim(),
          price: addon.price,
          sort_order: index,
        }))
      );
    }

    const { data: full } = await supabase
      .schema("zapcomanda")
      .from("menu_items")
      .select(MENU_SELECT)
      .eq("id", inserted.id)
      .single();

    return NextResponse.json(normalizeMenuItemRow(full as Record<string, unknown>));
  } catch (error) {
    console.error("Menu item create error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
