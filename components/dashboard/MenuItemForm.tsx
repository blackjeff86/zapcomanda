"use client";

import type { MenuItemFormState } from "@/lib/menu/form";
import ImageUpload from "@/components/ui/ImageUpload";

type AvailableItem = { id: string; name: string; price: number };

interface MenuItemFormProps {
  title: string;
  form: MenuItemFormState;
  onChange: (form: MenuItemFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  loading?: boolean;
  error?: string | null;
  submitLabel?: string;
  showDailyToggle?: boolean;
  availableItems?: AvailableItem[];
}

function fmt(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function MenuItemForm({
  title,
  form,
  onChange,
  onSubmit,
  onCancel,
  loading = false,
  error,
  submitLabel = "Salvar",
  showDailyToggle = false,
  availableItems = [],
}: MenuItemFormProps) {
  function updateField<K extends keyof MenuItemFormState>(
    key: K,
    value: MenuItemFormState[K]
  ) {
    onChange({ ...form, [key]: value });
  }

  function addAddon() {
    onChange({ ...form, addons: [...form.addons, { name: "", price: "" }] });
  }

  function updateAddon(index: number, field: "name" | "price", value: string) {
    const addons = [...form.addons];
    addons[index] = { ...addons[index], [field]: value };
    onChange({ ...form, addons });
  }

  function removeAddon(index: number) {
    onChange({ ...form, addons: form.addons.filter((_, i) => i !== index) });
  }

  function toggleCombo(checked: boolean) {
    onChange({
      ...form,
      is_combo: checked,
      combo_partner_id: checked ? form.combo_partner_id : "",
      combo_price: checked ? form.combo_price : "",
    });
  }

  const partnerItem = availableItems.find((i) => i.id === form.combo_partner_id);
  const itemPrice = Number(form.price) || 0;
  const comboPrice = Number(form.combo_price) || 0;
  const normalTotal = partnerItem ? itemPrice + partnerItem.price : 0;
  const savings = normalTotal > 0 && comboPrice > 0 ? normalTotal - comboPrice : 0;

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-medium text-gray-500 hover:text-gray-800"
          >
            Cancelar
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">Nome</label>
          <input
            required
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Preço (R$)</label>
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={form.price}
            onChange={(e) => updateField("price", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Categoria</label>
          <input
            required
            value={form.category}
            onChange={(e) => updateField("category", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">Descrição</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        <div className="sm:col-span-2">
          <ImageUpload
            value={form.photo_url}
            onChange={(url) => updateField("photo_url", url)}
            folder="menu-items"
            label="Foto do item (opcional)"
            hint="JPG, PNG ou WebP · máx. 5 MB"
          />
        </div>

        {showDailyToggle && (
          <div className="sm:col-span-2">
            <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <input
                type="checkbox"
                checked={form.is_daily}
                onChange={(e) => updateField("is_daily", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
              />
              <span>
                <span className="block text-sm font-medium text-gray-900">
                  Incluir no cardápio do dia
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  Item aparece no cardápio do dia no WhatsApp e no cardápio web (o que está disponível hoje).
                </span>
              </span>
            </label>
          </div>
        )}

        <div className="sm:col-span-2">
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={form.is_combo}
                onChange={(e) => toggleCombo(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <span>
                <span className="block text-sm font-medium text-gray-900">
                  Oferecer como combo
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  Cliente pode levar este item + outro produto por um preço especial.
                </span>
              </span>
            </label>

            {form.is_combo && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Segundo produto do combo
                  </label>
                  {availableItems.length === 0 ? (
                    <p className="rounded-lg bg-white px-3 py-2.5 text-sm text-gray-400 border border-gray-200">
                      Adicione outros itens ao cardápio primeiro para poder criar um combo.
                    </p>
                  ) : (
                    <select
                      value={form.combo_partner_id}
                      onChange={(e) => updateField("combo_partner_id", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                    >
                      <option value="">Selecione o produto…</option>
                      {availableItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({fmt(item.price)})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Preço do combo (R$)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Ex: 25.00"
                    value={form.combo_price}
                    onChange={(e) => updateField("combo_price", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                  />
                </div>

                {partnerItem && comboPrice > 0 && (
                  <div className="sm:col-span-2 rounded-lg bg-white border border-orange-100 px-3 py-2.5">
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">{form.name || "Este item"}</span>
                      {" "}({fmt(itemPrice)}) + <span className="font-medium">{partnerItem.name}</span>
                      {" "}({fmt(partnerItem.price)}) ={" "}
                      <span className="line-through text-gray-400">{fmt(normalTotal)}</span>
                      {" → "}
                      <span className="font-bold text-orange-700">Combo {fmt(comboPrice)}</span>
                      {savings > 0 && (
                        <span className="ml-1 text-green-700 font-medium">
                          (cliente economiza {fmt(savings)})
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 sm:col-span-2">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-900">Controle de estoque</p>
          <p className="mt-0.5 text-xs text-gray-500">Deixe em branco para estoque ilimitado.</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Quantidade em estoque
              </label>
              <input
                type="number"
                min={0}
                step={1}
                placeholder="Ilimitado"
                value={form.stock_quantity}
                onChange={(e) => updateField("stock_quantity", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Alerta &quot;Acabando&quot; quando restarem
              </label>
              <input
                type="number"
                min={1}
                step={1}
                placeholder="3"
                value={form.low_stock_threshold}
                onChange={(e) => updateField("low_stock_threshold", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">Adicionais</p>
          <button
            type="button"
            onClick={addAddon}
            className="text-sm font-medium text-brand hover:underline"
          >
            + Adicional
          </button>
        </div>

        {form.addons.length === 0 && (
          <p className="mt-2 text-xs text-gray-400">Sem adicionais neste item.</p>
        )}

        {form.addons.map((addon, index) => (
          <div key={index} className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              placeholder="Nome do adicional"
              value={addon.name}
              onChange={(e) => updateAddon(index, "name", e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Preço"
              value={addon.price}
              onChange={(e) => updateAddon(index, "price", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:w-28"
            />
            <button
              type="button"
              onClick={() => removeAddon(index)}
              className="shrink-0 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Salvando..." : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
