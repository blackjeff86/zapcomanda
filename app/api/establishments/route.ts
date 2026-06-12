import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validations/onboarding";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = onboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Faça login para continuar" },
        { status: 401 }
      );
    }

    const { menu_items, logo_url, ...establishmentData } = parsed.data;

    const { data: establishment, error: establishmentError } = await supabase
      .schema("zapcomanda")
      .from("establishments")
      .insert({
        user_id: user.id,
        name: establishmentData.name,
        whatsapp_number: establishmentData.whatsapp_number.replace(/\D/g, ""),
        category: establishmentData.category,
        primary_color: establishmentData.primary_color,
        logo_url: logo_url || null,
        plan: "basic",
      })
      .select("id")
      .single();

    if (establishmentError) {
      if (establishmentError.code === "23505") {
        return NextResponse.json(
          { error: "Este número de WhatsApp já está cadastrado" },
          { status: 409 }
        );
      }
      throw establishmentError;
    }

    const menuRows = menu_items.map((item, index) => ({
      establishment_id: establishment.id,
      name: item.name,
      description: item.description || null,
      price: item.price,
      category: item.category,
      photo_url: item.photo_url || null,
      is_daily: establishmentData.category === "quentinha",
      sort_order: index,
    }));

    const { data: insertedItems, error: menuError } = await supabase
      .schema("zapcomanda")
      .from("menu_items")
      .insert(menuRows)
      .select("id");

    if (menuError) throw menuError;

    const addonRows = insertedItems.flatMap((inserted, index) => {
      const addons = menu_items[index]?.addons || [];
      return addons
        .filter((addon) => addon.name.trim() && addon.price >= 0)
        .map((addon, addonIndex) => ({
          menu_item_id: inserted.id,
          name: addon.name.trim(),
          price: addon.price,
          sort_order: addonIndex,
        }));
    });

    if (addonRows.length > 0) {
      const { error: addonError } = await supabase
        .schema("zapcomanda")
        .from("menu_item_addons")
        .insert(addonRows);

      if (addonError) throw addonError;
    }

    return NextResponse.json({ id: establishment.id }, { status: 201 });
  } catch (error) {
    console.error("Establishment creation error:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar estabelecimento" },
      { status: 500 }
    );
  }
}
