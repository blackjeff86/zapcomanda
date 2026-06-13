import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEstablishmentForApi } from "@/lib/api/establishment-access";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await getEstablishmentForApi();
  if (!access) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (access.userRole === "caixa") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const admin = createAdminClient();
  const now = new Date();

  const { data: notification } = await admin
    .from("billing_notifications")
    .select("id, establishment_id, amount, status")
    .eq("id", params.id)
    .maybeSingle();

  if (!notification) {
    return NextResponse.json({ error: "Notificação não encontrada" }, { status: 404 });
  }

  if ((notification.establishment_id as string) !== access.establishment.id) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  if (notification.status !== "pending") {
    return NextResponse.json({ error: "Notificação já processada" }, { status: 409 });
  }

  await admin
    .from("billing_notifications")
    .update({ status: "confirmed", confirmed_at: now.toISOString() })
    .eq("id", params.id);

  const nextPeriodEnd = new Date(now);
  nextPeriodEnd.setDate(nextPeriodEnd.getDate() + 30);
  const planAmount = Number(notification.amount);

  const { data: existingSub } = await admin
    .from("subscriptions")
    .select("id")
    .eq("establishment_id", access.establishment.id)
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
      .eq("establishment_id", access.establishment.id);
  } else {
    const trialEnd = new Date(access.establishment.created_at);
    trialEnd.setDate(trialEnd.getDate() + 7);

    await admin.from("subscriptions").insert({
      establishment_id: access.establishment.id,
      status: "active",
      trial_ends_at: trialEnd.toISOString(),
      current_period_start: now.toISOString(),
      current_period_end: nextPeriodEnd.toISOString(),
      plan_amount: planAmount,
      last_payment_at: now.toISOString(),
    });
  }

  return NextResponse.json({ ok: true });
}
