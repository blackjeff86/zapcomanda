"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OnboardingFormData } from "@/lib/validations/onboarding";

const STEPS = ["Negócio", "Visual", "Cardápio"] as const;

const DEFAULT_MENU_ITEM = {
  name: "",
  description: "",
  price: 0,
  category: "Pratos",
  photo_url: "",
  addons: [] as Array<{ name: string; price: number }>,
};

export default function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<OnboardingFormData>({
    name: "",
    whatsapp_number: "",
    category: "lanchonete",
    primary_color: "#16a34a",
    logo_url: "",
    menu_items: [{ ...DEFAULT_MENU_ITEM }],
  });

  function updateField<K extends keyof OnboardingFormData>(
    key: K,
    value: OnboardingFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateMenuItem(
    index: number,
    field: keyof OnboardingFormData["menu_items"][number],
    value: string | number
  ) {
    setForm((prev) => {
      const items = [...prev.menu_items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, menu_items: items };
    });
  }

  function addMenuItem() {
    setForm((prev) => ({
      ...prev,
      menu_items: [...prev.menu_items, { ...DEFAULT_MENU_ITEM }],
    }));
  }

  function removeMenuItem(index: number) {
    if (form.menu_items.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      menu_items: prev.menu_items.filter((_, i) => i !== index),
    }));
  }

  function addAddonToItem(itemIndex: number) {
    setForm((prev) => {
      const items = [...prev.menu_items];
      items[itemIndex] = {
        ...items[itemIndex],
        addons: [...(items[itemIndex].addons || []), { name: "", price: 0 }],
      };
      return { ...prev, menu_items: items };
    });
  }

  function updateAddon(
    itemIndex: number,
    addonIndex: number,
    field: "name" | "price",
    value: string | number
  ) {
    setForm((prev) => {
      const items = [...prev.menu_items];
      const addons = [...(items[itemIndex].addons || [])];
      addons[addonIndex] = { ...addons[addonIndex], [field]: value };
      items[itemIndex] = { ...items[itemIndex], addons };
      return { ...prev, menu_items: items };
    });
  }

  function removeAddon(itemIndex: number, addonIndex: number) {
    setForm((prev) => {
      const items = [...prev.menu_items];
      items[itemIndex] = {
        ...items[itemIndex],
        addons: (items[itemIndex].addons || []).filter((_, i) => i !== addonIndex),
      };
      return { ...prev, menu_items: items };
    });
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/establishments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar estabelecimento");
      }

      router.push(`/dashboard?established=${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        {STEPS.map((label, index) => (
          <div key={label} className="flex flex-1 items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                index <= step
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {index + 1}
            </div>
            <span
              className={`ml-2 hidden text-sm sm:inline ${
                index <= step ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {label}
            </span>
            {index < STEPS.length - 1 && (
              <div
                className={`mx-3 h-0.5 flex-1 ${
                  index < step ? "bg-green-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {step === 0 && (
        <div className="space-y-5">
          <h2 className="text-xl font-semibold text-gray-900">
            Dados do estabelecimento
          </h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nome do negócio
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Ex: Lanchonete da Maria"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Número do WhatsApp
            </label>
            <input
              type="tel"
              value={form.whatsapp_number}
              onChange={(e) => updateField("whatsapp_number", e.target.value)}
              placeholder="Ex: 5511999999999"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Número que receberá os pedidos via bot
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Categoria
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["lanchonete", "quentinha"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => updateField("category", cat)}
                  className={`rounded-lg border-2 px-4 py-3 text-left transition ${
                    form.category === cat
                      ? "border-green-600 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="font-medium capitalize">{cat}</span>
                  <p className="mt-1 text-xs text-gray-500">
                    {cat === "lanchonete"
                      ? "Cardápio fixo com categorias"
                      : "Cardápio do dia (Plano Pro)"}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <h2 className="text-xl font-semibold text-gray-900">
            Identidade visual
          </h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Cor principal
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.primary_color}
                onChange={(e) => updateField("primary_color", e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border border-gray-300"
              />
              <input
                type="text"
                value={form.primary_color}
                onChange={(e) => updateField("primary_color", e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              URL do logo (opcional)
            </label>
            <input
              type="url"
              value={form.logo_url}
              onChange={(e) => updateField("logo_url", e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div
            className="rounded-xl border p-6 text-center"
            style={{ borderColor: form.primary_color }}
          >
            {form.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.logo_url}
                alt="Logo preview"
                className="mx-auto mb-3 h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div
                className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white"
                style={{ backgroundColor: form.primary_color }}
              >
                {form.name.charAt(0).toUpperCase() || "Z"}
              </div>
            )}
            <p className="font-semibold" style={{ color: form.primary_color }}>
              {form.name || "Seu negócio"}
            </p>
            <p className="text-sm text-gray-500">Preview do bot WhatsApp</p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Cardápio</h2>
            <button
              type="button"
              onClick={addMenuItem}
              className="text-sm font-medium text-green-600 hover:text-green-700"
            >
              + Adicionar item
            </button>
          </div>

          {form.menu_items.map((item, index) => (
            <div
              key={index}
              className="space-y-3 rounded-xl border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">
                  Item {index + 1}
                </span>
                {form.menu_items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMenuItem(index)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remover
                  </button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateMenuItem(index, "name", e.target.value)}
                  placeholder="Nome do item"
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <input
                  type="text"
                  value={item.category}
                  onChange={(e) =>
                    updateMenuItem(index, "category", e.target.value)
                  }
                  placeholder="Categoria"
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>

              <textarea
                value={item.description}
                onChange={(e) =>
                  updateMenuItem(index, "description", e.target.value)
                }
                placeholder="Descrição (opcional)"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.price || ""}
                  onChange={(e) =>
                    updateMenuItem(index, "price", parseFloat(e.target.value) || 0)
                  }
                  placeholder="Preço (R$)"
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <input
                  type="url"
                  value={item.photo_url}
                  onChange={(e) =>
                    updateMenuItem(index, "photo_url", e.target.value)
                  }
                  placeholder="URL da foto (opcional)"
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>

              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    Adicionais com preço (opcional)
                  </p>
                  <button
                    type="button"
                    onClick={() => addAddonToItem(index)}
                    className="text-xs font-medium text-green-600 hover:text-green-700"
                  >
                    + Adicional
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Ex: Bacon R$3, Ovo R$2 — o cliente escolhe no WhatsApp e o valor soma automaticamente.
                </p>

                {(item.addons || []).map((addon, addonIndex) => (
                  <div key={addonIndex} className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={addon.name}
                      onChange={(e) =>
                        updateAddon(index, addonIndex, "name", e.target.value)
                      }
                      placeholder="Nome (ex: Bacon)"
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={addon.price || ""}
                      onChange={(e) =>
                        updateAddon(
                          index,
                          addonIndex,
                          "price",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="R$"
                      className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeAddon(index, addonIndex)}
                      className="px-2 text-xs text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40"
        >
          Voltar
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700"
          >
            Continuar
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Criando..." : "Finalizar cadastro"}
          </button>
        )}
      </div>
    </div>
  );
}
