import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  applyCouponToOrder,
  normalizeCouponCode,
} from "@/lib/coupons/apply";
import { generateDirectPixBrCode } from "@/lib/payments/pix-br-code";
import { calculateChangeAmount } from "@/lib/payments/cash-change";
import type { DiscountCoupon, PixKeyType } from "@/types/database";

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
  coupon_code: z.string().optional(),
  cash_tender_amount: z.number().min(0).optional(),
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
      .select("id, name, delivery_fee_enabled, delivery_fee_amount, pix_key, pix_key_type, whatsapp_number, is_manually_closed, order_cutoff_time")
      .eq("id", establishment_id)
      .maybeSingle();

    if (!establishment) {
      return NextResponse.json({ error: "Estabelecimento não encontrado" }, { status: 404 });
    }

    if (establishment.is_manually_closed) {
      return NextResponse.json({ error: "Estabelecimento fechado no momento" }, { status: 400 });
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

    let discountAmount = 0;
    let couponId: string | null = null;

    if (parsed.data.coupon_code?.trim()) {
      const code = normalizeCouponCode(parsed.data.coupon_code);
      const { data: coupon, error: couponError } = await admin
        .from("discount_coupons")
        .select("*")
        .eq("establishment_id", establishment_id)
        .eq("code", code)
        .maybeSingle();

      if (couponError) throw couponError;
      if (!coupon) {
        return NextResponse.json({ error: "Cupom não encontrado" }, { status: 400 });
      }

      try {
        const applied = applyCouponToOrder(
          subtotal,
          deliveryFee,
          coupon as DiscountCoupon
        );
        discountAmount = applied.discountAmount;
        couponId = applied.coupon.id;
      } catch (couponErr) {
        const message =
          couponErr instanceof Error ? couponErr.message : "Cupom inválido";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    const total = Math.max(0, subtotal + deliveryFee - discountAmount);

    let cashTenderAmount: number | null = null;
    let changeAmount: number | null = null;

    if (payment_method === "cash") {
      const tender = parsed.data.cash_tender_amount;
      if (tender == null || tender <= 0) {
        return NextResponse.json(
          { error: "Informe o valor em dinheiro para o pagamento" },
          { status: 400 }
        );
      }
      if (tender < total) {
        return NextResponse.json(
          { error: "O valor em dinheiro precisa cobrir o total do pedido" },
          { status: 400 }
        );
      }
      cashTenderAmount = tender;
      changeAmount = calculateChangeAmount(tender, total);
    }

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
        coupon_id: couponId,
        discount_amount: discountAmount,
        cash_tender_amount: cashTenderAmount,
        change_amount: changeAmount,
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

    const { data: stockRows } = await admin
      .schema("zapcomanda")
      .from("menu_items")
      .select("id, stock_quantity")
      .in("id", items.map((i) => i.menu_item_id))
      .not("stock_quantity", "is", null);
    if (stockRows?.length) {
      const qtyMap: Record<string, number> = {};
      for (const item of items) qtyMap[item.menu_item_id] = (qtyMap[item.menu_item_id] ?? 0) + item.quantity;
      await Promise.all(
        (stockRows as { id: string; stock_quantity: number }[]).map((si) =>
          admin.schema("zapcomanda").from("menu_items")
            .update({ stock_quantity: Math.max(0, si.stock_quantity - (qtyMap[si.id] ?? 0)) })
            .eq("id", si.id)
        )
      );
    }

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
        discount_amount: discountAmount,
        coupon_code: couponId ? parsed.data.coupon_code : null,
        payment_method,
        delivery_type: parsed.data.delivery_type,
        status: initialStatus,
        pix_copy_paste: pixCopyPaste,
        cash_tender_amount: cashTenderAmount,
        change_amount: changeAmount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Cardápio order error:", error);
    return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 });
  }
}
