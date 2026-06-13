import {
  FLOW_STEP_LABELS,
  ORDER_STATUS_UI,
  type OrderStatusUi,
} from "@/lib/orders/status-ui";
import type { OrderStatus } from "@/types/database";

export default function OrderStepper({ status }: { status: OrderStatus }) {
  const ui = ORDER_STATUS_UI[status];
  const currentStep = ui.flowStep;

  if (currentStep === null) {
    return (
      <p className="text-xs leading-snug text-gray-600 sm:text-sm">{ui.explanation}</p>
    );
  }

  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400 sm:text-xs">
        Etapas
      </p>
      <ol className="flex items-center gap-0.5 sm:gap-1">
        {FLOW_STEP_LABELS.map((step, index) => {
          const done = currentStep > step.step;
          const current = currentStep === step.step;

          return (
            <li key={step.step} className="flex min-w-0 flex-1 items-center">
              <div
                className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-md px-1 py-1 sm:px-2 sm:py-1.5 ${
                  current
                    ? "bg-brand-50 ring-1 ring-brand/30"
                    : done
                      ? "bg-green-50"
                      : "bg-white"
                }`}
              >
                {done ? (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-500 text-[10px] text-white sm:h-5 sm:w-5">
                    ✓
                  </span>
                ) : (
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold sm:h-5 sm:w-5 ${
                      current ? "bg-brand text-white" : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step.step}
                  </span>
                )}
                <span
                  className={`truncate text-[10px] font-semibold sm:text-xs ${
                    current ? "text-brand-dark" : done ? "text-green-800" : "text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < FLOW_STEP_LABELS.length - 1 && (
                <span
                  className={`mx-0.5 h-px w-2 shrink-0 sm:w-3 ${
                    done ? "bg-green-300" : "bg-gray-200"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function OrderStatusBanner({ ui }: { ui: OrderStatusUi }) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${ui.badgeClass}`}>
      <p className="text-sm font-semibold leading-snug">{ui.title}</p>
      <p className="mt-0.5 text-xs leading-snug opacity-90">{ui.explanation}</p>
    </div>
  );
}
