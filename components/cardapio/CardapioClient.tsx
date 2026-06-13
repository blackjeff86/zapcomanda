"use client";

import { useState, useMemo, useEffect } from "react";
import type { PaymentMethod } from "@/types/database";
import {
  categoryAnchorId,
  groupMenuItemsByCategory,
} from "@/lib/menu/group-by-category";
import MyOrdersPanel from "./MyOrdersPanel";

type Addon = { id: string; name: string; price: number; is_active: boolean };

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  photo_url: string | null;
  category: string;
  combo_partner_id: string | null;
  combo_price: number | null;
  sort_order: number;
  menu_item_addons: Addon[];
};

type Establishment = {
  id: string;
  slug: string;
  name: string;
  category: string;
  logo_url: string | null;
  primary_color: string;
  accepted_payment_methods: PaymentMethod[];
  delivery_fee_enabled: boolean;
  delivery_fee_amount: number;
  pix_key: string | null;
  order_cutoff_time: string | null;
};

type CartItem = {
  id: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  notes: string;
  selectedAddons: Array<{ id: string; name: string; price: number }>;
};

type Screen = "menu" | "cart" | "checkout" | "confirmed";

type CheckoutForm = {
  name: string;
  phone: string;
  deliveryType: "pickup" | "delivery";
  address: string;
  paymentMethod: PaymentMethod;
};

type OrderStatus =
  | "awaiting_payment"
  | "paid"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

type OrderResult = {
  order_id: string;
  order_ref: string;
  total: number;
  delivery_fee: number;
  discount_amount?: number;
  payment_method: PaymentMethod;
  delivery_type: "pickup" | "delivery";
  status: OrderStatus;
  pix_copy_paste: string | null;
};

function fmt(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  cash: "Dinheiro",
  meal_voucher: "Vale refeição",
};

export default function CardapioClient({
  establishment,
  menuItems,
}: {
  establishment: Establishment;
  menuItems: MenuItem[];
}) {
  const brand = establishment.primary_color;

  const groupedMenu = useMemo(
    () => groupMenuItemsByCategory(menuItems),
    [menuItems]
  );

  const categories = useMemo(
    () => groupedMenu.map((g) => g.category),
    [groupedMenu]
  );

  const [activeCategory, setActiveCategory] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [screen, setScreen] = useState<Screen>("menu");
  const [logoError, setLogoError] = useState(false);

  // Item detail modal
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [modalNotes, setModalNotes] = useState("");
  const [modalAddons, setModalAddons] = useState<Set<string>>(new Set());
  const [modalCombo, setModalCombo] = useState(false);

  // Checkout
  const [checkout, setCheckout] = useState<CheckoutForm>({
    name: "",
    phone: "",
    deliveryType: "delivery",
    address: "",
    paymentMethod: establishment.accepted_payment_methods[0] ?? "cash",
  });
  const [processing, setProcessing] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [liveStatus, setLiveStatus] = useState<OrderStatus | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showMyOrders, setShowMyOrders] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount_amount: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const CUSTOMER_KEY = `zapcomanda_customer_${establishment.id}`;
  const CUSTOMER_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  function scrollToCategory(category: string) {
    setActiveCategory(category);
    const el = document.getElementById(categoryAnchorId(category));
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }

  function openMyOrders() {
    setShowMyOrders(true);
    window.location.hash = "meus-pedidos";
  }

  function closeMyOrders() {
    setShowMyOrders(false);
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  // Restore saved customer data + sync panel state with URL hash
  useEffect(() => {
    // Pre-fill checkout from localStorage
    try {
      const raw = localStorage.getItem(CUSTOMER_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { name: string; phone: string; savedAt: number };
        if (Date.now() - saved.savedAt > CUSTOMER_TTL) {
          localStorage.removeItem(CUSTOMER_KEY);
        } else {
          setCheckout((prev) => ({
            ...prev,
            name: saved.name || prev.name,
            phone: saved.phone || prev.phone,
          }));
        }
      }
    } catch {
      // private browsing or quota exceeded — ignore
    }

    // Open panel if URL hash is already #meus-pedidos (e.g. after page refresh)
    if (window.location.hash === "#meus-pedidos") {
      setShowMyOrders(true);
    }

    // Sync panel when user presses browser back/forward
    function onHashChange() {
      setShowMyOrders(window.location.hash === "#meus-pedidos");
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll order status every 10 seconds after order is placed
  useEffect(() => {
    if (!orderResult) return;
    setLiveStatus(orderResult.status);

    const TERMINAL = new Set(["delivered", "cancelled"]);
    if (TERMINAL.has(orderResult.status)) return;

    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/cardapio/orders/${orderResult.order_id}/status`);
        if (!res.ok) return;
        const data = await res.json();
        setLiveStatus(data.status);
        if (TERMINAL.has(data.status)) clearInterval(id);
      } catch {
        // ignore network errors, try again next tick
      }
    }, 10_000);

    return () => clearInterval(id);
  }, [orderResult]);

  // Derived cart values
  const cartTotal = cart.reduce(
    (s, i) =>
      s +
      i.unitPrice * i.quantity +
      i.selectedAddons.reduce((a, addon) => a + addon.price * i.quantity, 0),
    0
  );
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const deliveryFee =
    checkout.deliveryType === "delivery" && establishment.delivery_fee_enabled
      ? Number(establishment.delivery_fee_amount)
      : 0;
  const discountAmount = appliedCoupon?.discount_amount ?? 0;
  const total = Math.max(0, cartTotal + deliveryFee - discountAmount);

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code) return;

    setCouponLoading(true);
    setCouponError(null);

    try {
      const res = await fetch("/api/cardapio/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          establishment_id: establishment.id,
          code,
          subtotal: cartTotal,
          delivery_fee: deliveryFee,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cupom inválido");

      setAppliedCoupon({
        code: data.code,
        discount_amount: data.discount_amount,
      });
      setCouponInput(data.code);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err instanceof Error ? err.message : "Cupom inválido");
    } finally {
      setCouponLoading(false);
    }
  }

  function clearCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  }

  const itemQtyInCart = (menuItemId: string) =>
    cart
      .filter((c) => c.menuItemId === menuItemId)
      .reduce((s, c) => s + c.quantity, 0);

  // Modal derived values
  const activeAddons = useMemo(
    () => modalItem?.menu_item_addons.filter((a) => a.is_active) ?? [],
    [modalItem]
  );
  const modalAddonTotal = useMemo(
    () =>
      activeAddons
        .filter((a) => modalAddons.has(a.id))
        .reduce((s, a) => s + Number(a.price), 0),
    [activeAddons, modalAddons]
  );
  const comboPartner = useMemo(
    () =>
      modalItem?.combo_partner_id
        ? menuItems.find((i) => i.id === modalItem.combo_partner_id) ?? null
        : null,
    [modalItem, menuItems]
  );
  const modalBasePrice = useMemo(() => {
    if (!modalItem) return 0;
    if (modalCombo && modalItem.combo_price != null) return Number(modalItem.combo_price);
    return Number(modalItem.price);
  }, [modalItem, modalCombo]);
  const modalUnitPrice = modalBasePrice + modalAddonTotal;

  function openModal(item: MenuItem) {
    setModalItem(item);
    setModalQty(1);
    setModalNotes("");
    setModalAddons(new Set());
    setModalCombo(false);
  }

  function closeModal() {
    setModalItem(null);
  }

  function toggleAddon(id: string) {
    setModalAddons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addToCart() {
    if (!modalItem) return;
    const selectedAddonItems = activeAddons
      .filter((a) => modalAddons.has(a.id))
      .map((a) => ({ id: a.id, name: a.name, price: Number(a.price) }));

    const itemName =
      modalCombo && comboPartner
        ? `${modalItem.name} + ${comboPartner.name} (Combo)`
        : modalItem.name;

    const newItem: CartItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      menuItemId: modalItem.id,
      name: itemName,
      unitPrice: modalUnitPrice,
      quantity: modalQty,
      notes: modalNotes.trim(),
      selectedAddons: selectedAddonItems,
    };

    setCart((prev) => [...prev, newItem]);
    closeModal();
  }

  async function handleSubmit() {
    if (!checkout.name.trim() || !checkout.phone.trim()) {
      setOrderError("Preencha seu nome e WhatsApp.");
      return;
    }
    if (checkout.deliveryType === "delivery" && !checkout.address.trim()) {
      setOrderError("Informe o endereço de entrega.");
      return;
    }

    setProcessing(true);
    setOrderError(null);

    try {
      const res = await fetch("/api/cardapio/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          establishment_id: establishment.id,
          customer_name: checkout.name.trim(),
          customer_phone: checkout.phone.replace(/\D/g, ""),
          delivery_type: checkout.deliveryType,
          address: checkout.address.trim() || undefined,
          payment_method: checkout.paymentMethod,
          coupon_code: appliedCoupon?.code || undefined,
          items: cart.map((c) => ({
            menu_item_id: c.menuItemId,
            item_name: c.name,
            quantity: c.quantity,
            unit_price: c.unitPrice,
            notes: c.notes || undefined,
            addons: c.selectedAddons,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao enviar pedido");

      setOrderResult(data);
      setLiveStatus(data.status);
      setScreen("confirmed");

      // Persist customer data for 2h so they don't need to retype
      try {
        localStorage.setItem(
          CUSTOMER_KEY,
          JSON.stringify({
            name: checkout.name.trim(),
            phone: checkout.phone.replace(/\D/g, ""),
            savedAt: Date.now(),
          })
        );
      } catch {
        // private browsing or quota exceeded — ignore
      }
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : "Erro ao enviar pedido");
    } finally {
      setProcessing(false);
    }
  }

  async function copyPix() {
    if (!orderResult?.pix_copy_paste) return;
    await navigator.clipboard.writeText(orderResult.pix_copy_paste);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const visibleGroups = groupedMenu;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 shadow-sm"
        style={{ backgroundColor: brand }}
      >
        {establishment.logo_url && !logoError ? (
          <img
            src={establishment.logo_url}
            alt={establishment.name}
            className="h-9 w-9 rounded-full border-2 border-white/30 object-cover"
            onError={() => setLogoError(true)}
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/30 bg-white/20 text-sm font-bold text-white">
            {establishment.name[0]?.toUpperCase()}
          </div>
        )}
        <h1 className="flex-1 text-base font-bold text-white">{establishment.name}</h1>
        <button
          type="button"
          onClick={() => openMyOrders()}
          className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/30"
        >
          <span>📋</span>
          <span>Meus Pedidos</span>
        </button>
      </header>

      {/* Category tabs */}
      <div className="sticky top-[57px] z-10 flex gap-2 overflow-x-auto bg-white px-4 py-2.5 shadow-sm">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => scrollToCategory(cat)}
            className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition"
            style={
              activeCategory === cat
                ? { backgroundColor: brand, color: "#fff" }
                : { backgroundColor: "#f3f4f6", color: "#374151" }
            }
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items grouped by category */}
      <div className="px-4 pt-4 space-y-6">
        {visibleGroups.map(({ category, items: categoryItems }) => (
          <section
            key={category}
            id={categoryAnchorId(category)}
            className="scroll-mt-28"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="text-brand" style={{ color: brand }}>›</span>
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-800">
                {category}
              </h2>
              <span className="text-xs text-gray-400">({categoryItems.length})</span>
            </div>
            <div className="space-y-3">
              {categoryItems.map((item) => {
                const qty = itemQtyInCart(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openModal(item)}
                    className="flex w-full gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm text-left"
                  >
                    {item.photo_url && (
                      <img
                        src={item.photo_url}
                        alt={item.name}
                        className="h-20 w-20 shrink-0 rounded-xl object-cover"
                      />
                    )}
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="font-semibold text-gray-900 leading-tight">
                            {item.name}
                          </p>
                          {item.combo_partner_id && (
                            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                              Combo
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span
                          className="text-sm font-bold"
                          style={{ color: brand }}
                        >
                          {fmt(Number(item.price))}
                        </span>
                        <div
                          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold text-white"
                          style={{ backgroundColor: brand }}
                        >
                          {qty > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25 text-xs font-bold">
                              {qty}
                            </span>
                          )}
                          <span>{qty > 0 ? "Adicionar mais" : "+ Adicionar"}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Cart bar */}
      {cartCount > 0 && screen === "menu" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
          <button
            type="button"
            onClick={() => setScreen("cart")}
            className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-white"
            style={{ backgroundColor: brand }}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25 text-xs font-bold">
              {cartCount}
            </span>
            <span className="font-semibold">Ver carrinho</span>
            <span className="font-semibold">{fmt(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* Item detail modal (bottom sheet) */}
      {modalItem && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50"
          onClick={closeModal}
        >
          <div
            className="flex max-h-[90vh] flex-col overflow-y-auto rounded-t-3xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pb-1 pt-3">
              <div className="h-1 w-10 rounded-full bg-gray-300" />
            </div>

            {modalItem.photo_url && (
              <img
                src={modalItem.photo_url}
                alt={modalItem.name}
                className="h-48 w-full object-cover"
              />
            )}

            <div className="space-y-4 p-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{modalItem.name}</h2>
                {modalItem.description && (
                  <p className="mt-1 text-sm text-gray-500">{modalItem.description}</p>
                )}
                <p className="mt-2 text-base font-bold" style={{ color: brand }}>
                  {fmt(Number(modalItem.price))}
                </p>
              </div>

              {/* Combo option */}
              {comboPartner && modalItem.combo_price != null && (
                <button
                  type="button"
                  onClick={() => setModalCombo((v) => !v)}
                  className={`w-full rounded-2xl border-2 p-4 text-left transition ${
                    modalCombo
                      ? "border-orange-400 bg-orange-50"
                      : "border-gray-200 bg-gray-50 hover:border-orange-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                        modalCombo
                          ? "border-orange-500 bg-orange-500"
                          : "border-gray-300"
                      }`}
                    >
                      {modalCombo && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        Combo: inclua {comboPartner.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                        <span>{fmt(Number(modalItem.price))}</span>
                        <span>+</span>
                        <span>{fmt(Number(comboPartner.price))}</span>
                        <span className="text-gray-400">=</span>
                        <span className="line-through text-gray-400">
                          {fmt(Number(modalItem.price) + Number(comboPartner.price))}
                        </span>
                        <span className="font-bold text-orange-700">
                          → {fmt(Number(modalItem.combo_price))}
                        </span>
                        {Number(modalItem.price) + Number(comboPartner.price) > Number(modalItem.combo_price) && (
                          <span className="rounded-full bg-green-100 px-1.5 py-0.5 font-medium text-green-700">
                            economize {fmt(
                              Number(modalItem.price) +
                              Number(comboPartner.price) -
                              Number(modalItem.combo_price)
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              )}

              {/* Addons */}
              {activeAddons.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-700">Adicionais</p>
                  <div className="space-y-2">
                    {activeAddons.map((addon) => (
                      <label
                        key={addon.id}
                        className="flex cursor-pointer items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="flex h-5 w-5 items-center justify-center rounded border-2 transition"
                            style={
                              modalAddons.has(addon.id)
                                ? { backgroundColor: brand, borderColor: brand }
                                : { borderColor: "#d1d5db" }
                            }
                            onClick={() => toggleAddon(addon.id)}
                          >
                            {modalAddons.has(addon.id) && (
                              <span className="text-xs font-bold text-white">✓</span>
                            )}
                          </div>
                          <span className="text-sm text-gray-900">{addon.name}</span>
                        </div>
                        <span className="shrink-0 text-sm font-medium text-gray-600">
                          + {fmt(Number(addon.price))}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Observação{" "}
                  <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <textarea
                  placeholder="Ex: sem cebola, molho à parte..."
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              {/* Qty + Add button */}
              <div className="flex items-center gap-3 pb-2">
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                    className="text-xl font-bold leading-none"
                    style={{ color: brand }}
                  >
                    −
                  </button>
                  <span className="w-5 text-center font-bold">{modalQty}</span>
                  <button
                    type="button"
                    onClick={() => setModalQty((q) => q + 1)}
                    className="text-xl font-bold leading-none"
                    style={{ color: brand }}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={addToCart}
                  className="flex-1 rounded-xl py-3 text-sm font-bold text-white"
                  style={{ backgroundColor: brand }}
                >
                  Adicionar · {fmt(modalUnitPrice * modalQty)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Orders overlay */}
      {showMyOrders && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <MyOrdersPanel
            establishmentId={establishment.id}
            slug={establishment.slug}
            brand={brand}
            initialPhone={checkout.phone}
            onClose={() => closeMyOrders()}
          />
        </div>
      )}

      {/* Cart / Checkout / Confirmation overlay */}
      {screen !== "menu" && (
        <div className="fixed inset-0 z-40 flex flex-col bg-white">
          <div
            className="flex items-center gap-3 px-4 py-3 text-white"
            style={{ backgroundColor: brand }}
          >
            {screen !== "confirmed" && (
              <button
                type="button"
                onClick={() =>
                  setScreen((s) => (s === "checkout" ? "cart" : "menu"))
                }
                className="text-2xl font-light leading-none"
              >
                ←
              </button>
            )}
            <h2 className="text-base font-bold">
              {screen === "cart"
                ? "Seu carrinho"
                : screen === "checkout"
                ? "Finalizar pedido"
                : "Pedido confirmado!"}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Cart screen */}
            {screen === "cart" && (
              <div className="space-y-4 p-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                      {item.selectedAddons.length > 0 && (
                        <p className="mt-0.5 text-xs text-gray-500">
                          + {item.selectedAddons.map((a) => a.name).join(", ")}
                        </p>
                      )}
                      {item.notes && (
                        <p className="mt-0.5 text-xs italic text-gray-400">
                          Obs: {item.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setCart((prev) =>
                              item.quantity === 1
                                ? prev.filter((c) => c.id !== item.id)
                                : prev.map((c) =>
                                    c.id === item.id
                                      ? { ...c, quantity: c.quantity - 1 }
                                      : c
                                  )
                            )
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-full border-2 text-base font-bold leading-none"
                          style={{ borderColor: brand, color: brand }}
                        >
                          −
                        </button>
                        <span className="w-4 text-center text-sm font-bold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setCart((prev) =>
                              prev.map((c) =>
                                c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
                              )
                            )
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-full text-base font-bold leading-none text-white"
                          style={{ backgroundColor: brand }}
                        >
                          +
                        </button>
                      </div>
                      <span className="w-16 text-right text-sm font-semibold text-gray-900">
                        {fmt(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setScreen("menu")}
                  className="w-full rounded-xl border py-3 text-sm font-medium"
                  style={{ borderColor: brand, color: brand }}
                >
                  + Adicionar mais itens
                </button>

                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="flex justify-between text-base font-bold text-gray-900">
                    <span>Subtotal</span>
                    <span>{fmt(cartTotal)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setScreen("checkout")}
                  className="w-full rounded-xl py-3.5 text-sm font-bold text-white"
                  style={{ backgroundColor: brand }}
                >
                  Fazer pedido
                </button>
              </div>
            )}

            {/* Checkout screen */}
            {screen === "checkout" && (
              <div className="space-y-5 p-4">
                {orderError && (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {orderError}
                  </p>
                )}

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">Seus dados</h3>
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={checkout.name}
                    onChange={(e) =>
                      setCheckout((p) => ({ ...p, name: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                  <input
                    type="tel"
                    placeholder="WhatsApp (apenas números)"
                    value={checkout.phone}
                    onChange={(e) =>
                      setCheckout((p) => ({
                        ...p,
                        phone: e.target.value.replace(/\D/g, ""),
                      }))
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700">Recebimento</h3>
                  {(["delivery", "pickup"] as const).map((type) => (
                    <label
                      key={type}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border p-3"
                      style={
                        checkout.deliveryType === type
                          ? { borderColor: brand, backgroundColor: `${brand}10` }
                          : {}
                      }
                    >
                      <input
                        type="radio"
                        name="deliveryType"
                        checked={checkout.deliveryType === type}
                        onChange={() => {
                          clearCoupon();
                          setCheckout((p) => ({ ...p, deliveryType: type }));
                        }}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {type === "delivery"
                          ? establishment.delivery_fee_enabled
                            ? `Entrega — + ${fmt(Number(establishment.delivery_fee_amount))}`
                            : "Entrega"
                          : "Retirar no local"}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Address — only when delivery */}
                {checkout.deliveryType === "delivery" && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">
                      Endereço de entrega
                    </h3>
                    <textarea
                      placeholder="Rua, número, bairro, complemento..."
                      value={checkout.address}
                      onChange={(e) =>
                        setCheckout((p) => ({ ...p, address: e.target.value }))
                      }
                      rows={3}
                      className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700">Pagamento</h3>
                  {establishment.accepted_payment_methods.map((method) => (
                    <label
                      key={method}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border p-3"
                      style={
                        checkout.paymentMethod === method
                          ? { borderColor: brand, backgroundColor: `${brand}10` }
                          : {}
                      }
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={checkout.paymentMethod === method}
                        onChange={() =>
                          setCheckout((p) => ({ ...p, paymentMethod: method }))
                        }
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {PAYMENT_LABELS[method]}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700">Cupom de desconto</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase().replace(/\s/g, ""));
                        if (appliedCoupon) setAppliedCoupon(null);
                        setCouponError(null);
                      }}
                      placeholder="Código do cupom"
                      className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm uppercase focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                    {appliedCoupon ? (
                      <button
                        type="button"
                        onClick={clearCoupon}
                        className="shrink-0 rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700"
                      >
                        Remover
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={couponLoading || !couponInput.trim()}
                        onClick={applyCoupon}
                        className="shrink-0 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                        style={{ backgroundColor: brand }}
                      >
                        {couponLoading ? "..." : "Aplicar"}
                      </button>
                    )}
                  </div>
                  {couponError && (
                    <p className="text-xs text-red-600">{couponError}</p>
                  )}
                  {appliedCoupon && (
                    <p className="text-xs font-medium text-green-700">
                      Cupom {appliedCoupon.code} aplicado (−{fmt(appliedCoupon.discount_amount)})
                    </p>
                  )}
                </div>

                <div className="space-y-1 rounded-xl bg-gray-50 p-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>{fmt(cartTotal)}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Taxa de entrega</span>
                      <span>{fmt(deliveryFee)}</span>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-700">
                      <span>Desconto ({appliedCoupon?.code})</span>
                      <span>−{fmt(discountAmount)}</span>
                    </div>
                  )}
                  <div className="mt-1 flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
                    <span>Total</span>
                    <span>{fmt(total)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={processing}
                  onClick={handleSubmit}
                  className="w-full rounded-xl py-3.5 text-sm font-bold text-white disabled:opacity-60"
                  style={{ backgroundColor: brand }}
                >
                  {processing ? "Enviando..." : "Confirmar pedido"}
                </button>
              </div>
            )}

            {/* Confirmation screen */}
            {screen === "confirmed" && orderResult && (() => {
              const currentStatus = liveStatus ?? orderResult.status;
              const isPix = orderResult.payment_method === "pix";
              const isDelivery = orderResult.delivery_type === "delivery";
              const isCancelled = currentStatus === "cancelled";

              const STATUS_ORDER: OrderStatus[] = [
                "awaiting_payment",
                "paid",
                "preparing",
                "out_for_delivery",
                "delivered",
              ];

              type Step = { key: OrderStatus; label: string; icon: string };
              const allSteps: Step[] = [
                { key: "awaiting_payment", label: "Aguardando pagamento", icon: "⏳" },
                { key: "paid", label: "Pagamento confirmado", icon: "✅" },
                { key: "preparing", label: "Em preparação", icon: "👨‍🍳" },
                {
                  key: "out_for_delivery",
                  label: isDelivery ? "Saiu para entrega" : "Pronto para retirada",
                  icon: isDelivery ? "🛵" : "🎁",
                },
                {
                  key: "delivered",
                  label: isDelivery ? "Entregue" : "Retirado",
                  icon: "🎉",
                },
              ];

              const steps = isPix
                ? allSteps
                : allSteps.filter((s) => s.key !== "awaiting_payment" && s.key !== "paid");

              const currentIdx = STATUS_ORDER.indexOf(currentStatus);

              function stepState(step: Step) {
                const stepIdx = STATUS_ORDER.indexOf(step.key);
                if (currentIdx > stepIdx) return "done";
                if (currentIdx === stepIdx) return "current";
                return "pending";
              }

              return (
                <div className="space-y-5 p-5">
                  {/* Header */}
                  <div className="text-center">
                    {isCancelled ? (
                      <>
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">
                          ❌
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Pedido cancelado</h2>
                        <p className="mt-1 text-sm text-gray-500">Pedido #{orderResult.order_ref}</p>
                      </>
                    ) : currentStatus === "delivered" ? (
                      <>
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
                          🎉
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">
                          {isDelivery ? "Pedido entregue!" : "Pedido retirado!"}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">Obrigado pela preferência!</p>
                      </>
                    ) : (
                      <>
                        <div
                          className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white"
                          style={{ backgroundColor: brand }}
                        >
                          ✓
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Pedido #{orderResult.order_ref}</h2>
                        <p className="mt-1 text-xs text-gray-400">Atualizado automaticamente</p>
                      </>
                    )}
                  </div>

                  {/* Status timeline */}
                  {!isCancelled && (
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="space-y-3">
                        {steps.map((step, i) => {
                          const state = stepState(step);
                          return (
                            <div key={step.key} className="flex items-start gap-3">
                              {/* Connector line + circle */}
                              <div className="flex flex-col items-center">
                                <div
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm transition-all duration-500 ${
                                    state === "done"
                                      ? "bg-green-100 text-green-700"
                                      : state === "current"
                                      ? "text-white shadow-md"
                                      : "bg-gray-100 text-gray-400"
                                  }`}
                                  style={
                                    state === "current" ? { backgroundColor: brand } : {}
                                  }
                                >
                                  {state === "done" ? "✓" : step.icon}
                                </div>
                                {i < steps.length - 1 && (
                                  <div
                                    className={`mt-1 w-0.5 flex-1 transition-all duration-500 ${
                                      state === "done" ? "bg-green-200" : "bg-gray-200"
                                    }`}
                                    style={{ height: "16px" }}
                                  />
                                )}
                              </div>
                              {/* Label */}
                              <div className="pt-1">
                                <p
                                  className={`text-sm font-medium transition-all duration-300 ${
                                    state === "done"
                                      ? "text-green-700"
                                      : state === "current"
                                      ? "text-gray-900"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {step.label}
                                </p>
                                {state === "current" && (
                                  <p className="mt-0.5 text-xs text-gray-400">
                                    {step.key === "awaiting_payment"
                                      ? "Pague via Pix para confirmar"
                                      : step.key === "preparing"
                                      ? "Seu pedido está sendo preparado"
                                      : step.key === "out_for_delivery"
                                      ? isDelivery
                                        ? "A caminho do seu endereço"
                                        : "Pode vir buscar seu pedido!"
                                      : ""}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* PIX code */}
                  {orderResult.pix_copy_paste && currentStatus === "awaiting_payment" && (
                    <div className="space-y-3 rounded-2xl border border-green-100 bg-green-50 p-4">
                      <p className="text-sm font-semibold text-green-800">
                        Pague agora via Pix para confirmar o pedido
                      </p>
                      <div className="rounded-xl border border-green-200 bg-white px-3 py-2">
                        <p className="break-all font-mono text-xs leading-relaxed text-gray-600">
                          {orderResult.pix_copy_paste}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={copyPix}
                        className="w-full rounded-xl py-3 text-sm font-bold text-white"
                        style={{ backgroundColor: brand }}
                      >
                        {copied ? "Copiado!" : "Copiar código Pix"}
                      </button>
                    </div>
                  )}

                  {/* Order summary */}
                  <div className="space-y-1 rounded-2xl border border-gray-100 bg-white p-4">
                    {cart.map((item) => (
                      <div key={item.id}>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            {item.quantity}× {item.name}
                          </span>
                          <span className="font-medium text-gray-900">
                            {fmt(item.unitPrice * item.quantity)}
                          </span>
                        </div>
                        {(item.selectedAddons.length > 0 || item.notes) && (
                          <p className="mb-1 text-xs text-gray-400">
                            {[
                              item.selectedAddons.map((a) => a.name).join(", "),
                              item.notes,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                    ))}
                    {orderResult.delivery_fee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Taxa de entrega</span>
                        <span className="text-gray-700">{fmt(orderResult.delivery_fee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
                      <span>Total</span>
                      <span>{fmt(orderResult.total)}</span>
                    </div>
                  </div>

                  {/* Tracking link */}
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
                    <p className="mb-2 text-xs text-gray-500">
                      Salve o link para acompanhar seu pedido:
                    </p>
                    <a
                      href={`/cardapio/${establishment.slug}/pedido/${orderResult.order_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-xs font-medium underline"
                      style={{ color: brand }}
                    >
                      {typeof window !== "undefined" ? window.location.origin : ""}/cardapio/{establishment.slug}/pedido/{orderResult.order_id}
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => openMyOrders()}
                    className="w-full rounded-xl py-3 text-sm font-semibold text-white"
                    style={{ backgroundColor: brand }}
                  >
                    📋 Ver todos os meus pedidos
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCart([]);
                      setOrderResult(null);
                      setLiveStatus(null);
                      setScreen("menu");
                    }}
                    className="w-full text-center text-sm font-medium"
                    style={{ color: brand }}
                  >
                    Fazer outro pedido
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
