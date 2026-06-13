import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateDirectPixBrCode } from "@/lib/payments/pix-br-code";
import type { PixKeyType } from "@/lib/payments/pix-key";

const orderSchema = z.object({
  establishment_id: z.string().uuid(),
  customer_name: z.string().min(2, "Nome obrigatório"),
  customer_phone: z
    .string()
    .min(10, "WhatsApp inválido")
    .regex(/^\d+$/, "Use apenas números"),
  delivery_type: z.enum(["pickup", "delivery"]),
  address: z.string().optional(),
  payment_method: z.enum(["pix", "credit_card", "debit_card", "cash", "meal_voucher"]),
  items: z
    .array(
      z.object({
        menu_item_id: z.string().uuid(),
        item_name: z.string(),
        quantity: z.number().int().min(1),
        unit_price: z.number().min(0),
        notes: z.string().optional(),
        addons: z
          .array(z.object({ id: z.string(), name: z.string(), price: z.number() }))
          .optional(),
      })
    )
    .min(1, "Adicione ao menos um item"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = orderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }

    const {
      establishment_id,
      customer_name,
      customer_phone,
      delivery_type,
      payment_method,
      items,
    } = parsed.data;

    const admin = createAdminClient();

    const { data: establishment } = await admin
      .schema("zapcomanda")
      .from("establishments")
      .select("id, name, delivery_fee_enabled, delivery_fee_amount, pix_key, pix_key_type, whatsapp_number")
      .eq("id", establishment_id)
      .maybeSingle();

    if (!establishment) {
      return NextResponse.json({ error: "Estabelecimento não encontrado" }, { status: 404 });
    }

    const subtotal = items.reduce(
      (sum, item) =>
        sum +
        item.unit_price * item.quantity +
        (item.addons ?? []).reduce((s, a) => s + a.price * item.quantity, 0),
      0
    );

    const deliveryFee =
      delivery_type === "delivery" && establishment.delivery_fee_enabled
        ? Number(establishment.delivery_fee_amount)
        : 0;

    const total = subtotal + deliveryFee;

    const { data: customer, error: customerError } = await admin
      .schema("zapcomanda")
      .from("customers")
      .upsert(
        { establishment_id, phone: customer_phone, name: customer_name },
        { onConflict: "establishment_id,phone" }
      )
      .select("id")
      .single();

    if (customerError) throw customerError;

    const { data: order, error: orderError } = await admin
      .schema("zapcomanda")
      .from("orders")
      .insert({
        establishment_id,
        customer_id: customer.id,
        status: payment_method === "pix" ? "awaiting_payment" : "preparing",
        total_amount: total,
        payment_method,
        delivery_fee: deliveryFee,
      })
      .select("id, created_at")
      .single();

    if (orderError) throw orderError;

    const orderItemRows = items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      item_name: item.item_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.unit_price * item.quantity,
      notes: item.notes ?? null,
      addons: item.addons ?? [],
    }));

    const { error: itemsError } = await admin
      .schema("zapcomanda")
      .from("order_items")
      .insert(orderItemRows);

    if (itemsError) throw itemsError;

    let pixCopyPaste: string | null = null;

    if (payment_method === "pix") {
      const pixKey = establishment.pix_key as string | null;
      const pixKeyType = establishment.pix_key_type as PixKeyType | null;

      if (pixKey && pixKeyType) {
        const orderRef = order.id.slice(0, 8).toUpperCase();
        pixCopyPaste = generateDirectPixBrCode(
          pixKeyType,
          pixKey,
          total,
          establishment.name,
          orderRef
        );

        await admin
          .schema("zapcomanda")
          .from("payments")
          .insert({
            order_id: order.id,
            establishment_id,
            asaas_payment_id: `direct-pix:${order.id}`,
            amount: total,
            status: "pending",
            pix_copy_paste: pixCopyPaste,
          });
      }
    }

    const initialStatus = payment_method === "pix" ? "awaiting_payment" : "preparing";

    return NextResponse.json(
      {
        order_id: order.id,
        order_ref: order.id.slice(0, 8).toUpperCase(),
        total,
        delivery_fee: deliveryFee,
        payment_method,
        delivery_type: parsed.data.delivery_type,
        status: initialStatus,
        pix_copy_paste: pixCopyPaste,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Cardápio order error:", error);
    return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 });
  }
}
