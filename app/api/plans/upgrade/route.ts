import { NextResponse } from "next/server";
import { getEstablishmentForApi } from "@/lib/api/establishment-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureAsaasCustomer } from "@/lib/asaas/customers";
import { createPixPayment, getPixQrCode } from "@/lib/asaas/client";
import { activateEstablishmentPlan } from "@/lib/plans/activate";
import {
  getPlanDefinition,
  planUpgradeExternalReference,
  PLANS,
} from "@/lib/plans/config";
import type { PlanType } from "@/types/database";

export async function GET() {
  const access = await getEstablishmentForApi();
  if (!access) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const current = getPlanDefinition(access.establishment.plan);

  return NextResponse.json({
    current_plan: access.establishment.plan,
    current,
    plans: PLANS,
    can_upgrade: access.establishment.plan === "basic",
    upgrade_target: access.establishment.plan === "basic" ? PLANS.pro : null,
    has_subscription: Boolean(access.establishment.asaas_subscription_id),
  });
}

export async function POST() {
  try {
    const access = await getEstablishmentForApi();
    if (!access) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const establishment = access.establishment;

    if (establishment.plan === "pro") {
      return NextResponse.json(
        { error: "Você já está no plano Pro" },
        { status: 400 }
      );
    }

    const targetPlan: PlanType = "pro";
    const planDef = getPlanDefinition(targetPlan);

    if (access.devMock) {
      await activateEstablishmentPlan(establishment.id, targetPlan);
      return NextResponse.json({
        ok: true,
        dev_mock: true,
        plan: targetPlan,
        message: "Plano Pro ativado (modo exemplo).",
      });
    }

    const customerId =
      establishment.asaas_customer_id ||
      (await ensureAsaasCustomer({
        name: establishment.name,
        phone: establishment.whatsapp_number,
        externalReference: establishment.id,
      }));

    if (!establishment.asaas_customer_id) {
      const admin = createAdminClient();
      await admin
        .from("establishments")
        .update({ asaas_customer_id: customerId })
        .eq("id", establishment.id);
    }

    const payment = await createPixPayment({
      customerId,
      value: planDef.price,
      description: `ZapComanda ${planDef.name} — mensalidade`,
      externalReference: planUpgradeExternalReference(establishment.id, targetPlan),
    });

    const { payload, encodedImage } = await getPixQrCode(payment.id);

    return NextResponse.json({
      ok: true,
      plan: targetPlan,
      amount: planDef.price,
      pix_copy_paste: payload,
      pix_qr_base64: encodedImage,
      invoice_url: payment.invoiceUrl ?? null,
    });
  } catch (error) {
    console.error("Plan upgrade error:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao iniciar upgrade";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
