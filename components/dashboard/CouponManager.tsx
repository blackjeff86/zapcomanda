"use client";

import { useCallback, useEffect, useState } from "react";
import {
  formatCouponDiscountLabel,
  isCouponExpired,
} from "@/lib/coupons/apply";
import type { CouponDiscountType, DiscountCoupon } from "@/types/database";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const emptyForm = {
  code: "",
  discount_type: "percent" as CouponDiscountType,
  discount_value: "",
  expires_at: "",
};

export default function CouponManager({ devMock = false }: { devMock?: boolean }) {
  const [coupons, setCoupons] = useState<DiscountCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/coupons");
      if (!res.ok) throw new Error("Erro ao carregar cupons");
      const data = await res.json();
      setCoupons(data);
    } catch {
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          discount_type: form.discount_type,
          discount_value: Number(form.discount_value),
          expires_at: form.expires_at,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar cupom");

      if (devMock) {
        setCoupons((prev) => [data as DiscountCoupon, ...prev]);
      } else {
        await loadCoupons();
      }
      setForm(emptyForm);
      setMessage("Cupom criado! Compartilhe o código com seus clientes.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar cupom");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(coupon: DiscountCoupon) {
    setUpdatingId(coupon.id);
    setError(null);

    try {
      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !coupon.is_active }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao atualizar");
      }

      const updated = await res.json();
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, ...updated } : c))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar cupom");
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeCoupon(id: string) {
    if (!confirm("Remover este cupom? Clientes não poderão usá-lo.")) return;

    setUpdatingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/coupons/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao remover");
      }
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover cupom");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="mt-6 border-t border-gray-100 pt-6">
      <h4 className="font-semibold text-gray-900">Cupons de desconto</h4>
      <p className="mt-1 text-sm text-gray-500">
        Crie códigos promocionais para o cardápio online. O cliente digita o cupom ao
        finalizar o pedido.
      </p>

      {message && (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={handleCreate} className="mt-4 space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-medium text-gray-900">Novo cupom</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Código do cupom
            </label>
            <input
              required
              value={form.code}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  code: e.target.value.toUpperCase().replace(/\s/g, ""),
                }))
              }
              placeholder="Ex: PROMO10"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm uppercase focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tipo de desconto
            </label>
            <select
              value={form.discount_type}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  discount_type: e.target.value as CouponDiscountType,
                  discount_value: "",
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="percent">Percentual (%)</option>
              <option value="fixed">Valor fixo (R$)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {form.discount_type === "percent" ? "Desconto (%)" : "Desconto (R$)"}
            </label>
            <input
              required
              type="number"
              min={form.discount_type === "percent" ? 1 : 0.01}
              max={form.discount_type === "percent" ? 100 : undefined}
              step={form.discount_type === "percent" ? 1 : 0.01}
              value={form.discount_value}
              onChange={(e) => setForm((p) => ({ ...p, discount_value: e.target.value }))}
              placeholder={form.discount_type === "percent" ? "10" : "5.00"}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Válido até
            </label>
            <input
              required
              type="date"
              value={form.expires_at}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setForm((p) => ({ ...p, expires_at: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={creating}
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {creating ? "Criando..." : "Criar cupom"}
        </button>
      </form>

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-gray-500">Carregando cupons...</p>
        ) : coupons.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum cupom criado ainda.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {coupons.map((coupon) => {
              const expired = isCouponExpired(coupon);
              const active = coupon.is_active && !expired;

              return (
                <li
                  key={coupon.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-gray-900">
                        {coupon.code}
                      </span>
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-dark">
                        {formatCouponDiscountLabel(
                          coupon.discount_type,
                          Number(coupon.discount_value)
                        )}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          active
                            ? "bg-green-100 text-green-800"
                            : expired
                              ? "bg-gray-100 text-gray-600"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {active ? "Ativo" : expired ? "Expirado" : "Desativado"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Válido até {fmtDate(coupon.expires_at)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={updatingId === coupon.id || expired}
                      onClick={() => toggleActive(coupon)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {coupon.is_active ? "Desativar" : "Reativar"}
                    </button>
                    <button
                      type="button"
                      disabled={updatingId === coupon.id}
                      onClick={() => removeCoupon(coupon.id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      Remover
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
