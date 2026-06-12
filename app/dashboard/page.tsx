import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import OrdersList from "@/components/dashboard/OrdersList";
import { normalizeOrderRow } from "@/lib/orders/normalize";

export const metadata = {
  title: "Painel — ZapComanda",
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { established?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: establishment } = await supabase
    .schema("zapcomanda")
    .from("establishments")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!establishment) {
    redirect("/onboarding");
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: orders } = await supabase
    .schema("zapcomanda")
    .from("orders")
    .select(
      "id, status, total_amount, created_at, notes, customers(phone, name), order_items(item_name, quantity, subtotal, notes, addons)"
    )
    .eq("establishment_id", establishment.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const todayOrders = (orders || []).filter(
    (o) => new Date(o.created_at) >= todayStart
  );

  const todayRevenue = todayOrders
    .filter((o) => ["paid", "preparing", "delivered"].includes(o.status))
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const activeOrders = (orders || []).filter((o) =>
    ["awaiting_payment", "paid", "preparing"].includes(o.status)
  ).length;

  const justCreated = Boolean(searchParams.established);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader establishmentName={establishment.name} />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        {justCreated && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Estabelecimento criado com sucesso! Configure o webhook do WhatsApp
            apontando para{" "}
            <code className="rounded bg-green-100 px-1">
              /api/webhooks/whatsapp
            </code>
          </div>
        )}

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Faturamento hoje</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {formatCurrency(todayRevenue)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Pedidos ativos</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {activeOrders}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Pedidos hoje</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {todayOrders.length}
            </p>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Pedidos</h2>
          <Link
            href="/onboarding"
            className="text-sm font-medium text-green-600 hover:text-green-700"
          >
            Editar cardápio →
          </Link>
        </div>

        <OrdersList
          establishmentId={establishment.id}
          initialOrders={(orders || []).map((row) => normalizeOrderRow(row))}
        />
      </main>
    </div>
  );
}
