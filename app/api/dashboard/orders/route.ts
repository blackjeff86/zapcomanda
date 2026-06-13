import { NextRequest, NextResponse } from "next/server";
import { getEstablishmentForApi } from "@/lib/api/establishment-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const ANON_PHONE = "00000000000";

const posOrderSchema = z.object({
  customer_name: z.string().trim().optional(),
  customer_phone: z.string().regex(/^\d+$/).optional(),
  items: z
    .array(
      z.object({
        menu_item_id: z.string().uuid(),
        item_name: z.string(),
        quantity: z.number().int().positive(),
        unit_price: z.number().positive(),
        notes: z.string().optional(),
        addons: z
          .array(z.object({ id: z.string(), name: z.string(), price: z.number() }))
          .optional(),
      })
    )
    .min(1, "Adicione pelo menos um item"),
  payment_method: z.enum(["pix", "credit_card", "debit_card", "cash", "meal_voucher"]),
  cash_tender_amount: z.number().optional(),
  delivery_type: z.enum(["local", "pickup", "delivery"]).default("local"),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const access = await getEstablishmentForApi();
  if (!access) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = posOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const { items, payment_method, customer_name, customer_phone, cash_tender_amount, delivery_type, address } =
    parsed.data;

  const orderTypePrefix =
    delivery_type === "local" ? "[Consumo no local]"
    : delivery_type === "pickup" ? "[Retirada]"
    : address ? `[Delivery] ${address}`
    : "[Delivery]";

  const notes = parsed.data.notes
    ? `${orderTypePrefix} ${parsed.data.notes}`
    : orderTypePrefix;

  const total_amount = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const change_amount =
    payment_method === "cash" && cash_tender_amount
      ? Math.max(0, cash_tender_amount - total_amount)
      : null;
  const phone = customer_phone ?? ANON_PHONE;
  const name = customer_name?.trim() || null;

  if (access.devMock) {
    const id = `mock-pos-${Date.now()}`;
    return NextResponse.json(
      { order_id: id, order_ref: id.slice(0, 8).toUpperCase(), total: total_amount },
      { status: 201 }
    );
  }

  try {
    const orderRow = {
      establishment_id: access.establishment.id,
      status: "preparing",
      total_amount,
      delivery_fee: 0,
      discount_amount: 0,
      payment_method,
      payment_collected: true,
      cash_tender_amount: cash_tender_amount ?? null,
      change_amount,
      notes: notes ?? null,
    };

    if (access.bypass) {
      const admin = createAdminClient();

      const { data: customer, error: custErr } = await admin
        .from("customers")
        .upsert(
          { establishment_id: access.establishment.id, phone, name },
          { onConflict: "establishment_id,phone" }
        )
        .select("id")
        .single();
      if (custErr) throw custErr;

      const { data: order, error: orderErr } = await admin
        .from("orders")
        .insert({ ...orderRow, customer_id: customer.id })
        .select("id")
        .single();
      if (orderErr) throw orderErr;

      await admin.from("order_items").insert(
        items.map((item) => ({
          order_id: order.id,
          menu_item_id: item.menu_item_id,
          item_name: item.item_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.unit_price * item.quantity,
          notes: item.notes ?? null,
          addons: item.addons ?? [],
        }))
      );

      const itemIds = items.map((i) => i.menu_item_id);
      const { data: stockRows } = await admin
        .from("menu_items")
        .select("id, stock_quantity")
        .in("id", itemIds)
        .not("stock_quantity", "is", null);
      if (stockRows?.length) {
        const qtyMap: Record<string, number> = {};
        for (const item of items) qtyMap[item.menu_item_id] = (qtyMap[item.menu_item_id] ?? 0) + item.quantity;
        await Promise.all(
          (stockRows as { id: string; stock_quantity: number }[]).map((si) =>
            admin.from("menu_items")
              .update({ stock_quantity: Math.max(0, si.stock_quantity - (qtyMap[si.id] ?? 0)) })
              .eq("id", si.id)
          )
        );
      }

      return NextResponse.json(
        { order_id: order.id, order_ref: order.id.slice(0, 8).toUpperCase(), total: total_amount },
        { status: 201 }
      );
    }

    const supabase = await createClient();

    const { data: customer, error: custErr } = await supabase
      .schema("zapcomanda")
      .from("customers")
      .upsert(
        { establishment_id: access.establishment.id, phone, name },
        { onConflict: "establishment_id,phone" }
      )
      .select("id")
      .single();
    if (custErr) throw custErr;

    const { data: order, error: orderErr } = await supabase
      .schema("zapcomanda")
      .from("orders")
      .insert({ ...orderRow, customer_id: customer.id })
      .select("id")
      .single();
    if (orderErr) throw orderErr;

    await supabase.schema("zapcomanda").from("order_items").insert(
      items.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.unit_price * item.quantity,
        notes: item.notes ?? null,
        addons: item.addons ?? [],
      }))
    );

    const itemIds = items.map((i) => i.menu_item_id);
    const { data: stockRows } = await supabase
      .schema("zapcomanda")
      .from("menu_items")
      .select("id, stock_quantity")
      .in("id", itemIds)
      .not("stock_quantity", "is", null);
    if (stockRows?.length) {
      const qtyMap: Record<string, number> = {};
      for (const item of items) qtyMap[item.menu_item_id] = (qtyMap[item.menu_item_id] ?? 0) + item.quantity;
      await Promise.all(
        (stockRows as { id: string; stock_quantity: number }[]).map((si) =>
          supabase.schema("zapcomanda").from("menu_items")
            .update({ stock_quantity: Math.max(0, si.stock_quantity - (qtyMap[si.id] ?? 0)) })
            .eq("id", si.id)
        )
      );
    }

    return NextResponse.json(
      { order_id: order.id, order_ref: order.id.slice(0, 8).toUpperCase(), total: total_amount },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
