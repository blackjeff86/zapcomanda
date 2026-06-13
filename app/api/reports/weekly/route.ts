import { NextResponse } from "next/server";
import { getEstablishmentForApi } from "@/lib/api/establishment-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isProPlan } from "@/lib/plans/features";

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function dateLabel(d: Date): string {
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

const PAID_STATUSES = ["paid", "preparing", "out_for_delivery", "delivered"];

export async function GET() {
  const access = await getEstablishmentForApi();
  if (!access) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { establishment } = access;

  if (!isProPlan(establishment.plan)) {
    return NextResponse.json({ error: "Recurso exclusivo do plano Pro" }, { status: 403 });
  }

  const today = startOfDay(new Date());
  const weekAgo = addDays(today, -6);

  const ordersQuery = access.bypass
    ? createAdminClient()
        .from("orders")
        .select("id, status, total_amount, payment_method, created_at, order_items(item_name, quantity, subtotal)")
        .eq("establishment_id", establishment.id)
        .gte("created_at", weekAgo.toISOString())
        .order("created_at", { ascending: true })
    : (await createClient())
        .schema("zapcomanda")
        .from("orders")
        .select("id, status, total_amount, payment_method, created_at, order_items(item_name, quantity, subtotal)")
        .eq("establishment_id", establishment.id)
        .gte("created_at", weekAgo.toISOString())
        .order("created_at", { ascending: true });

  const { data: orders, error } = await ordersQuery;

  if (error) {
    console.error("Weekly report error:", error);
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }

  const allOrders = orders ?? [];

  // Build 7-day breakdown
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i - 6);
    return {
      date: day.toISOString().slice(0, 10),
      label: dateLabel(day),
      revenue: 0,
      orders: 0,
    };
  });

  // Payment method counts
  const paymentCounts: Record<string, number> = {};

  // Item frequency map
  const itemMap: Record<string, { name: string; quantity: number; revenue: number }> = {};

  let weekRevenue = 0;
  let weekOrders = 0;
  let paidOrders = 0;

  for (const order of allOrders) {
    weekOrders++;
    const orderDate = order.created_at.slice(0, 10);
    const dayEntry = days.find((d) => d.date === orderDate);
    if (dayEntry) dayEntry.orders++;

    const isPaid = PAID_STATUSES.includes(order.status);

    if (isPaid) {
      const amount = Number(order.total_amount);
      weekRevenue += amount;
      paidOrders++;
      if (dayEntry) dayEntry.revenue += amount;

      if (order.payment_method) {
        paymentCounts[order.payment_method] = (paymentCounts[order.payment_method] ?? 0) + 1;
      }

      const items = (order.order_items as Array<{ item_name: string; quantity: number; subtotal: number }>) ?? [];
      for (const item of items) {
        const key = item.item_name;
        if (!itemMap[key]) itemMap[key] = { name: key, quantity: 0, revenue: 0 };
        itemMap[key].quantity += item.quantity;
        itemMap[key].revenue += Number(item.subtotal);
      }
    }
  }

  const topItems = Object.values(itemMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const avgOrderValue = paidOrders > 0 ? weekRevenue / paidOrders : 0;

  return NextResponse.json({
    week_start: weekAgo.toISOString().slice(0, 10),
    week_end: today.toISOString().slice(0, 10),
    week_revenue: weekRevenue,
    week_orders: weekOrders,
    paid_orders: paidOrders,
    avg_order_value: avgOrderValue,
    days,
    top_items: topItems,
    payment_methods: paymentCounts,
  });
}
