"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SearchInput from "@/components/shared/SearchInput";
import { normalizeOrderRow, type OrderRow } from "@/lib/orders/normalize";
import type { MenuItemWithAddons } from "@/lib/menu/types";
import { matchesSearchAny } from "@/lib/search/match-text";

type DashboardSearchContextValue = {
  query: string;
  setQuery: (query: string) => void;
};

const DashboardSearchContext = createContext<DashboardSearchContextValue>({
  query: "",
  setQuery: () => {},
});

export function useDashboardSearch() {
  return useContext(DashboardSearchContext);
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function orderSearchParts(order: OrderRow): string[] {
  const itemNames = order.order_items.map((i) => i.item_name);
  return [
    order.customers.name ?? "",
    order.customers.phone,
    order.id,
    order.id.slice(0, 8),
    order.notes ?? "",
    ...itemNames,
  ];
}

function menuItemSearchParts(item: MenuItemWithAddons): string[] {
  const addonNames = item.addons?.map((a) => a.name) ?? [];
  return [item.name, item.description ?? "", item.category, ...addonNames];
}

export function DashboardSearchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [query, setQuery] = useState("");

  return (
    <DashboardSearchContext.Provider value={{ query, setQuery }}>
      {children}
    </DashboardSearchContext.Provider>
  );
}

export function DashboardSearchBar({
  establishmentId,
  variant = "sidebar",
}: {
  establishmentId: string;
  variant?: "sidebar" | "mobile";
}) {
  const { query, setQuery } = useDashboardSearch();
  const router = useRouter();
  const [focused, setFocused] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemWithAddons[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadIndex = useCallback(async () => {
    if (loaded) return;

    try {
      const [ordersRes, menuRes] = await Promise.all([
        fetch(`/api/orders?establishment_id=${establishmentId}`),
        fetch("/api/menu-items"),
      ]);

      if (ordersRes.ok) {
        const rows = (await ordersRes.json()) as Record<string, unknown>[];
        setOrders(rows.map((row) => normalizeOrderRow(row)));
      }

      if (menuRes.ok) {
        setMenuItems((await menuRes.json()) as MenuItemWithAddons[]);
      }
    } catch {
      // ignore — dropdown stays empty
    } finally {
      setLoaded(true);
    }
  }, [establishmentId, loaded]);

  useEffect(() => {
    loadIndex();
  }, [loadIndex]);

  const trimmedQuery = query.trim();
  const showDropdown = focused && trimmedQuery.length >= 2;

  const orderResults = useMemo(() => {
    if (trimmedQuery.length < 2) return [];
    return orders
      .filter((order) => matchesSearchAny(trimmedQuery, orderSearchParts(order)))
      .slice(0, 6);
  }, [orders, trimmedQuery]);

  const menuResults = useMemo(() => {
    if (trimmedQuery.length < 2) return [];
    return menuItems
      .filter((item) => matchesSearchAny(trimmedQuery, menuItemSearchParts(item)))
      .slice(0, 6);
  }, [menuItems, trimmedQuery]);

  const hasResults = orderResults.length > 0 || menuResults.length > 0;

  function goToOrder(orderId: string) {
    setFocused(false);
    setQuery("");
    router.push(`/dashboard?highlightOrder=${orderId}`);
  }

  function goToMenuItem(itemId: string) {
    setFocused(false);
    setQuery("");
    router.push(`/dashboard/menu?highlightItem=${itemId}`);
  }

  return (
    <div
      className={
        variant === "sidebar"
          ? "relative border-b border-gray-100 px-3 py-3"
          : "relative mt-3"
      }
    >
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Buscar pedidos e produtos..."
        onFocus={() => {
          setFocused(true);
          loadIndex();
        }}
        onBlur={() => {
          window.setTimeout(() => setFocused(false), 150);
        }}
      />

      {showDropdown && (
        <div className="absolute left-0 right-0 z-50 mt-2 rounded-xl border border-gray-200 bg-white shadow-lg">
          {!hasResults ? (
            <p className="px-4 py-3 text-sm text-gray-500">
              Nenhum resultado para &ldquo;{trimmedQuery}&rdquo;
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto py-2">
              {orderResults.length > 0 && (
                <div>
                  <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Pedidos
                  </p>
                  {orderResults.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => goToOrder(order.id)}
                      className="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-gray-50"
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {order.customers.name || "Cliente"}
                      </span>
                      <span className="text-xs text-gray-500">
                        #{order.id.slice(0, 8).toUpperCase()} · {formatCurrency(order.total_amount)}
                      </span>
                    </button>
                  ))}
                  <Link
                    href="/dashboard"
                    className="block px-3 py-1.5 text-xs font-medium text-brand hover:underline"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    Ver todos os pedidos
                  </Link>
                </div>
              )}

              {menuResults.length > 0 && (
                <div className={orderResults.length > 0 ? "mt-2 border-t border-gray-100 pt-2" : ""}>
                  <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Cardápio
                  </p>
                  {menuResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => goToMenuItem(item.id)}
                      className="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-gray-50"
                    >
                      <span className="text-sm font-medium text-gray-900">{item.name}</span>
                      <span className="text-xs text-gray-500">
                        {item.category} · {formatCurrency(item.price)}
                      </span>
                    </button>
                  ))}
                  <Link
                    href="/dashboard/menu"
                    className="block px-3 py-1.5 text-xs font-medium text-brand hover:underline"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    Ver cardápio completo
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
