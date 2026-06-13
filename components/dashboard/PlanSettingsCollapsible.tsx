"use client";

import { useEffect, useState } from "react";
import PlanBadge from "@/components/dashboard/PlanBadge";
import PlanUpgradePanel from "@/components/dashboard/PlanUpgradePanel";
import { PLANS } from "@/lib/plans/config";
import type { Establishment } from "@/types/database";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PlanSettingsCollapsible({
  establishment,
  devMock = false,
}: {
  establishment: Establishment;
  devMock?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (window.location.hash === "#plano") {
      setOpen(true);
    }
  }, []);

  const plan = PLANS[establishment.plan];

  return (
    <section
      id="plano"
      className="scroll-mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full min-h-[56px] items-center justify-between gap-3 px-4 py-4 text-left sm:px-6"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">Plano e cobrança</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PlanBadge plan={establishment.plan} compact />
            <span className="text-sm text-gray-600">
              {formatCurrency(plan.price)}/mês
            </span>
          </div>
        </div>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600 transition ${
            open ? "rotate-180" : ""
          }`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
          <PlanUpgradePanel
            establishment={establishment}
            devMock={devMock}
            embedded
          />
        </div>
      )}
    </section>
  );
}
