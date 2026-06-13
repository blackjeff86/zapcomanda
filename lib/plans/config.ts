import type { PlanType } from "@/types/database";

export interface PlanDefinition {
  id: PlanType;
  name: string;
  price: number;
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

function planPrice(envKey: string, fallback: number): number {
  const raw = process.env[envKey];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const PLAN_BASIC_PRICE = planPrice("PLAN_BASIC_PRICE", 49);
export const PLAN_PRO_PRICE = planPrice("PLAN_PRO_PRICE", 79);

export const PLANS: Record<PlanType, PlanDefinition> = {
  basic: {
    id: "basic",
    name: "Básico",
    price: PLAN_BASIC_PRICE,
    description: "Perfeito pra lanchonete que quer organizar o WhatsApp sem complicação.",
    features: [
      "Cardápio ilimitado",
      "1 número de WhatsApp",
      "Bot de pedidos automático",
      "Pix automático",
      "Painel de pedidos em tempo real",
      "Histórico e faturamento do dia",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: PLAN_PRO_PRICE,
    description: "Pra quentinha e marmiteira que precisa de cardápio do dia e mais controle.",
    highlighted: true,
    badge: "Mais popular",
    features: [
      "Tudo do plano Básico",
      "2 números de WhatsApp",
      "Cardápio do dia",
      "Horário de corte de pedidos",
      "Broadcast para clientes",
      "Relatório semanal",
    ],
  },
};

export function getPlanDefinition(plan: PlanType): PlanDefinition {
  return PLANS[plan];
}

export function formatPlanLabel(plan: PlanType): string {
  return PLANS[plan].name;
}

export function planUpgradeExternalReference(
  establishmentId: string,
  targetPlan: PlanType
): string {
  return `plan:${targetPlan}:${establishmentId}`;
}

export function parsePlanExternalReference(ref: string): {
  plan: PlanType;
  establishmentId: string;
} | null {
  const match = ref.match(/^plan:(basic|pro):([0-9a-f-]{36})$/i);
  if (!match) return null;
  return { plan: match[1] as PlanType, establishmentId: match[2] };
}
