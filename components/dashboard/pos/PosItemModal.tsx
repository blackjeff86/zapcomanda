"use client";

import { useState } from "react";

export type PosAddon = { id: string; name: string; price: number };

export type PosMenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  photo_url: string | null;
  category: string;
  is_active: boolean;
  is_combo: boolean;
  combo_partner_id: string | null;
  combo_price: number | null;
  stock_quantity: number | null;
  low_stock_threshold: number | null;
  menu_item_addons: PosAddon[];
};

type Props = {
  item: PosMenuItem;
  partnerName: string | null;
  onClose: () => void;
  onConfirm: (qty: number, notes: string, addons: PosAddon[]) => void;
};

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function PosItemModal({ item, partnerName, onClose, onConfirm }: Props) {
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());

  const isCombo = item.is_combo && item.combo_price != null;
  const basePrice = isCombo ? item.combo_price! : item.price;
  const activeAddons = item.menu_item_addons.filter((a) => selectedAddons.has(a.id));
  const addonTotal = activeAddons.reduce((s, a) => s + a.price, 0);
  const unitTotal = (basePrice + addonTotal) * qty;

  function toggleAddon(id: string) {
    setSelectedAddons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm overflow-y-auto rounded-t-2xl bg-white pb-6 shadow-xl sm:max-h-[90vh] sm:rounded-2xl">
        {/* Photo */}
        {item.photo_url && (
          <img
            src={item.photo_url}
            alt={item.name}
            className="h-36 w-full object-cover"
          />
        )}

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4">
          <div className="min-w-0 flex-1 pr-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="font-semibold text-gray-900">
                {isCombo && partnerName ? `${item.name} + ${partnerName}` : item.name}
              </p>
              {isCombo && (
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                  COMBO
                </span>
              )}
            </div>
            {item.description && (
              <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>
            )}
            <p className="mt-1 text-sm font-bold text-brand">{fmt(basePrice)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4 space-y-4 px-5">
          {/* Addons */}
          {item.menu_item_addons.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Adicionais
              </p>
              <div className="space-y-1.5">
                {item.menu_item_addons.map((addon) => (
                  <label
                    key={addon.id}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-sm transition ${
                      selectedAddons.has(addon.id)
                        ? "border-brand bg-brand/5"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedAddons.has(addon.id)}
                        onChange={() => toggleAddon(addon.id)}
                        className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                      />
                      <span className="text-gray-900">{addon.name}</span>
                    </div>
                    <span className="font-semibold text-brand">+ {fmt(addon.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Observação
            </p>
            <textarea
              rows={2}
              placeholder="Ex: sem cebola, bem passado..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* Quantity */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Quantidade
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                </svg>
              </button>
              <span className="w-8 text-center text-lg font-bold text-gray-900">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-dark"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Confirm */}
          <button
            type="button"
            onClick={() => onConfirm(qty, notes, activeAddons)}
            className="w-full rounded-full bg-brand py-3.5 text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            Adicionar · {fmt(unitTotal)}
          </button>
        </div>
      </div>
    </div>
  );
}
