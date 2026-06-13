import { createAdminClient } from "@/lib/supabase/admin";
import { createMonthlySubscription } from "@/lib/asaas/subscriptions";
import { ensureAsaasCustomer } from "@/lib/asaas/customers";
import {
  getPlanDefinition,
  parsePlanExternalReference,
  type PlanDefinition,
} from "@/lib/plans/config";
import type { Establishment, PlanType } from "@/types/database";

export async function activateEstablishmentPlan(
  establishmentId: string,
  plan: PlanType
): Promise<void> {
  const supabase = createAdminClient();

  const { data: establishment, error } = await supabase
    .from("establishments")
    .select("*")
    .eq("id", establishmentId)
    .single();

  if (error || !establishment) {
    throw new Error("Estabelecimento não encontrado");
  }

  const updates: Record<string, unknown> = {
    plan,
    updated_at: new Date().toISOString(),
  };

  if (plan === "pro" && !establishment.asaas_subscription_id) {
    const planDef = getPlanDefinition("pro");
    const customerId =
      establishment.asaas_customer_id ||
      (await ensureAsaasCustomer({
        name: establishment.name,
        phone: establishment.whatsapp_number,
        externalReference: establishment.id,
      }));

    if (!establishment.asaas_customer_id) {
      updates.asaas_customer_id = customerId;
    }

    try {
      const subscription = await createMonthlySubscription({
        customerId,
        value: planDef.price,
        description: `ZapComanda ${planDef.name}`,
        externalReference: `establishment:${establishmentId}`,
      });
      updates.asaas_subscription_id = subscription.id;
    } catch (subError) {
      console.error("Asaas subscription create error (plan still activated):", subError);
    }
  }

  const { error: updateError } = await supabase
    .from("establishments")
    .update(updates)
    .eq("id", establishmentId);

  if (updateError) throw updateError;
}

export async function tryActivatePlanFromPayment(
  externalReference: unknown
): Promise<boolean> {
  if (typeof externalReference !== "string") return false;

  const parsed = parsePlanExternalReference(externalReference);
  if (!parsed) return false;

  await activateEstablishmentPlan(parsed.establishmentId, parsed.plan);
  return true;
}

export function establishmentPlanSummary(establishment: Establishment): {
  current: PlanDefinition;
  canUpgrade: boolean;
  upgradeTarget: PlanDefinition | null;
} {
  const current = getPlanDefinition(establishment.plan);
  const canUpgrade = establishment.plan === "basic";
  const upgradeTarget = canUpgrade ? getPlanDefinition("pro") : null;

  return { current, canUpgrade, upgradeTarget };
}
