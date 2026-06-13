import { getDashboardContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import CustomersTable, { type CustomerWithStats } from "@/components/dashboard/CustomersTable";

export const metadata = {
  title: "Clientes — ZapComanda",
};

const ANON_PHONE = "00000000000";
const SELECT = "id, name, phone, created_at, updated_at, orders(total_amount, status, created_at)";

type OrderRow = { total_amount: number; status: string; created_at: string };
type RawCustomer = {
  id: string;
  name: string | null;
  phone: string;
  created_at: string;
  updated_at: string;
  orders: OrderRow[];
};

function processCustomer(c: RawCustomer): CustomerWithStats {
  const valid = c.orders.filter((o) => o.status !== "cancelled");
  const total_spent = valid.reduce((sum, o) => sum + o.total_amount, 0);
  const timestamps = valid.map((o) => new Date(o.created_at).getTime());
  const last_order_at =
    timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : null;

  let activity: CustomerWithStats["activity"] = "new";
  if (last_order_at) {
    const days = Math.floor((Date.now() - new Date(last_order_at).getTime()) / 86_400_000);
    activity = days <= 30 ? "active" : days <= 60 ? "at_risk" : "dormant";
  }

  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    created_at: c.created_at,
    order_count: valid.length,
    total_spent,
    last_order_at,
    activity,
  };
}

async function fetchCustomers(establishmentId: string, bypassAuth: boolean): Promise<CustomerWithStats[]> {
  try {
    if (bypassAuth) {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("customers")
        .select(SELECT)
        .eq("establishment_id", establishmentId)
        .neq("phone", ANON_PHONE)
        .order("updated_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return ((data ?? []) as RawCustomer[]).map(processCustomer);
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .schema("zapcomanda")
      .from("customers")
      .select(SELECT)
      .eq("establishment_id", establishmentId)
      .neq("phone", ANON_PHONE)
      .order("updated_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return ((data ?? []) as RawCustomer[]).map(processCustomer);
  } catch {
    return [];
  }
}

export default async function ClientesPage() {
  const { bypassAuth, establishment } = await getDashboardContext();
  const customers = await fetchCustomers(establishment.id, bypassAuth);

  const totalSpent = customers.reduce((s, c) => s + c.total_spent, 0);
  const activeCount = customers.filter((c) => c.activity === "active").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Todos os clientes que já compraram no seu estabelecimento
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
          <p className="text-sm text-gray-500">Total de clientes</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{customers.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
          <p className="text-sm text-gray-500">Ativos (últimos 30 dias)</p>
          <p className="mt-1 text-3xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
          <p className="text-sm text-gray-500">Receita total</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalSpent)}
          </p>
        </div>
      </div>

      <CustomersTable customers={customers} />
    </div>
  );
}
