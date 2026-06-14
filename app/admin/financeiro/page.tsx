import { requireInternalAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import FinanceiroPanel from "@/components/admin/FinanceiroPanel";

export const metadata = {
  title: "Financeiro — Admin ZapComanda",
};

export default async function FinanceiroPage() {
  await requireInternalAdmin();

  const admin = createAdminClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    { data: subscriptions },
    { data: notifications },
    { data: establishments },
  ] = await Promise.all([
    admin.from("subscriptions").select("establishment_id, status, plan_amount"),
    admin
      .from("billing_notifications")
      .select("id, establishment_id, status, amount, sent_at, created_at")
      .order("sent_at", { ascending: false })
      .limit(100),
    admin.from("establishments").select("id, name, plan"),
  ]);

  const estMap = Object.fromEntries(
    (establishments ?? []).map((e) => [
      e.id as string,
      { name: e.name as string, plan: e.plan as string },
    ])
  );

  const mrr = (subscriptions ?? [])
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + Number(s.plan_amount), 0);

  const overdueTotal = (subscriptions ?? [])
    .filter((s) => s.status === "overdue")
    .reduce((sum, s) => sum + Number(s.plan_amount), 0);

  const receivedThisMonth = (notifications ?? [])
    .filter(
      (n) =>
        n.status === "verified" &&
        new Date(n.sent_at as string) >= startOfMonth
    )
    .reduce((sum, n) => sum + Number(n.amount), 0);

  const pendingVerification = (notifications ?? [])
    .filter((n) => n.status === "confirmed")
    .reduce((sum, n) => sum + Number(n.amount), 0);

  const billings = (notifications ?? []).map((n) => ({
    id: n.id as string,
    establishmentId: n.establishment_id as string,
    establishmentName: estMap[n.establishment_id as string]?.name ?? "—",
    plan: estMap[n.establishment_id as string]?.plan ?? "basic",
    status: n.status as string,
    amount: Number(n.amount),
    sentAt: n.sent_at as string,
  }));

  return (
    <FinanceiroPanel
      stats={{ mrr, receivedThisMonth, pendingVerification, overdueTotal }}
      billings={billings}
    />
  );
}
