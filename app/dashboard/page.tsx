import { createAdminClient } from "@/lib/supabase/admin";
import { getDevMockOrders } from "@/lib/dev-mock";
import { getDashboardContext } from "@/lib/dashboard/context";
import { normalizeOrderRow } from "@/lib/orders/normalize";
import { ORDER_LIST_SELECT } from "@/lib/orders/select";
import { createClient } from "@/lib/supabase/server";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import OrdersBoard from "@/components/dashboard/OrdersBoard";
import StatsOverview from "@/components/dashboard/StatsOverview";

const ORDER_SELECT = ORDER_LIST_SELECT;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { established?: string };
}) {
  const { bypassAuth, devMock, establishment } = await getDashboardContext();

  const orders = devMock
    ? getDevMockOrders()
    : await fetchOrders(establishment.id, bypassAuth).then((rows) =>
        rows.map((row) => normalizeOrderRow(row))
      );

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayOrders = orders.filter((o) => new Date(o.created_at) >= todayStart);

  const todayRevenue = todayOrders
    .filter((o) =>
      ["paid", "preparing", "out_for_delivery", "delivered"].includes(o.status)
    )
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const activeOrders = orders.filter((o) =>
    ["awaiting_payment", "paid", "preparing", "out_for_delivery"].includes(o.status)
  ).length;

  const deliveredToday = todayOrders.filter((o) => o.status === "delivered").length;

  const justCreated = Boolean(searchParams.established);

  return (
    <>
      {bypassAuth && !devMock && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Modo desenvolvimento — login desabilitado. Remova{" "}
          <code className="rounded bg-amber-100 px-1">BYPASS_AUTH=true</code> antes do deploy.
        </div>
      )}

      {justCreated && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Estabelecimento criado! Configure o webhook do WhatsApp apontando para{" "}
          <code className="rounded bg-green-100 px-1">/api/webhooks/whatsapp</code>
        </div>
      )}

      <DashboardPageHeader
        title="Painel de pedidos"
        description="Gerencie pedidos recebidos pelo WhatsApp em tempo real."
      />

      <StatsOverview
        todayRevenue={todayRevenue}
        activeOrders={activeOrders}
        todayOrdersCount={todayOrders.length}
        deliveredToday={deliveredToday}
      />

      <OrdersBoard
        establishmentId={establishment.id}
        initialOrders={orders}
        devBypass={bypassAuth}
        devMock={devMock}
      />
    </>
  );
}

async function fetchOrders(establishmentId: string, useAdmin: boolean) {
  if (useAdmin) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("orders")
      .select(ORDER_SELECT)
      .eq("establishment_id", establishmentId)
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  }

  const supabase = await createClient();
  const { data } = await supabase
    .schema("zapcomanda")
    .from("orders")
    .select(ORDER_SELECT)
    .eq("establishment_id", establishmentId)
    .order("created_at", { ascending: false })
    .limit(50);

  return data ?? [];
}
