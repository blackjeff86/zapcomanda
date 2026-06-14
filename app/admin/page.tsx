import { requireInternalAdmin } from "@/lib/admin/auth";
import { planAmount } from "@/lib/admin/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import DashboardPanel from "@/components/admin/DashboardPanel";

export const metadata = {
  title: "Dashboard — Admin ZapComanda",
};

const TRIAL_DAYS = 7;

export default async function AdminDashboardPage() {
  await requireInternalAdmin();

  const admin = createAdminClient();
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    { data: establishments },
    { data: subscriptions },
    { data: recentSignups },
    { data: recentNotifications },
  ] = await Promise.all([
    admin.from("establishments").select("id, created_at, plan"),
    admin.from("subscriptions").select("establishment_id, status, plan_amount"),
    admin
      .from("establishments")
      .select("id, created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true }),
    admin
      .from("billing_notifications")
      .select("id, establishment_id, status, amount, sent_at")
      .order("sent_at", { ascending: false })
      .limit(8),
  ]);

  const subsMap = Object.fromEntries(
    (subscriptions ?? []).map((s) => [s.establishment_id as string, s])
  );

  let total = 0;
  let trial = 0;
  let active = 0;
  let overdue = 0;
  let mrr = 0;

  for (const est of establishments ?? []) {
    total++;
    const sub = subsMap[est.id as string];

    if (!sub) {
      const trialEnd = new Date(est.created_at as string);
      trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft > 0) trial++;
      else overdue++;
    } else {
      if (sub.status === "active") {
        active++;
        mrr += Number(sub.plan_amount) || planAmount(est.plan as string);
      } else if (sub.status === "trial") {
        trial++;
      } else if (sub.status === "overdue") {
        overdue++;
      }
    }
  }

  // Build daily chart data for last 30 days
  const dailyMap: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    dailyMap[key] = 0;
  }
  for (const est of recentSignups ?? []) {
    const key = (est.created_at as string).split("T")[0];
    if (key in dailyMap) dailyMap[key]++;
  }
  const chartData = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

  const notifications = (recentNotifications ?? []).map((n) => ({
    id: n.id as string,
    status: n.status as string,
    amount: Number(n.amount),
    sentAt: n.sent_at as string,
    establishmentId: n.establishment_id as string,
  }));

  return (
    <DashboardPanel
      stats={{ total, trial, active, overdue, mrr }}
      chartData={chartData}
      recentNotifications={notifications}
    />
  );
}
