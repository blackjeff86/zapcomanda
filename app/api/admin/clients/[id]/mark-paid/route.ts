import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isInternalAdminEmail } from "@/lib/admin/auth";
import { planAmount } from "@/lib/admin/plans";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isInternalAdminEmail(user.email)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const nextPeriodEnd = new Date(now);
  nextPeriodEnd.setDate(nextPeriodEnd.getDate() + 30);

  // Mark latest pending/confirmed notification as verified
  const { data: latestNotif } = await admin
    .from("billing_notifications")
    .select("id")
    .eq("establishment_id", params.id)
    .in("status", ["pending", "confirmed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestNotif) {
    await admin
      .from("billing_notifications")
      .update({ status: "verified", verified_at: now.toISOString() })
      .eq("id", latestNotif.id);
  }

  const { data: existingSub } = await admin
    .from("subscriptions")
    .select("id")
    .eq("establishment_id", params.id)
    .maybeSingle();

  if (existingSub) {
    await admin
      .from("subscriptions")
      .update({
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: nextPeriodEnd.toISOString(),
        last_payment_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("establishment_id", params.id);
  } else {
    const { data: est } = await admin
      .from("establishments")
      .select("created_at, plan")
      .eq("id", params.id)
      .maybeSingle();

    const trialEnd = new Date((est?.created_at as string) ?? now);
    trialEnd.setDate(trialEnd.getDate() + 7);

    await admin.from("subscriptions").insert({
      establishment_id: params.id,
      status: "active",
      trial_ends_at: trialEnd.toISOString(),
      current_period_start: now.toISOString(),
      current_period_end: nextPeriodEnd.toISOString(),
      plan_amount: planAmount(est?.plan as string),
      last_payment_at: now.toISOString(),
    });
  }

  return NextResponse.json({ ok: true });
}
