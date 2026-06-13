"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardQuickActions({
  initialIsClosed,
  devMode,
}: {
  initialIsClosed: boolean;
  devMode: boolean;
}) {
  const [isClosed, setIsClosed] = useState(initialIsClosed);
  const [toggling, setToggling] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  async function toggleStatus() {
    setToggling(true);
    const next = !isClosed;
    try {
      const res = await fetch("/api/establishments/me/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_manually_closed: next }),
      });
      if (res.ok) {
        setIsClosed(next);
        router.refresh();
      }
    } finally {
      setToggling(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex flex-col gap-2 border-t border-gray-100 p-4">
      {/* Open/Closed toggle */}
      <button
        type="button"
        onClick={toggleStatus}
        disabled={toggling}
        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
          isClosed
            ? "bg-red-50 text-red-700 hover:bg-red-100"
            : "bg-green-50 text-green-700 hover:bg-green-100"
        }`}
      >
        <span className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              isClosed ? "bg-red-500" : "bg-green-500"
            } ${toggling ? "opacity-50" : "animate-pulse"}`}
          />
          {toggling ? "Atualizando..." : isClosed ? "Fechado" : "Aberto"}
        </span>
        <span className="text-xs font-normal opacity-70">
          {isClosed ? "Toque para abrir" : "Toque para fechar"}
        </span>
      </button>

      {/* Logout — hidden in dev mode */}
      {!devMode && (
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-60"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {loggingOut ? "Saindo..." : "Sair da conta"}
        </button>
      )}
    </div>
  );
}
