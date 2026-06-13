"use client";

import { useCallback, useMemo, useState } from "react";
import MenuItemForm from "@/components/dashboard/MenuItemForm";
import ProFeatureUpsell from "@/components/dashboard/ProFeatureUpsell";
import {
  EMPTY_MENU_ITEM_FORM,
  formStateToPayload,
  menuItemToFormState,
  mergeDevMockItem,
} from "@/lib/menu/form";
import { canUseDailyMenu } from "@/lib/plans/features";
import type { MenuItemWithAddons } from "@/lib/menu/types";
import type { PlanType } from "@/types/database";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function MenuManager({
  initialItems,
  devMock = false,
  establishmentCategory,
  plan,
}: {
  initialItems: MenuItemWithAddons[];
  devMock?: boolean;
  establishmentCategory: string;
  plan: PlanType;
}) {
  const showDailyToggle =
    establishmentCategory === "quentinha" && canUseDailyMenu(plan);
  const showDailyUpsell =
    establishmentCategory === "quentinha" && !canUseDailyMenu(plan);

  const [items, setItems] = useState(initialItems);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newItem, setNewItem] = useState(EMPTY_MENU_ITEM_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_MENU_ITEM_FORM);
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const fetchItems = useCallback(async () => {
    const response = await fetch("/api/menu-items");
    if (!response.ok) return;
    const data = await response.json();
    setItems(data);
  }, []);

  const filteredItems = useMemo(() => {
    if (filter === "active") return items.filter((i) => i.is_active);
    if (filter === "inactive") return items.filter((i) => !i.is_active);
    return items;
  }, [items, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, MenuItemWithAddons[]>();
    for (const item of filteredItems) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return Array.from(map.entries());
  }, [filteredItems]);

  function startEdit(item: MenuItemWithAddons) {
    setEditingId(item.id);
    setEditForm(menuItemToFormState(item));
    setEditError(null);
    setShowCreateForm(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setCreateError(null);

    try {
      const payload = formStateToPayload(newItem);
      const response = await fetch("/api/menu-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao criar item");

      if (devMock) {
        setItems((prev) => [...prev, data]);
      } else {
        await fetchItems();
      }

      setNewItem({
        ...EMPTY_MENU_ITEM_FORM,
        category: newItem.category,
        is_daily: showDailyToggle,
      });
      setShowCreateForm(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Erro ao criar item");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;

    setLoading(true);
    setEditError(null);

    try {
      const payload = formStateToPayload(editForm);
      const response = await fetch(`/api/menu-items/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao salvar item");

      if (devMock) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === editingId ? mergeDevMockItem(i, editForm) : i
          )
        );
      } else {
        setItems((prev) =>
          prev.map((i) => (i.id === editingId ? { ...i, ...data } : i))
        );
      }

      setEditingId(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Erro ao salvar item");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(item: MenuItemWithAddons) {
    setLoading(true);
    try {
      const response = await fetch(`/api/menu-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !item.is_active }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao atualizar");
      }

      const data = await response.json();

      if (devMock) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, is_active: !i.is_active } : i
          )
        );
      } else {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, ...data } : i))
        );
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao atualizar item");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {devMock && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Dados de exemplo — alterações locais até conectar um estabelecimento real.
        </p>
      )}

      {showDailyUpsell && (
        <ProFeatureUpsell
          title="Cardápio do dia — plano Pro"
          description="Marque quais itens entram no menu de hoje e o bot só mostra essas opções no WhatsApp. No Básico, todos os itens ativos aparecem."
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", "active", "inactive"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                filter === key
                  ? "bg-brand text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              {key === "all" ? "Todos" : key === "active" ? "Ativos" : "Inativos"}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setShowCreateForm((v) => !v);
            if (!showCreateForm) cancelEdit();
          }}
          className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark sm:w-auto"
        >
          {showCreateForm ? "Cancelar" : "+ Novo item"}
        </button>
      </div>

      {showCreateForm && (
        <MenuItemForm
          title="Adicionar ao cardápio"
          form={newItem}
          onChange={setNewItem}
          onSubmit={handleCreate}
          onCancel={() => {
            setShowCreateForm(false);
            setCreateError(null);
          }}
          loading={loading}
          error={createError}
          submitLabel="Salvar item"
          showDailyToggle={showDailyToggle}
        />
      )}

      {grouped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-gray-600">Nenhum item neste filtro.</p>
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="mt-3 text-sm font-medium text-brand hover:underline"
          >
            Adicionar primeiro item
          </button>
        </div>
      ) : (
        grouped.map(([category, categoryItems]) => (
          <section key={category}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              {category}
            </h3>
            <div className="space-y-3">
              {categoryItems.map((item) => (
                <article key={item.id}>
                  {editingId === item.id ? (
                    <MenuItemForm
                      title={`Editar: ${item.name}`}
                      form={editForm}
                      onChange={setEditForm}
                      onSubmit={handleUpdate}
                      onCancel={cancelEdit}
                      loading={loading}
                      error={editError}
                      submitLabel="Salvar alterações"
                      showDailyToggle={showDailyToggle}
                    />
                  ) : (
                    <div
                      className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${
                        item.is_active ? "border-gray-200 bg-white" : "border-gray-200 bg-white opacity-80"
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        {item.photo_url && (
                          <img
                            src={item.photo_url}
                            alt={item.name}
                            className="h-20 w-20 shrink-0 rounded-xl border border-gray-100 object-cover"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-gray-900">{item.name}</h4>
                            {!item.is_active && (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                Inativo
                              </span>
                            )}
                            {showDailyToggle && item.is_daily && (
                              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand">
                                Cardápio do dia
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                          )}
                          {item.addons.length > 0 && (
                            <p className="mt-2 text-xs text-gray-500">
                              Adicionais:{" "}
                              {item.addons
                                .map((a) => `${a.name} (${formatCurrency(Number(a.price))})`)
                                .join(", ")}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-stretch gap-2 sm:items-end">
                          <p className="text-lg font-bold text-gray-900 sm:text-right">
                            {formatCurrency(Number(item.price))}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => startEdit(item)}
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => toggleActive(item)}
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                            >
                              {item.is_active ? "Desativar" : "Ativar"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
