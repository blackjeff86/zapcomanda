"use client";

import { useState } from "react";
import {
  darkenHex,
  formatPhoneDisplay,
  isStoreOpenForOrders,
} from "@/lib/cardapio/storefront";

type StorefrontEstablishment = {
  name: string;
  logo_url: string | null;
  primary_color: string;
  whatsapp_number: string;
  cover_url: string | null;
  tagline: string | null;
  wait_time_text: string | null;
  is_manually_closed: boolean;
  order_cutoff_time: string | null;
  delivery_fee_enabled: boolean;
  delivery_fee_amount: number;
};

function fmtCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CardapioStoreHeader({
  establishment,
  onMyOrders,
}: {
  establishment: StorefrontEstablishment;
  onMyOrders: () => void;
}) {
  const brand = establishment.primary_color;
  const barColor = darkenHex(brand, 0.45);
  const [logoError, setLogoError] = useState(false);
  const [showStatusInfo, setShowStatusInfo] = useState(false);

  const isOpen = isStoreOpenForOrders(
    establishment.is_manually_closed,
    establishment.order_cutoff_time
  );

  const deliveryLabel = establishment.delivery_fee_enabled
    ? establishment.delivery_fee_amount > 0
      ? fmtCurrency(Number(establishment.delivery_fee_amount))
      : "Grátis"
    : "Só retirada";

  const waitLabel = establishment.wait_time_text?.trim() || "—";
  const phoneLabel = formatPhoneDisplay(establishment.whatsapp_number);
  const waLink = `https://wa.me/${establishment.whatsapp_number.replace(/\D/g, "")}`;

  return (
    <header className="bg-white">
      {/* Cover + actions */}
      <div className="relative">
        {establishment.cover_url ? (
          <img
            src={establishment.cover_url}
            alt=""
            className="h-36 w-full object-cover sm:h-44"
          />
        ) : (
          <div
            className="h-36 w-full sm:h-44"
            style={{
              background: `linear-gradient(135deg, ${brand} 0%, ${darkenHex(brand, 0.2)} 100%)`,
            }}
          />
        )}

        <button
          type="button"
          onClick={onMyOrders}
          className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-white/40 bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur-sm"
        >
          <span>📋</span>
          <span>Meus Pedidos</span>
        </button>
      </div>

      {/* Logo + identity */}
      <div className="relative px-4 pb-4 text-center">
        <div className="mx-auto -mt-10 mb-3 flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">
          {establishment.logo_url && !logoError ? (
            <img
              src={establishment.logo_url}
              alt={establishment.name}
              className="h-full w-full object-cover"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span
              className="text-2xl font-bold"
              style={{ color: brand }}
            >
              {establishment.name[0]?.toUpperCase() ?? "?"}
            </span>
          )}
        </div>

        <h1 className="text-lg font-bold uppercase tracking-wide text-gray-900 sm:text-xl">
          {establishment.name}
        </h1>

        {establishment.tagline?.trim() && (
          <p className="mt-1 text-sm text-gray-600">{establishment.tagline}</p>
        )}

        <button
          type="button"
          onClick={() => setShowStatusInfo((v) => !v)}
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-bold shadow-sm"
        >
          <span className={isOpen ? "text-green-600" : "text-red-600"}>
            {isOpen ? "ABERTO" : "FECHADO"}
          </span>
          <svg
            className={`h-4 w-4 text-gray-400 transition ${showStatusInfo ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showStatusInfo && (
          <p className="mt-2 text-xs text-gray-500">
            {isOpen
              ? establishment.order_cutoff_time
                ? `Pedidos até ${establishment.order_cutoff_time.slice(0, 5)}`
                : "Aceitando pedidos agora"
              : establishment.is_manually_closed
                ? "Estabelecimento fechado temporariamente"
                : "Horário de pedidos encerrado hoje"}
          </p>
        )}
      </div>

      {/* Info bar */}
      <div
        className="grid grid-cols-3 gap-1 px-2 py-3 text-center text-white sm:px-4"
        style={{ backgroundColor: barColor }}
      >
        <div className="px-1">
          <p className="text-[10px] font-medium uppercase tracking-wide opacity-90 sm:text-xs">
            Taxa de entrega
          </p>
          <p className="mt-0.5 text-xs font-semibold sm:text-sm">{deliveryLabel}</p>
        </div>
        <div className="px-1 border-x border-white/20">
          <p className="text-[10px] font-medium uppercase tracking-wide opacity-90 sm:text-xs">
            Tempo de espera
          </p>
          <p className="mt-0.5 text-xs font-semibold sm:text-sm">{waitLabel}</p>
        </div>
        <div className="px-1">
          <p className="text-[10px] font-medium uppercase tracking-wide opacity-90 sm:text-xs">
            Telefone
          </p>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 block text-xs font-semibold underline-offset-2 hover:underline sm:text-sm"
          >
            {phoneLabel}
          </a>
        </div>
      </div>
    </header>
  );
}
