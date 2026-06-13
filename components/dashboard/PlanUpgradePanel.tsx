"use client";

import { useState } from "react";
import PlanBadge from "@/components/dashboard/PlanBadge";
import { PLANS, type PlanDefinition } from "@/lib/plans/config";
import type { Establishment, PlanType } from "@/types/database";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PlanUpgradePanel({
  establishment,
  devMock = false,
  embedded = false,
}: {
  establishment: Establishment;
  devMock?: boolean;
  embedded?: boolean;
}) {
  const [currentPlan, setCurrentPlan] = useState<PlanType>(establishment.plan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pixData, setPixData] = useState<{
    pix_copy_paste: string;
    amount: number;
    invoice_url: string | null;
  } | null>(null);

  const canUpgrade = currentPlan === "basic";

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setPixData(null);

    try {
      const response = await fetch("/api/plans/upgrade", { method: "POST" });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Erro ao iniciar upgrade");

      if (data.dev_mock) {
        setCurrentPlan("pro");
        setSuccess(data.message || "Plano Pro ativado!");
        return;
      }

      setPixData({
        pix_copy_paste: data.pix_copy_paste,
        amount: data.amount,
        invoice_url: data.invoice_url ?? null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer upgrade");
    } finally {
      setLoading(false);
    }
  }

  async function copyPix() {
    if (!pixData?.pix_copy_paste) return;
    try {
      await navigator.clipboard.writeText(pixData.pix_copy_paste);
      setSuccess("Código Pix copiado!");
    } catch {
      window.prompt("Copie o código Pix:", pixData.pix_copy_paste);
    }
  }

  return (
    <div className={embedded ? "space-y-5" : "space-y-6"}>
      <div className={embedded ? "space-y-4" : "rounded-2xl border border-gray-200 bg-white p-4 sm:p-6"}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">Seu plano atual</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <PlanBadge plan={currentPlan} />
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(PLANS[currentPlan].price)}
                <span className="text-base font-normal text-gray-500">/mês</span>
              </span>
            </div>
          </div>
          {canUpgrade && (
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={loading}
              className="min-h-[48px] rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-brand-dark disabled:opacity-60"
            >
              {loading ? "Preparando..." : "Fazer upgrade para Pro"}
            </button>
          )}
        </div>

        {success && (
          <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            {success}
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {pixData && (
          <div className="mt-4 rounded-xl border border-brand/30 bg-brand-50 p-4">
            <p className="font-semibold text-gray-900">
              Pague {formatCurrency(pixData.amount)} via Pix
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Após o pagamento, o plano Pro é ativado automaticamente em poucos segundos.
            </p>
            <code className="mt-3 block break-all rounded-lg bg-white px-3 py-2 text-xs text-gray-800">
              {pixData.pix_copy_paste}
            </code>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyPix}
                className="min-h-[44px] rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Copiar código Pix
              </button>
              {pixData.invoice_url && (
                <a
                  href={pixData.invoice_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Abrir fatura
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(Object.values(PLANS) as PlanDefinition[]).map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isUpgradeTarget = canUpgrade && plan.id === "pro";

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-5 sm:p-6 ${
                plan.highlighted
                  ? "border-brand bg-white shadow-md ring-2 ring-brand/20"
                  : "border-gray-200 bg-white"
              } ${isCurrent ? "ring-2 ring-brand" : ""}`}
            >
              {plan.badge && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-brand px-3 py-0.5 text-xs font-bold text-white">
                  {plan.badge}
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-2.5 right-4 rounded-full bg-gray-900 px-3 py-0.5 text-xs font-bold text-white">
                  Plano atual
                </span>
              )}

              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="mt-1 text-sm text-gray-600">{plan.description}</p>
              <p className="mt-4 text-3xl font-bold text-gray-900">
                {formatCurrency(plan.price)}
                <span className="text-sm font-normal text-gray-500">/mês</span>
              </p>

              <ul className="mt-4 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-0.5 text-brand">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              {isUpgradeTarget && !pixData && (
                <button
                  type="button"
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="mt-5 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60"
                >
                  {loading ? "Preparando Pix..." : `Upgrade — ${formatCurrency(plan.price)}/mês`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {devMock && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Modo exemplo — o upgrade não cobra de verdade e não persiste no banco até ter um
          estabelecimento real.
        </p>
      )}

      <p className="text-xs text-gray-500">
        Sem fidelidade. Cobrança mensal via Pix (Asaas). Cancele quando quiser pelo suporte.
      </p>
    </div>
  );
}
