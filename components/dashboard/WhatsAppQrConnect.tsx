"use client";

import { useEffect, useState } from "react";

type WaStatus = {
  status: "open" | "awaiting_qr" | "disconnected";
  qr: string | null;
};

export default function WhatsAppQrConnect() {
  const [state, setState] = useState<WaStatus | null>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch("/api/whatsapp/status");
        if (!res.ok) throw new Error();
        const data: WaStatus = await res.json();
        if (active) setState(data);
      } catch {
        if (active) setState({ status: "disconnected", qr: null });
      }
    }

    poll();
    const id = setInterval(poll, 3000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  if (!state) {
    return (
      <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
        <span className="h-2 w-2 animate-pulse rounded-full bg-gray-400" />
        Verificando conexão...
      </div>
    );
  }

  if (state.status === "open") {
    return (
      <div className="mt-4 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
        <span className="text-sm font-medium text-green-700">WhatsApp conectado</span>
      </div>
    );
  }

  if (state.status === "awaiting_qr") {
    if (!state.qr) {
      return (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
          Gerando QR Code...
        </div>
      );
    }
    return (
      <div className="mt-4">
        <p className="mb-3 text-sm text-gray-600">
          Abra o WhatsApp no celular →{" "}
          <strong>Dispositivos vinculados</strong> →{" "}
          <strong>Vincular dispositivo</strong> e escaneie:
        </p>
        <img
          src={state.qr}
          alt="QR Code WhatsApp"
          className="h-48 w-48 rounded-xl border border-gray-200"
        />
      </div>
    );
  }

  return (
    <div className="mt-4 flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
      <span className="text-sm text-gray-500">
        Bot não está rodando — inicie o bot local para escanear o QR Code.
      </span>
    </div>
  );
}
