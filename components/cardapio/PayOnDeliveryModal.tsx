"use client";

import { useEffect, useState } from "react";
import type { PaymentMethod } from "@/types/database";
import { PAYMENT_METHOD_SHORT } from "@/lib/payments/methods";
import {
  calculateChangeAmount,
  formatMoneyInput,
  parseMoneyInput,
} from "@/lib/payments/cash-change";

function fmt(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type CashMode = "exact" | "change";

export default function PayOnDeliveryModal({
  open,
  paymentMethod,
  total,
  brand,
  processing,
  onConfirm,
  onClose,
}: {
  open: boolean;
  paymentMethod: PaymentMethod;
  total: number;
  brand: string;
  processing?: boolean;
  onConfirm: (cashTenderAmount?: number) => void;
  onClose: () => void;
}) {
  const isCash = paymentMethod === "cash";
  const [cashMode, setCashMode] = useState<CashMode>("exact");
  const [tenderInput, setTenderInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCashMode("exact");
    setTenderInput("");
    setError(null);
  }, [open, paymentMethod]);

  if (!open) return null;

  const tenderAmount =
    isCash && cashMode === "change" ? parseMoneyInput(tenderInput) : total;
  const changeAmount =
    isCash && cashMode === "change" && tenderAmount >= total
      ? calculateChangeAmount(tenderAmount, total)
      : isCash && cashMode === "exact"
        ? 0
        : null;

  function handleConfirm() {
    if (!isCash) {
      onConfirm();
      return;
    }

    if (cashMode === "exact") {
      onConfirm(total);
      return;
    }

    const tender = parseMoneyInput(tenderInput);
    if (tender <= 0) {
      setError("Informe com quanto você vai pagar.");
      return;
    }
    if (tender < total) {
      setError(`O valor precisa ser pelo menos ${fmt(total)}.`);
      return;
    }
    onConfirm(tender);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-t-2xl bg-white sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">Pagamento na entrega</h2>
          <p className="mt-1 text-sm text-gray-600">
            Você pagará com{" "}
            <strong>{PAYMENT_METHOD_SHORT[paymentMethod]}</strong> quando receber o pedido.
          </p>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {paymentMethod === "cash" && (
              <p>O pagamento em dinheiro é feito na entrega ou na retirada.</p>
            )}
            {paymentMethod === "credit_card" && (
              <p>O cartão de crédito será cobrado na entrega ou na retirada.</p>
            )}
            {paymentMethod === "debit_card" && (
              <p>O cartão de débito será cobrado na entrega ou na retirada.</p>
            )}
            {paymentMethod === "meal_voucher" && (
              <p>O ticket/vale refeição será aceito na entrega ou na retirada.</p>
            )}
          </div>

          <div className="flex justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm">
            <span className="text-gray-600">Total do pedido</span>
            <span className="font-bold text-gray-900">{fmt(total)}</span>
          </div>

          {isCash && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">Pagamento em dinheiro</p>

              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${
                  cashMode === "exact" ? "border-gray-300 bg-gray-50" : "border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="cashMode"
                  checked={cashMode === "exact"}
                  onChange={() => {
                    setCashMode("exact");
                    setError(null);
                  }}
                />
                <span className="text-sm text-gray-800">
                  Pagamento exato — não preciso de troco
                </span>
              </label>

              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${
                  cashMode === "change" ? "border-gray-300 bg-gray-50" : "border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="cashMode"
                  checked={cashMode === "change"}
                  onChange={() => {
                    setCashMode("change");
                    setError(null);
                  }}
                />
                <span className="text-sm text-gray-800">Preciso de troco</span>
              </label>

              {cashMode === "change" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Com quanto você vai pagar?
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={tenderInput}
                    onChange={(e) => {
                      setTenderInput(formatMoneyInput(parseMoneyInput(e.target.value)));
                      setError(null);
                    }}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>
              )}

              {(cashMode === "exact" || (cashMode === "change" && tenderAmount >= total)) && (
                <div className="space-y-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-800">Você vai pagar</span>
                    <span className="font-bold text-green-900">{fmt(tenderAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-green-200 pt-2">
                    <span className="text-green-800">Troco a receber</span>
                    <span className="font-bold text-green-900">
                      {fmt(changeAmount ?? 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
        </div>

        <div className="flex gap-3 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={processing}
            className="flex-1 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60"
            style={{ backgroundColor: brand }}
          >
            {processing ? "Enviando..." : "Confirmar pedido"}
          </button>
        </div>
      </div>
    </div>
  );
}
