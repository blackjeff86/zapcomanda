"use client";

import { useState } from "react";
import Logo from "@/components/brand/Logo";

export default function AdminTopBar() {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="fixed top-0 right-0 z-50 flex justify-between items-center h-16 px-6 lg:ml-[280px] w-full lg:w-[calc(100%-280px)] bg-surface border-b border-outline-variant">
      {/* Mobile: logo + menu */}
      <div className="flex items-center gap-4 lg:hidden">
        <button type="button" className="p-1">
          <span className="material-symbols-outlined text-on-surface-variant">menu</span>
        </button>
        <Logo size={28} showWordmark variant="comanda" />
      </div>

      {/* Search bar */}
      <div
        className={`hidden md:flex items-center flex-1 max-w-xl bg-surface-container-low rounded-full px-4 py-2 border transition-all ${
          searchFocused
            ? "border-primary ring-2 ring-primary/20"
            : "border-outline-variant"
        }`}
      >
        <span className="material-symbols-outlined text-outline text-[20px] mr-2">search</span>
        <input
          className="bg-transparent border-none focus:ring-0 text-body-md w-full outline-none text-on-surface placeholder:text-outline"
          placeholder="Pesquisar clientes, faturas..."
          type="text"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-4 ml-auto">
        <button
          type="button"
          className="relative p-2 text-on-surface-variant hover:bg-surface-container-low transition-all rounded-full"
        >
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
        </button>
        <div className="h-6 w-px bg-outline-variant mx-1" />
        <button
          type="button"
          className="text-label-md text-on-surface-variant px-4 py-1 hover:bg-surface-container-low transition-all rounded-lg"
        >
          Suporte
        </button>
        <button
          type="button"
          className="bg-primary text-on-primary text-label-md font-semibold px-6 py-1 rounded-lg hover:shadow-md transition-all active:scale-95"
        >
          Perfil
        </button>
      </div>
    </header>
  );
}
