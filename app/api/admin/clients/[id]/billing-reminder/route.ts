import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isInternalAdminEmail } from "@/lib/admin/auth";
import { planAmount } from "@/lib/admin/plans";
import { generateDirectPixBrCode } from "@/lib/payments/pix-br-code";
import type { PixKeyType } from "@/lib/payments/pix-key";

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

  const pixKey = process.env.ZAPCOMANDA_PIX_KEY;
  const pixKeyType = process.env.ZAPCOMANDA_PIX_KEY_TYPE as PixKeyType | undefined;
  const merchantName = process.env.ZAPCOMANDA_PIX_MERCHANT_NAME ?? "ZapComanda";

  if (!pixKey || !pixKeyType) {
    return NextResponse.json(
      { error: "ZAPCOMANDA_PIX_KEY / ZAPCOMANDA_PIX_KEY_TYPE não configurados" },
      { status: 500 }
    );
  }

  const admin = createAdminClient();

  const { data: establishment } = await admin
    .from("establishments")
    .select("id, name, plan")
    .eq("id", params.id)
    .maybeSingle();

  if (!establishment) {
    return NextResponse.json({ error: "Estabelecimento não encontrado" }, { status: 404 });
  }

  const amount = planAmount(establishment.plan as string);

  let brCode: string;
  try {
    brCode = generateDirectPixBrCode(pixKeyType, pixKey, amount, merchantName);
  } catch {
    return NextResponse.json({ error: "Erro ao gerar código PIX" }, { status: 500 });
  }

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const { data: notification, error } = await admin
    .from("billing_notifications")
    .insert({
      establishment_id: params.id,
      amount,
      pix_key: pixKey,
      pix_key_type: pixKeyType,
      pix_br_code: brCode,
      message: `Olá! Segue o lembrete de cobrança do seu plano ZapComanda no valor de ${fmt(amount)}. Use o PIX abaixo para realizar o pagamento. Após pagar, clique em "Confirmar pagamento".`,
    })
    .select()
    .single();

  if (error) {
    console.error("billing-reminder insert error:", error);
    return NextResponse.json({ error: "Erro ao criar notificação" }, { status: 500 });
  }

  // Ensure subscription record exists and reflects overdue status
  const { data: existingSub } = await admin
    .from("subscriptions")
    .select("id")
    .eq("establishment_id", params.id)
    .maybeSingle();

  if (!existingSub) {
    const { data: est } = await admin
      .from("establishments")
      .select("created_at")
      .eq("id", params.id)
      .maybeSingle();

    const trialEnd = new Date((est?.created_at as string) ?? new Date());
    trialEnd.setDate(trialEnd.getDate() + 7);

    await admin.from("subscriptions").insert({
      establishment_id: params.id,
      status: "overdue",
      plan_amount: amount,
      trial_ends_at: trialEnd.toISOString(),
    });
  } else {
    await admin
      .from("subscriptions")
      .update({ status: "overdue", updated_at: new Date().toISOString() })
      .eq("establishment_id", params.id);
  }

  return NextResponse.json(notification);
}
