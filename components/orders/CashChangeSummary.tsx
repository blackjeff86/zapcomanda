function fmt(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CashChangeSummary({
  total,
  cashTenderAmount,
  changeAmount,
  variant = "default",
}: {
  total: number;
  cashTenderAmount: number | null;
  changeAmount: number | null;
  variant?: "default" | "compact";
}) {
  if (cashTenderAmount == null) return null;

  const change = changeAmount ?? 0;
  const isExact = change <= 0;

  if (variant === "compact") {
    return (
      <p className="text-xs text-amber-900">
        {isExact
          ? `Dinheiro — pagamento exato (${fmt(total)})`
          : `Dinheiro — cliente paga ${fmt(cashTenderAmount)} · troco ${fmt(change)}`}
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-semibold">Pagamento em dinheiro na entrega</p>
      {isExact ? (
        <p className="mt-1">Pagamento exato — sem troco ({fmt(total)})</p>
      ) : (
        <div className="mt-2 space-y-1">
          <div className="flex justify-between gap-4">
            <span>Cliente vai pagar</span>
            <span className="font-bold">{fmt(cashTenderAmount)}</span>
          </div>
          <div className="flex justify-between gap-4 border-t border-amber-200 pt-1">
            <span>Troco a devolver</span>
            <span className="font-bold">{fmt(change)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
