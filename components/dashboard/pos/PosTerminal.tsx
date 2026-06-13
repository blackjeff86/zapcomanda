"use client";

import { useEffect, useMemo, useState } from "react";
import PosItemModal, { type PosAddon, type PosMenuItem } from "./PosItemModal";

type CartEntry = {
  entryId: string;
  menu_item_id: string;
  item_name: string;
  unit_price: number;
  quantity: number;
  notes: string;
  addons: PosAddon[];
};

type OrderType = "local" | "viagem";
type DeliverySubtype = "pickup" | "delivery";
type PaymentMethod = "cash" | "credit_card" | "debit_card" | "pix" | "meal_voucher";

type OrderSuccess = {
  ref: string;
  total: number;
  payment_method: PaymentMethod;
  change: number | null;
  order_type: OrderType;
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Dinheiro",
  credit_card: "Crédito",
  debit_card: "Débito",
  pix: "Pix",
  meal_voucher: "Voucher",
};

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtPhone = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

function entrySubtotal(e: CartEntry) {
  return (e.unit_price + e.addons.reduce((s, a) => s + a.price, 0)) * e.quantity;
}

export default function PosTerminal() {
  const [menuItems, setMenuItems] = useState<PosMenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [modalItem, setModalItem] = useState<PosMenuItem | null>(null);

  // Order type
  const [orderType, setOrderType] = useState<OrderType>("local");
  const [deliverySubtype, setDeliverySubtype] = useState<DeliverySubtype>("pickup");
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [cep, setCep] = useState("");

  // Customer + payment
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashAmount, setCashAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<OrderSuccess | null>(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  useEffect(() => {
    fetch("/api/menu-items")
      .then((r) => r.json())
      .then((data: PosMenuItem[] | { error: string }) => {
        if (Array.isArray(data)) {
          setMenuItems(
            data.filter((i) => i.is_active && (i.stock_quantity === null || i.stock_quantity > 0))
          );
        }
      })
      .finally(() => setLoadingMenu(false));
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(menuItems.map((i) => i.category))).sort(),
    [menuItems]
  );

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch =
        !search || item.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, search, activeCategory]);

  const cartTotal = cart.reduce((sum, e) => sum + entrySubtotal(e), 0);
  const cartCount = cart.reduce((sum, e) => sum + e.quantity, 0);
  const cashAmountNum = parseFloat(cashAmount.replace(",", ".")) || 0;
  const change =
    paymentMethod === "cash" && cashAmountNum > 0 ? cashAmountNum - cartTotal : null;

  function openModal(item: PosMenuItem) {
    setModalItem(item);
  }

  function handleModalConfirm(qty: number, notes: string, addons: PosAddon[]) {
    if (!modalItem) return;
    const isCombo = modalItem.is_combo && modalItem.combo_price != null;
    const basePrice = isCombo ? modalItem.combo_price! : modalItem.price;
    const partnerItem = isCombo && modalItem.combo_partner_id
      ? menuItems.find((m) => m.id === modalItem.combo_partner_id)
      : null;
    const itemName = partnerItem
      ? `${modalItem.name} + ${partnerItem.name}`
      : modalItem.name;

    setCart((prev) => [
      ...prev,
      {
        entryId: `${modalItem.id}-${Date.now()}`,
        menu_item_id: modalItem.id,
        item_name: isCombo && partnerItem ? itemName : modalItem.name,
        unit_price: basePrice,
        quantity: qty,
        notes,
        addons,
      },
    ]);
    setModalItem(null);
  }

  function updateQuantity(entryId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((e) => (e.entryId === entryId ? { ...e, quantity: e.quantity + delta } : e))
        .filter((e) => e.quantity > 0)
    );
  }

  function clearCart() {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setCashAmount("");
    setPaymentMethod("cash");
    setOrderType("local");
    setDeliverySubtype("pickup");
    setStreet("");
    setStreetNumber("");
    setNeighborhood("");
    setCep("");
    setError("");
  }

  async function submitOrder() {
    if (cart.length === 0) {
      setError("Adicione pelo menos um item ao carrinho.");
      return;
    }
    if (orderType === "viagem" && deliverySubtype === "delivery") {
      if (!street.trim() || !streetNumber.trim() || !neighborhood.trim() || !cep.trim()) {
        setError("Preencha todos os campos do endereço de entrega.");
        return;
      }
    }
    setError("");
    setSubmitting(true);

    const phoneDigits = customerPhone.replace(/\D/g, "");
    const apiDeliveryType =
      orderType === "local"
        ? "local"
        : deliverySubtype === "delivery"
        ? "delivery"
        : "pickup";
    const address =
      orderType === "viagem" && deliverySubtype === "delivery"
        ? `${street.trim()}, ${streetNumber.trim()} - ${neighborhood.trim()}, CEP ${cep.trim()}`
        : undefined;

    try {
      const res = await fetch("/api/dashboard/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName.trim() || undefined,
          customer_phone: phoneDigits.length >= 10 ? phoneDigits : undefined,
          items: cart.map((e) => ({
            menu_item_id: e.menu_item_id,
            item_name: e.item_name,
            quantity: e.quantity,
            unit_price: e.unit_price,
            notes: e.notes || undefined,
            addons: e.addons.length > 0 ? e.addons : undefined,
          })),
          payment_method: paymentMethod,
          delivery_type: apiDeliveryType,
          address,
          cash_tender_amount:
            paymentMethod === "cash" && cashAmountNum > 0 ? cashAmountNum : undefined,
        }),
      });

      const data = (await res.json()) as { order_ref?: string; total?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar pedido");

      setSuccess({
        ref: data.order_ref ?? "",
        total: data.total ?? cartTotal,
        payment_method: paymentMethod,
        change: change && change > 0 ? change : null,
        order_type: orderType,
      });
      clearCart();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar pedido");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-green-100 bg-white p-8 text-center shadow-xl shadow-green-500/5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Pedido registrado!</h2>
          <p className="mt-1 font-mono text-sm font-semibold text-brand">#{success.ref}</p>

          <div className="mt-6 space-y-2 rounded-xl bg-gray-50 p-4 text-left text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Total</span>
              <span className="font-semibold text-gray-900">{fmt(success.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Pagamento</span>
              <span className="font-semibold text-gray-900">{PAYMENT_LABELS[success.payment_method]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tipo</span>
              <span className="font-semibold text-gray-900">
                {success.order_type === "local" ? "Consumo no local" : "Viagem"}
              </span>
            </div>
            {success.change !== null && (
              <div className="flex justify-between">
                <span className="text-gray-500">Troco</span>
                <span className="font-semibold text-green-700">{fmt(success.change)}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="mt-6 w-full rounded-full bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Nova venda
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {modalItem && (
        <PosItemModal
          item={modalItem}
          partnerName={
            modalItem.combo_partner_id
              ? (menuItems.find((m) => m.id === modalItem.combo_partner_id)?.name ?? null)
              : null
          }
          onClose={() => setModalItem(null)}
          onConfirm={handleModalConfirm}
        />
      )}

      <div className="flex h-full min-h-0 flex-col lg:flex-row lg:gap-6">
        {/* Menu panel */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
          {/* Search */}
          <div className="border-b border-gray-100 p-3">
            <div className="relative">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                placeholder="Buscar item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand focus:bg-white"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto border-b border-gray-100 p-3 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${activeCategory === "all" ? "bg-brand text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${activeCategory === cat ? "bg-brand text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Items grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {loadingMenu ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              </div>
            ) : filteredItems.length === 0 ? (
              <p className="py-16 text-center text-sm text-gray-400">
                {search ? "Nenhum item encontrado" : "Nenhum item no cardápio"}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {filteredItems.map((item) => {
                  const totalInCart = cart
                    .filter((e) => e.menu_item_id === item.id)
                    .reduce((s, e) => s + e.quantity, 0);
                  const isCombo = item.is_combo && item.combo_price != null;
                  const displayPrice = isCombo ? item.combo_price! : item.price;
                  const isLowStock =
                    item.stock_quantity !== null &&
                    item.low_stock_threshold !== null &&
                    item.stock_quantity <= item.low_stock_threshold;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openModal(item)}
                      className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-left transition hover:border-brand/30 hover:bg-brand-light/20 active:scale-[0.98]"
                    >
                      {item.photo_url ? (
                        <img
                          src={item.photo_url}
                          alt={item.name}
                          className="h-14 w-14 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-gray-400">
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 18h16.5M21 12V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12" />
                          </svg>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1">
                          <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-brand">
                            {item.name}
                          </p>
                          {isCombo && (
                            <span className="shrink-0 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700">
                              COMBO
                            </span>
                          )}
                          {isLowStock && (
                            <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                              {item.stock_quantity} restantes
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="mt-0.5 truncate text-xs text-gray-400">{item.description}</p>
                        )}
                        <p className="mt-1 text-sm font-bold text-brand">{fmt(displayPrice)}</p>
                      </div>
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                          totalInCart > 0
                            ? "bg-brand text-white"
                            : "bg-gray-200 text-gray-600 group-hover:bg-brand group-hover:text-white"
                        }`}
                      >
                        {totalInCart > 0 ? totalInCart : "+"}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Mobile cart toggle */}
        {cartCount > 0 && (
          <button
            type="button"
            onClick={() => setMobileCartOpen(true)}
            className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/25 lg:hidden"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-brand">
              {cartCount}
            </span>
            Ver carrinho · {fmt(cartTotal)}
          </button>
        )}

        {/* Cart panel */}
        <div
          className={`${mobileCartOpen ? "fixed inset-0 z-50 flex items-end" : "hidden"} lg:relative lg:inset-auto lg:z-auto lg:flex lg:w-96 lg:shrink-0`}
        >
          {mobileCartOpen && (
            <div className="absolute inset-0 bg-black/40 lg:hidden" onClick={() => setMobileCartOpen(false)} />
          )}

          <div className="relative flex w-full max-h-[90vh] flex-col overflow-hidden rounded-t-2xl bg-white lg:max-h-none lg:rounded-xl lg:border lg:border-gray-200">
            {/* Cart header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h3 className="font-semibold text-gray-900">
                Carrinho{" "}
                {cartCount > 0 && (
                  <span className="ml-1 rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button type="button" onClick={clearCart} className="text-xs text-gray-400 hover:text-red-500">
                    Limpar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMobileCartOpen(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 lg:hidden"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Cart items */}
              <div className="p-3">
                {cart.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-400">Nenhum item ainda</p>
                ) : (
                  <div className="space-y-2">
                    {cart.map((entry) => (
                      <div key={entry.entryId} className="rounded-xl bg-gray-50 p-3">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {entry.item_name}
                            </p>
                            {entry.addons.length > 0 && (
                              <p className="mt-0.5 text-xs text-gray-500">
                                + {entry.addons.map((a) => a.name).join(", ")}
                              </p>
                            )}
                            {entry.notes && (
                              <p className="mt-0.5 text-xs italic text-gray-400">{entry.notes}</p>
                            )}
                            <p className="mt-1 text-xs font-semibold text-brand">
                              {fmt(entrySubtotal(entry))}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateQuantity(entry.entryId, -1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="w-6 text-center text-sm font-bold text-gray-900">
                              {entry.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(entry.entryId, 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-dark"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <>
                  {/* Subtotal */}
                  <div className="border-t border-gray-100 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Subtotal</span>
                      <span className="text-base font-bold text-gray-900">{fmt(cartTotal)}</span>
                    </div>
                  </div>

                  {/* Order type */}
                  <div className="border-t border-gray-100 px-4 py-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Tipo de pedido
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(["local", "viagem"] as OrderType[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setOrderType(t)}
                          className={`rounded-lg py-2 text-xs font-semibold transition ${
                            orderType === t ? "bg-brand text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {t === "local" ? "Consumir no local" : "Viagem"}
                        </button>
                      ))}
                    </div>

                    {orderType === "viagem" && (
                      <div className="mt-2 space-y-2">
                        <div className="grid grid-cols-2 gap-1.5">
                          {(["pickup", "delivery"] as DeliverySubtype[]).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setDeliverySubtype(t)}
                              className={`rounded-lg py-2 text-xs font-semibold transition ${
                                deliverySubtype === t
                                  ? "bg-gray-700 text-white"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              {t === "pickup" ? "Retirada" : "Delivery"}
                            </button>
                          ))}
                        </div>

                        {deliverySubtype === "delivery" && (
                          <div className="space-y-1.5 rounded-xl border border-gray-200 p-3">
                            <input
                              type="text"
                              placeholder="Rua / Avenida"
                              value={street}
                              onChange={(e) => setStreet(e.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
                            />
                            <div className="grid grid-cols-2 gap-1.5">
                              <input
                                type="text"
                                placeholder="Número"
                                value={streetNumber}
                                onChange={(e) => setStreetNumber(e.target.value)}
                                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
                              />
                              <input
                                type="text"
                                placeholder="Bairro"
                                value={neighborhood}
                                onChange={(e) => setNeighborhood(e.target.value)}
                                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
                              />
                            </div>
                            <input
                              type="text"
                              placeholder="CEP"
                              value={cep}
                              onChange={(e) => setCep(e.target.value)}
                              maxLength={9}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Customer info */}
                  <div className="border-t border-gray-100 px-4 py-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Cliente (opcional)
                    </p>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Nome"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
                      />
                      <input
                        type="tel"
                        placeholder="Telefone (para rastrear)"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(fmtPhone(e.target.value))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  {/* Payment method */}
                  <div className="border-t border-gray-100 px-4 py-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Pagamento
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`rounded-lg py-2 text-xs font-semibold transition ${
                            paymentMethod === method
                              ? "bg-brand text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {PAYMENT_LABELS[method]}
                        </button>
                      ))}
                    </div>

                    {paymentMethod === "cash" && (
                      <div className="mt-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="Valor recebido (R$)"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
                        />
                        {change !== null && change >= 0 && (
                          <p className="mt-1.5 text-sm font-semibold text-green-700">
                            Troco: {fmt(change)}
                          </p>
                        )}
                        {change !== null && change < 0 && (
                          <p className="mt-1.5 text-sm font-semibold text-red-600">
                            Valor insuficiente: faltam {fmt(Math.abs(change))}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 p-4">
              {error && (
                <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}
              <button
                type="button"
                onClick={submitOrder}
                disabled={cart.length === 0 || submitting}
                className="w-full rounded-full bg-brand py-3.5 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Registrando..."
                  : cart.length === 0
                  ? "Carrinho vazio"
                  : `Finalizar · ${fmt(cartTotal)}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
