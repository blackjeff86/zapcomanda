import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAuthBypassed } from "@/lib/dev-auth";
import { completeOrderDelivery } from "@/lib/orders/complete-delivery";
import { buildOrderStatusUpdate } from "@/lib/orders/select";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/types/database";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum([
    "awaiting_payment",
    "paid",
    "preparing",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ]),
  payment_collected: z.boolean().optional(),
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

    const newStatus = parsed.data.status as OrderStatus;

    if (isAuthBypassed()) {
      if (newStatus === "delivered") {
        await completeOrderDelivery(params.id, {
          paymentCollected: parsed.data.payment_collected,
          confirmedBy: "owner",
        });
        return NextResponse.json({ ok: true });
      }

      if (newStatus === "paid") {
        const { confirmOrderPayment } = await import("@/lib/payments/confirm-order-payment");
        await confirmOrderPayment(params.id);
        return NextResponse.json({ ok: true });
      }

      const admin = createAdminClient();
      const { data: order } = await admin
        .from("orders")
        .select("delivery_token")
        .eq("id", params.id)
        .single();

      const updates = buildOrderStatusUpdate(
        newStatus,
        parsed.data.payment_collected,
        order?.delivery_token
      );

      const { error: updateError } = await admin
        .from("orders")
        .update(updates)
        .eq("id", params.id);

      if (updateError) throw updateError;
      return NextResponse.json({ ok: true });
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
      .select("id, establishment_id, delivery_token")
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

    if (newStatus === "delivered") {
      await completeOrderDelivery(params.id, {
        paymentCollected: parsed.data.payment_collected,
        confirmedBy: "owner",
      });
      return NextResponse.json({ ok: true });
    }

    if (newStatus === "paid") {
      const { confirmOrderPayment } = await import("@/lib/payments/confirm-order-payment");
      await confirmOrderPayment(params.id);
      return NextResponse.json({ ok: true });
    }

    const updates = buildOrderStatusUpdate(
      newStatus,
      parsed.data.payment_collected,
      order.delivery_token
    );

    const { error: updateError } = await supabase
      .schema("zapcomanda")
      .from("orders")
      .update(updates)
      .eq("id", params.id);

    if (updateError) throw updateError;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Order status update error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
