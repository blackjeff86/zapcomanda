"use client";

import { useState } from "react";
import { buildDeliveryUrl } from "@/lib/orders/delivery-token";

export default function CopyDeliveryLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined"
      ? buildDeliveryUrl(token, window.location.origin)
      : buildDeliveryUrl(token);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copie o link de entrega:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5 text-sm font-semibold text-violet-900 hover:bg-violet-100"
    >
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      {copied ? "Link copiado!" : "Enviar link ao entregador (WhatsApp)"}
    </button>
  );
}
