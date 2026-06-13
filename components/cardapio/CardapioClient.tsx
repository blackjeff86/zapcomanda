"use client";

import { useState, useMemo } from "react";
import type { PaymentMethod } from "@/types/database";

type Addon = { id: string; name: string; price: number; is_active: boolean };

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  photo_url: string | null;
  category: string;
  sort_order: number;
  menu_item_addons: Addon[];
};

type Establishment = {
  id: string;
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
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

type Screen = "menu" | "cart" | "checkout" | "confirmed";

type CheckoutForm = {
  name: string;
  phone: string;
  deliveryType: "pickup" | "delivery";
  paymentMethod: PaymentMethod;
};

type OrderResult = {
  order_id: string;
  order_ref: string;
  total: number;
  delivery_fee: number;
  pix_copy_paste: string | null;
};

function fmt(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CardapioClient({
  establishment,
  menuItems,
}: {
  establishment: Establishment;
  menuItems: MenuItem[];
}) {
  const brand = establishment.primary_color;

  const categories = useMemo(
    () => Array.from(new Set(menuItems.map((i) => i.category))),
    [menuItems]
  );

  const [activeCategory, setActiveCategory] = useState(categories[0] ?? "");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [screen, setScreen] = useState<Screen>("menu");
  const [checkout, setCheckout] = useState<CheckoutForm>({
    name: "",
    phone: "",
    deliveryType: establishment.delivery_fee_enabled ? "delivery" : "pickup",
    paymentMethod: establishment.accepted_payment_methods[0] ?? "cash",
  });
  const [processing, setProcessing] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const visibleItems = useMemo(
    () => menuItems.filter((i) => i.category === activeCategory),
    [menuItems, activeCategory]
  );

  const cartTotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const deliveryFee =
    checkout.deliveryType === "delivery" && establishment.delivery_fee_enabled
      ? Number(establishment.delivery_fee_amount)
      : 0;
  const total = cartTotal + deliveryFee;

  function getQty(id: string) {
    return cart.find((c) => c.menuItemId === id)?.quantity ?? 0;
  }

  function setQty(item: MenuItem, delta: number) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (!existing) {
        if (delta <= 0) return prev;
        return [
          ...prev,
          { menuItemId: item.id, name: item.name, unitPrice: Number(item.price), quantity: delta },
        ];
      }
      const next = existing.quantity + delta;
      if (next <= 0) return prev.filter((c) => c.menuItemId !== item.id);
      return prev.map((c) =>
        c.menuItemId === item.id ? { ...c, quantity: next } : c
      );
    });
  }

  async function handleSubmit() {
    if (!checkout.name.trim() || !checkout.phone.trim()) {
      setOrderError("Preencha seu nome e WhatsApp.");
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
          payment_method: checkout.paymentMethod,
          items: cart.map((c) => ({
            menu_item_id: c.menuItemId,
            item_name: c.name,
            quantity: c.quantity,
            unit_price: c.unitPrice,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao enviar pedido");

      setOrderResult(data);
      setScreen("confirmed");
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

  const PAYMENT_LABELS: Record<PaymentMethod, string> = {
    pix: "Pix",
    credit_card: "Cartão de crédito",
    debit_card: "Cartão de débito",
    cash: "Dinheiro",
    meal_voucher: "Vale refeição",
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 shadow-sm"
        style={{ backgroundColor: brand }}
      >
        {establishment.logo_url ? (
          <img
            src={establishment.logo_url}
            alt={establishment.name}
            className="h-9 w-9 rounded-full border-2 border-white/30 object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/30 bg-white/20 text-sm font-bold text-white">
            {establishment.name[0]?.toUpperCase()}
          </div>
        )}
        <h1 className="text-base font-bold text-white">{establishment.name}</h1>
      </header>

      {/* Category tabs */}
      <div className="sticky top-[57px] z-10 flex gap-2 overflow-x-auto bg-white px-4 py-2.5 shadow-sm scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
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

      {/* Items */}
      <div className="px-4 pt-4 space-y-3">
        {visibleItems.map((item) => {
          const qty = getQty(item.id);
          return (
            <div
              key={item.id}
              className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
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
                  <p className="font-semibold text-gray-900 leading-tight">{item.name}</p>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">
                    {fmt(Number(item.price))}
                  </span>
                  {qty === 0 ? (
                    <button
                      type="button"
                      onClick={() => setQty(item, 1)}
                      className="rounded-full px-3 py-1 text-sm font-semibold text-white"
                      style={{ backgroundColor: brand }}
                    >
                      + Adicionar
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQty(item, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border-2 text-lg font-bold leading-none"
                        style={{ borderColor: brand, color: brand }}
                      >
                        −
                      </button>
                      <span className="w-4 text-center text-sm font-bold">{qty}</span>
                      <button
                        type="button"
                        onClick={() => setQty(item, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-lg font-bold leading-none text-white"
                        style={{ backgroundColor: brand }}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
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

      {/* Cart / Checkout / Confirmation overlay */}
      {screen !== "menu" && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          {/* Overlay header */}
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
              <div className="p-4 space-y-4">
                {cart.map((item) => (
                  <div key={item.menuItemId} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const mi = menuItems.find((m) => m.id === item.menuItemId);
                            if (mi) setQty(mi, -1);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-full border-2 text-base font-bold"
                          style={{ borderColor: brand, color: brand }}
                        >
                          −
                        </button>
                        <span className="w-4 text-center text-sm font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const mi = menuItems.find((m) => m.id === item.menuItemId);
                            if (mi) setQty(mi, 1);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-base font-bold text-white"
                          style={{ backgroundColor: brand }}
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{item.name}</span>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-gray-900">
                      {fmt(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}

                <div className="border-t border-gray-100 pt-3">
                  <div className="flex justify-between text-base font-bold text-gray-900">
                    <span>Total</span>
                    <span>{fmt(cartTotal)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setScreen("checkout")}
                  className="mt-2 w-full rounded-xl py-3.5 text-sm font-bold text-white"
                  style={{ backgroundColor: brand }}
                >
                  Fazer pedido
                </button>
              </div>
            )}

            {/* Checkout screen */}
            {screen === "checkout" && (
              <div className="p-4 space-y-5">
                {orderError && (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{orderError}</p>
                )}

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">Seus dados</h3>
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={checkout.name}
                    onChange={(e) => setCheckout((p) => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
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
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>

                {establishment.delivery_fee_enabled && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700">Recebimento</h3>
                    {(["delivery", "pickup"] as const).map((type) => (
                      <label
                        key={type}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${
                          checkout.deliveryType === type
                            ? "border-current bg-opacity-5"
                            : "border-gray-200"
                        }`}
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
                          onChange={() => setCheckout((p) => ({ ...p, deliveryType: type }))}
                          className="accent-brand"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {type === "delivery"
                            ? `Entrega — + ${fmt(Number(establishment.delivery_fee_amount))}`
                            : "Retirar no local — grátis"}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700">Pagamento</h3>
                  {establishment.accepted_payment_methods.map((method) => (
                    <label
                      key={method}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${
                        checkout.paymentMethod === method ? "" : "border-gray-200"
                      }`}
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
                        className="accent-brand"
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {PAYMENT_LABELS[method]}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="rounded-xl bg-gray-50 p-4 space-y-1">
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
                  <div className="flex justify-between text-base font-bold text-gray-900 pt-1 border-t border-gray-200 mt-1">
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
            {screen === "confirmed" && orderResult && (
              <div className="p-6 space-y-6 text-center">
                <div>
                  <div
                    className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3xl text-white"
                    style={{ backgroundColor: brand }}
                  >
                    ✓
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Pedido recebido!</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Pedido #{orderResult.order_ref}
                  </p>
                </div>

                {/* Order summary */}
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left space-y-1">
                  {cart.map((item) => (
                    <div key={item.menuItemId} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.quantity}× {item.name}
                      </span>
                      <span className="font-medium text-gray-900">
                        {fmt(item.unitPrice * item.quantity)}
                      </span>
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

                {/* PIX */}
                {orderResult.pix_copy_paste && (
                  <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-left space-y-3">
                    <p className="text-sm font-semibold text-green-800">
                      Pague agora via Pix para confirmar o pedido
                    </p>
                    <div className="rounded-xl border border-green-200 bg-white px-3 py-2">
                      <p className="break-all text-xs text-gray-600 font-mono leading-relaxed">
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

                <p className="text-sm text-gray-500">
                  Você receberá atualizações no WhatsApp conforme o pedido avança.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setCart([]);
                    setOrderResult(null);
                    setScreen("menu");
                  }}
                  className="text-sm font-medium"
                  style={{ color: brand }}
                >
                  Fazer outro pedido
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
