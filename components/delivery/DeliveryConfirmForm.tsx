"use client";

import { useState } from "react";
import {
  isPayOnDelivery,
  PAYMENT_METHOD_SHORT,
} from "@/lib/payments/methods";
import type { PublicDeliveryOrder } from "@/lib/orders/complete-delivery";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function DeliveryConfirmForm({
  order,
  token,
}: {
  order: PublicDeliveryOrder;
  token: string;
}) {
  const needsPayment = Boolean(
    order.payment_method && isPayOnDelivery(order.payment_method)
  );

  const [paymentCollected, setPaymentCollected] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPhoto(null);
      setPhotoPreview(null);
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      if (needsPayment) {
        formData.set("payment_collected", paymentCollected ? "true" : "false");
      }
      if (photo) {
        formData.set("photo", photo);
      }

      const response = await fetch(`/api/delivery/${token}`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao confirmar");

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao confirmar");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✓
        </div>
        <h1 className="text-xl font-bold text-gray-900">Entrega confirmada!</h1>
        <p className="mt-2 text-sm text-gray-600">
          O cliente será avisado no WhatsApp. Você pode fechar esta página.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 sm:py-10">
      <header className="mb-6 text-center">
        <p className="text-sm font-medium text-brand">{order.establishment_name}</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Confirmar entrega</h1>
        <p className="mt-2 text-sm text-gray-600">
          Para: <span className="font-semibold">{order.customer_name || "Cliente"}</span>
        </p>
      </header>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Pedido
        </p>
        <ul className="mt-2 space-y-1 text-sm text-gray-800">
          {order.items.map((item, i) => (
            <li key={i}>
              <span className="font-bold">{item.quantity}x</span> {item.item_name}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-lg font-bold text-gray-900">
          {formatCurrency(order.total_amount)}
        </p>
        {order.payment_method && (
          <p className="mt-1 text-sm text-gray-600">
            Pagamento: {PAYMENT_METHOD_SHORT[order.payment_method]}
          </p>
        )}
        {order.notes && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Obs.: {order.notes}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {needsPayment && (
          <label
            className="flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3"
          >
            <input
              type="checkbox"
              checked={paymentCollected}
              onChange={(e) => setPaymentCollected(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 text-brand focus:ring-brand"
            />
            <span className="text-sm font-medium text-amber-900">
              Cliente pagou em {PAYMENT_METHOD_SHORT[order.payment_method!]}
            </span>
          </label>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Foto da entrega (opcional)
          </label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700"
          />
          {photoPreview && (
            <img
              src={photoPreview}
              alt="Preview"
              className="mt-3 max-h-48 w-full rounded-xl object-cover"
            />
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || (needsPayment && !paymentCollected)}
          className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-brand px-4 py-3 text-base font-bold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "Confirmando..." : "Confirmar que entreguei"}
        </button>

        {needsPayment && !paymentCollected && (
          <p className="text-center text-xs text-gray-500">
            Marque que o cliente pagou antes de confirmar.
          </p>
        )}
      </form>
    </div>
  );
}
