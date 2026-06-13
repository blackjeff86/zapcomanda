import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isInternalAdminEmail } from "@/lib/admin/auth";
import { planAmount } from "@/lib/admin/plans";

const TRIAL_DAYS = 7;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isInternalAdminEmail(user.email)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  const [{ data: establishments }, { data: subscriptions }, { data: notifications }] =
    await Promise.all([
      admin
        .from("establishments")
        .select("id, name, slug, whatsapp_number, created_at, plan")
        .order("created_at", { ascending: false }),
      admin.from("subscriptions").select("*"),
      admin
        .from("billing_notifications")
        .select("id, establishment_id, status, amount, sent_at")
        .order("created_at", { ascending: false }),
    ]);

  if (!establishments) return NextResponse.json([]);

  const subsMap = Object.fromEntries(
    (subscriptions ?? []).map((s) => [s.establishment_id as string, s])
  );

  const latestNotifMap: Record<string, { id: string; status: string; amount: number; sent_at: string }> = {};
  for (const n of notifications ?? []) {
    const eid = n.establishment_id as string;
    if (!latestNotifMap[eid]) {
      latestNotifMap[eid] = n as { id: string; status: string; amount: number; sent_at: string };
    }
  }

  const clients = establishments.map((est) => {
    const sub = subsMap[est.id as string];

    if (!sub) {
      const trialEnd = new Date(est.created_at as string);
      trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
      const trialDaysLeft = Math.ceil(
        (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        ...est,
        subscription_status: trialDaysLeft > 0 ? "trial" : "overdue",
        trial_ends_at: trialEnd.toISOString(),
        trial_days_left: Math.max(trialDaysLeft, 0),
        plan_amount: planAmount(est.plan as string),
        days_overdue: trialDaysLeft >= 0 ? 0 : Math.abs(trialDaysLeft),
        last_payment_at: null as string | null,
        latest_notification: latestNotifMap[est.id as string] ?? null,
      };
    }

    const trialEnd = new Date(sub.trial_ends_at as string);
    const trialDaysLeft = Math.ceil(
      (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    let daysOverdue = 0;
    if (sub.status === "overdue" && sub.current_period_end) {
      daysOverdue = Math.max(
        Math.ceil(
          (now.getTime() - new Date(sub.current_period_end as string).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
        0
      );
    }

    return {
      ...est,
      subscription_status: sub.status as string,
      trial_ends_at: sub.trial_ends_at as string,
      trial_days_left: Math.max(trialDaysLeft, 0),
      plan_amount: Number(sub.plan_amount),
      days_overdue: daysOverdue,
      last_payment_at: sub.last_payment_at as string | null,
      latest_notification: latestNotifMap[est.id as string] ?? null,
    };
  });

  return NextResponse.json(clients);
}
