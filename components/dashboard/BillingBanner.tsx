"use client";

import { useState } from "react";
import type { BillingNotification, MemberRole } from "@/types/database";

interface BillingBannerProps {
  notification: BillingNotification;
  userRole: MemberRole;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function BillingBanner({ notification, userRole }: BillingBannerProps) {
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  if (userRole === "caixa") return null;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(notification.pix_br_code)}`;

  const copyPix = async () => {
    await navigator.clipboard.writeText(notification.pix_br_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const confirmPayment = async () => {
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch(`/api/billing/confirm/${notification.id}`, {
        method: "POST",
      });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? "Erro ao confirmar");
      }
      setDone(true);
      setTimeout(() => window.location.reload(), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao confirmar pagamento");
    } finally {
      setConfirming(false);
    }
  };

  if (done) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Pagamento confirmado! Obrigado. Sua assinatura foi ativada.
      </div>
    );
  }

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 shadow-sm">
      {/* Header */}
      <div className="border-b border-amber-200 bg-amber-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span className="text-sm font-semibold text-amber-800">Aviso de cobrança — ZapComanda</span>
        </div>
      </div>

      <div className="px-5 py-4">
        {notification.message && (
          <p className="mb-4 text-sm text-amber-900">{notification.message}</p>
        )}

        <div className="flex flex-col gap-4 sm:flex-row">
          {/* PIX info */}
          <div className="flex-1 rounded-xl border border-amber-200 bg-white p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Valor</p>
            <p className="text-2xl font-bold text-gray-900">{fmt(notification.amount)}</p>

            <p className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Chave PIX</p>
            <p className="break-all font-mono text-sm text-gray-800">{notification.pix_key}</p>
            <p className="mt-0.5 text-xs capitalize text-gray-400">{notification.pix_key_type}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyPix}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                {copied ? (
                  <>
                    <svg className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Copiado!
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar Pix copia e cola
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowQr((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                </svg>
                {showQr ? "Ocultar QR Code" : "Ver QR Code"}
              </button>
            </div>
          </div>

          {/* QR Code */}
          {showQr && (
            <div className="flex flex-col items-center rounded-xl border border-amber-200 bg-white p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Escaneie para pagar
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt="QR Code PIX"
                width={180}
                height={180}
                className="rounded-lg"
              />
              <p className="mt-2 text-center text-[10px] text-gray-400">
                Abra o app do seu banco<br />e escaneie o código
              </p>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-3 text-xs text-red-600">{error}</p>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={confirmPayment}
            disabled={confirming}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
          >
            {confirming ? "Confirmando…" : "Já paguei — Confirmar pagamento"}
          </button>
          <p className="text-xs text-amber-700">
            Após confirmar, sua assinatura será ativada automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
