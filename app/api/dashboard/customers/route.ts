import { NextResponse } from "next/server";
import { getEstablishmentForApi } from "@/lib/api/establishment-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ANON_PHONE = "00000000000";
const CUSTOMER_SELECT = "id, name, phone, created_at, orders(total_amount, status, created_at)";

type OrderRow = { total_amount: number; status: string; created_at: string };
type CustomerRow = {
  id: string;
  name: string | null;
  phone: string;
  created_at: string;
  orders: OrderRow[];
};

type ActivityStatus = "active" | "at_risk" | "dormant" | "new";

function computeActivity(lastOrderAt: string | null): ActivityStatus {
  if (!lastOrderAt) return "new";
  const days = Math.floor((Date.now() - new Date(lastOrderAt).getTime()) / 86_400_000);
  if (days <= 30) return "active";
  if (days <= 60) return "at_risk";
  return "dormant";
}

function processCustomer(c: CustomerRow) {
  const valid = c.orders.filter((o) => o.status !== "cancelled");
  const total_spent = valid.reduce((sum, o) => sum + o.total_amount, 0);
  const timestamps = valid.map((o) => new Date(o.created_at).getTime());
  const last_order_at =
    timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : null;

  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    created_at: c.created_at,
    order_count: valid.length,
    total_spent,
    last_order_at,
    activity: computeActivity(last_order_at),
  };
}

export async function GET() {
  const access = await getEstablishmentForApi();
  if (!access) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  if (access.devMock) {
    return NextResponse.json({ customers: [] });
  }

  try {
    let rows: CustomerRow[];

    if (access.bypass) {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("customers")
        .select(CUSTOMER_SELECT)
        .eq("establishment_id", access.establishment.id)
        .neq("phone", ANON_PHONE)
        .order("updated_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      rows = (data ?? []) as CustomerRow[];
    } else {
      const supabase = await createClient();
      const { data, error } = await supabase
        .schema("zapcomanda")
        .from("customers")
        .select(CUSTOMER_SELECT)
        .eq("establishment_id", access.establishment.id)
        .neq("phone", ANON_PHONE)
        .order("updated_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      rows = (data ?? []) as CustomerRow[];
    }

    return NextResponse.json({ customers: rows.map(processCustomer) });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
