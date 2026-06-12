import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/types/database";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum([
    "awaiting_payment",
    "paid",
    "preparing",
    "delivered",
    "cancelled",
  ]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const parsed = statusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Status inválido" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data: order, error: orderError } = await supabase
      .schema("zapcomanda")
      .from("orders")
      .select("id, establishment_id")
      .eq("id", params.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    const { data: establishment, error: establishmentError } = await supabase
      .schema("zapcomanda")
      .from("establishments")
      .select("user_id")
      .eq("id", order.establishment_id)
      .single();

    if (establishmentError || !establishment) {
      return NextResponse.json({ error: "Estabelecimento não encontrado" }, { status: 404 });
    }

    if (establishment.user_id !== user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .schema("zapcomanda")
      .from("orders")
      .update({ status: parsed.data.status as OrderStatus })
      .eq("id", params.id);

    if (updateError) throw updateError;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Order status update error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
