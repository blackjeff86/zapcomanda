"use client";

import type { MenuItemFormState } from "@/lib/menu/form";
import ImageUpload from "@/components/ui/ImageUpload";

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
}: MenuItemFormProps) {
  function updateField<K extends keyof MenuItemFormState>(
    key: K,
    value: MenuItemFormState[K]
  ) {
    onChange({ ...form, [key]: value });
  }

  function addAddon() {
    onChange({
      ...form,
      addons: [...form.addons, { name: "", price: "" }],
    });
  }

  function updateAddon(index: number, field: "name" | "price", value: string) {
    const addons = [...form.addons];
    addons[index] = { ...addons[index], [field]: value };
    onChange({ ...form, addons });
  }

  function removeAddon(index: number) {
    onChange({
      ...form,
      addons: form.addons.filter((_, i) => i !== index),
    });
  }

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
                  Item aparece nas opções de quentinha/marmita do dia no WhatsApp.
                </span>
              </span>
            </label>
          </div>
        )}
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
