import { type NextRequest, NextResponse } from "next/server";
import { getEstablishmentForApi } from "@/lib/api/establishment-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

function dateLabel(d: Date, totalDays: number): string {
  if (totalDays <= 7) {
    return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
  }
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function detectOrderType(notes: string | null): "local" | "pickup" | "delivery" | "unknown" {
  if (!notes) return "unknown";
  if (notes.startsWith("[Consumo no local]")) return "local";
  if (notes.startsWith("[Retirada]")) return "pickup";
  if (notes.startsWith("[Delivery]")) return "delivery";
  return "unknown";
}

const PAID_STATUSES = ["paid", "preparing", "out_for_delivery", "delivered"];

export async function GET(request: NextRequest) {
  const access = await getEstablishmentForApi();
  if (!access) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { establishment } = access;
  const { searchParams } = new URL(request.url);
  const periodParam = searchParams.get("period") ?? "7";

  const today = startOfDay(new Date());
  let periodStart: Date;
  let totalDays: number;

  if (periodParam === "month") {
    periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
    totalDays = today.getDate();
  } else {
    const days = periodParam === "30" ? 30 : 7;
    totalDays = days;
    periodStart = addDays(today, -(days - 1));
  }

  const ordersQuery = access.bypass
    ? createAdminClient()
        .from("orders")
        .select("id, status, total_amount, payment_method, delivery_fee, notes, created_at, order_items(item_name, quantity, subtotal)")
        .eq("establishment_id", establishment.id)
        .gte("created_at", periodStart.toISOString())
        .order("created_at", { ascending: true })
    : (await createClient())
        .schema("zapcomanda")
        .from("orders")
        .select("id, status, total_amount, payment_method, delivery_fee, notes, created_at, order_items(item_name, quantity, subtotal)")
        .eq("establishment_id", establishment.id)
        .gte("created_at", periodStart.toISOString())
        .order("created_at", { ascending: true });

  const { data: orders, error } = await ordersQuery;

  if (error) {
    console.error("Report error:", error);
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }

  const allOrders = orders ?? [];

  // Build day-by-day breakdown
  const days = Array.from({ length: totalDays }, (_, i) => {
    const day = addDays(periodStart, i);
    return {
      date: day.toISOString().slice(0, 10),
      label: dateLabel(day, totalDays),
      revenue: 0,
      orders: 0,
    };
  });

  const paymentCounts: Record<string, number> = {};
  const itemMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
  const orderTypes = { local: 0, pickup: 0, delivery: 0, unknown: 0 };

  let periodRevenue = 0;
  let periodOrders = 0;
  let paidOrders = 0;
  let cancelledOrders = 0;
  let deliveryRevenue = 0;

  for (const order of allOrders) {
    periodOrders++;
    const orderDate = order.created_at.slice(0, 10);
    const dayEntry = days.find((d) => d.date === orderDate);
    if (dayEntry) dayEntry.orders++;

    if (order.status === "cancelled") {
      cancelledOrders++;
      continue;
    }

    const orderType = detectOrderType(order.notes as string | null);
    orderTypes[orderType]++;

    const isPaid = PAID_STATUSES.includes(order.status);

    if (isPaid) {
      const amount = Number(order.total_amount);
      periodRevenue += amount;
      paidOrders++;
      if (dayEntry) dayEntry.revenue += amount;

      const fee = Number(order.delivery_fee ?? 0);
      deliveryRevenue += fee;

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
    .slice(0, 8);

  const avgOrderValue = paidOrders > 0 ? periodRevenue / paidOrders : 0;
  const conversionRate = periodOrders > 0 ? Math.round((paidOrders / periodOrders) * 100) : 0;
  const dailyAvg = totalDays > 0 ? periodRevenue / totalDays : 0;

  return NextResponse.json({
    period_start: periodStart.toISOString().slice(0, 10),
    period_end: today.toISOString().slice(0, 10),
    total_days: totalDays,
    period_revenue: periodRevenue,
    period_orders: periodOrders,
    paid_orders: paidOrders,
    cancelled_orders: cancelledOrders,
    avg_order_value: avgOrderValue,
    daily_avg: dailyAvg,
    conversion_rate: conversionRate,
    delivery_revenue: deliveryRevenue,
    days,
    top_items: topItems,
    payment_methods: paymentCounts,
    order_types: orderTypes,
  });
}
