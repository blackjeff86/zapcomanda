"use client";

import { useState } from "react";
import CopyDeliveryLink from "@/components/dashboard/CopyDeliveryLink";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import CashChangeSummary from "@/components/orders/CashChangeSummary";
import OrderStepper, { OrderStatusBanner } from "@/components/dashboard/OrderStepper";
import {
  isPayOnDelivery,
  PAYMENT_METHOD_SHORT,
} from "@/lib/payments/methods";
import {
  getPrevOrderStatus,
  ORDER_STATUS_UI,
} from "@/lib/orders/status-ui";
import type { OrderRow } from "@/lib/orders/normalize";
import type { OrderStatus } from "@/types/database";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPhone(phone: string): string | null {
  if (phone.includes("@")) return null;
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  if (local.length === 11) {
    return local.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (local.length === 10) {
    return local.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

export default function OrderCard({
  order,
  updating,
  onStatusChange,
}: {
  order: OrderRow;
  updating: boolean;
  onStatusChange: (status: OrderStatus, options?: { payment_collected?: boolean }) => void;
}) {
  const ui = ORDER_STATUS_UI[order.status];
  const prevStatus = getPrevOrderStatus(order.status);
  const prevLabel = prevStatus ? ORDER_STATUS_UI[prevStatus].shortLabel : null;

  const rawPhone = order.customers.phone;
  const isLidJid = rawPhone?.includes("@");
  const customerName = order.customers.name || "Cliente";
  const customerPhone = rawPhone && !isLidJid ? formatPhone(rawPhone) : null;
  const whatsappUrl = rawPhone && !isLidJid
    ? `https://wa.me/${rawPhone.replace(/\D/g, "")}`
    : null;

  const [confirmDialog, setConfirmDialog] = useState<{
    targetStatus: OrderStatus;
    title: string;
    message: string;
    confirmLabel: string;
  } | null>(null);

  const needsPaymentOnDelivery =
    order.payment_method &&
    isPayOnDelivery(order.payment_method) &&
    !order.payment_collected;

  function handleAdvance() {
    if (!ui.nextStatus) return;

    if (ui.nextStatus === "paid") {
      setConfirmDialog({
        targetStatus: "paid",
        title: "Confirmar pagamento Pix",
        message:
          "O Pix já caiu na sua conta? Confirme só quando o valor estiver no extrato do banco.",
        confirmLabel: "Sim, Pix recebido",
      });
      return;
    }

    if (ui.nextStatus === "delivered") {
      if (needsPaymentOnDelivery) {
        setConfirmDialog({
          targetStatus: "delivered",
          title: "Confirmar entrega e pagamento",
          message: `O cliente recebeu o pedido e pagou em ${PAYMENT_METHOD_SHORT[order.payment_method!]}? Confirme só quando a entrega e o pagamento estiverem finalizados.`,
          confirmLabel: "Sim, recebeu e pagou",
        });
      } else {
        setConfirmDialog({
          targetStatus: "delivered",
          title: "Confirmar entrega",
          message: "O cliente já recebeu este pedido? Confirme só quando a entrega for finalizada.",
          confirmLabel: "Sim, cliente recebeu",
        });
      }
      return;
    }

    onStatusChange(ui.nextStatus);
  }

  function handleRevert() {
    if (!prevStatus || !prevLabel) return;

    setConfirmDialog({
      targetStatus: prevStatus,
      title: "Voltar etapa",
      message: `Voltar o pedido para "${prevLabel}"? Use isso se clicou na opção errada.`,
      confirmLabel: `Voltar para ${prevLabel}`,
    });
  }

  function handleConfirmDialog() {
    if (!confirmDialog) return;
    const options =
      confirmDialog.targetStatus === "delivered"
        ? { payment_collected: true }
        : undefined;
    onStatusChange(confirmDialog.targetStatus, options);
    setConfirmDialog(null);
  }

  return (
    <>
      <ConfirmDialog
        open={confirmDialog !== null}
        title={confirmDialog?.title ?? ""}
        message={confirmDialog?.message ?? ""}
        confirmLabel={confirmDialog?.confirmLabel}
        cancelLabel="Cancelar"
        loading={updating}
        onConfirm={handleConfirmDialog}
        onCancel={() => setConfirmDialog(null)}
      />

    <article
      id={`order-${order.id}`}
      className={`rounded-xl border border-gray-200 border-l-4 bg-white shadow-sm ${ui.borderClass}`}
    >
      <div className="p-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-gray-500">
              Pedido das {formatTime(order.created_at)}
              {" · "}
              <span className="font-mono font-semibold tracking-wide">
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
            </p>
            <h3 className="text-lg font-bold text-gray-900 sm:text-xl">{customerName}</h3>
            {customerPhone && (
              <p className="text-xs text-gray-500 sm:text-sm">{customerPhone}</p>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ui.badgeClass}`}
            >
              {ui.shortLabel}
            </span>
            {order.payment_method && (
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  needsPaymentOnDelivery
                    ? "border-amber-200 bg-amber-50 text-amber-900"
                    : "border-gray-200 bg-gray-50 text-gray-700"
                }`}
              >
                {PAYMENT_METHOD_SHORT[order.payment_method]}
                {needsPaymentOnDelivery ? " · cobrar na entrega" : ""}
              </span>
            )}
            <p className="text-xl font-bold text-gray-900 sm:text-2xl">
              {formatCurrency(Number(order.total_amount))}
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-2 rounded-lg bg-gray-50 p-2.5 sm:p-3">
          <OrderStatusBanner ui={ui} />
          <OrderStepper status={order.status} />
        </div>

        <div className="mt-3">
          <p className="mb-1.5 text-xs font-semibold text-gray-600">O que foi pedido</p>
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100 bg-gray-50 px-3 py-0.5">
            {order.order_items.map((item, index) => (
              <li key={index} className="py-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-gray-900">
                    <span className="font-bold">{item.quantity}x</span> {item.item_name}
                  </span>
                  <span className="shrink-0 font-medium text-gray-700">
                    {formatCurrency(Number(item.subtotal))}
                  </span>
                </div>
                {item.addons && item.addons.length > 0 && (
                  <p className="mt-0.5 text-xs text-brand-dark">
                    +{" "}
                    {item.addons
                      .map((a) => `${a.name} (${formatCurrency(Number(a.price))})`)
                      .join(", ")}
                  </p>
                )}
                {item.notes && (
                  <p className="mt-0.5 text-xs font-medium text-amber-800">⚠ {item.notes}</p>
                )}
              </li>
            ))}
          </ul>
          {order.delivery_fee > 0 && (
            <div className="mt-2 flex justify-between px-1 text-sm text-gray-600">
              <span>Taxa de entrega</span>
              <span className="font-medium">{formatCurrency(order.delivery_fee)}</span>
            </div>
          )}
        </div>

        {order.payment_method === "cash" && order.cash_tender_amount != null && (
          <div className="mt-3">
            <CashChangeSummary
              total={Number(order.total_amount)}
              cashTenderAmount={order.cash_tender_amount}
              changeAmount={order.change_amount}
            />
          </div>
        )}

        {order.delivered_at && order.status === "delivered" && (
          <p className="mt-2 text-xs text-gray-500">
            Entregue em{" "}
            {new Date(order.delivered_at).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {order.delivery_confirmed_by === "delivery_link" && " · via link do entregador"}
          </p>
        )}

        {order.delivery_photo_url && (
          <a
            href={order.delivery_photo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block overflow-hidden rounded-xl border border-gray-200"
          >
            <img
              src={order.delivery_photo_url}
              alt="Foto da entrega"
              className="max-h-40 w-full object-cover"
            />
            <p className="bg-gray-50 px-3 py-1.5 text-xs text-gray-500">Ver foto da entrega</p>
          </a>
        )}

        {order.notes && (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 sm:text-sm">
            <span className="font-semibold">Obs.:</span> {order.notes}
          </p>
        )}

        <div className="mt-4 flex flex-col gap-2">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border-2 border-[#075e54] bg-[#075e54] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#064e46] active:scale-[0.98] sm:text-base"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.11.547 4.092 1.504 5.845L0 24l6.335-1.662A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.78 9.78 0 01-4.93-1.338l-.35-.207-3.757.984 1.005-3.648-.228-.374A9.778 9.778 0 1121.818 12 9.832 9.832 0 0112 21.818z" />
              </svg>
              WhatsApp
            </a>
          )}

          {order.status === "out_for_delivery" && order.delivery_token && (
            <div className="space-y-1">
              <CopyDeliveryLink token={order.delivery_token} />
              <p className="text-center text-xs text-gray-500">
                Opcional: envie o link ao motoboy para ele confirmar a entrega no celular, sem
                entrar no painel.
              </p>
            </div>
          )}

          {ui.nextStatus && ui.actionTitle && (
            <button
              type="button"
              onClick={handleAdvance}
              disabled={updating}
              className="flex min-h-[48px] w-full flex-col items-center justify-center rounded-lg bg-brand px-3 py-2.5 text-white shadow-sm transition hover:bg-brand-dark active:scale-[0.98] disabled:opacity-60"
            >
              <span className="text-base font-bold sm:text-lg">
                {updating ? "Salvando..." : ui.actionTitle}
              </span>
              {!updating && ui.actionHint && (
                <span className="mt-0.5 text-xs font-normal text-white/90">
                  {ui.actionHint}
                </span>
              )}
            </button>
          )}

          {prevStatus && prevLabel && (
            <button
              type="button"
              onClick={handleRevert}
              disabled={updating}
              className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              ↩ Voltar para: {prevLabel}
            </button>
          )}
        </div>
      </div>
    </article>
    </>
  );
}
