import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const establishment_id = searchParams.get("establishment_id");
    const phone = searchParams.get("phone");

    if (!establishment_id || !phone) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
    }

    const normalizedPhone = phone.replace(/\D/g, "");
    if (normalizedPhone.length < 10) {
      return NextResponse.json({ error: "Número de WhatsApp inválido" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: customer } = await admin
      .from("customers")
      .select("id")
      .eq("establishment_id", establishment_id)
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (!customer) {
      return NextResponse.json({ orders: [] });
    }

    const { data: orders, error } = await admin
      .from("orders")
      .select(
        "id, status, total_amount, delivery_fee, payment_method, created_at, order_items(item_name, quantity, unit_price, subtotal, notes)"
      )
      .eq("establishment_id", establishment_id)
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json({ orders: orders ?? [] });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
