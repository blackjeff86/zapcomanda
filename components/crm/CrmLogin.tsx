"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CrmLogin() {
  const router = useRouter();
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  function formatarTelefone(valor: string): string {
    const digits = valor.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const res = await fetch("/api/crm/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone }),
      });

      if (res.ok) {
        const { nome } = await res.json();
        router.push("/crm");
        router.refresh();
        return;
      }

      if (res.status === 401) {
        setErro("Número não autorizado. Verifique e tente novamente.");
      } else {
        setErro("Erro ao verificar. Tente novamente.");
      }
    } catch {
      setErro("Sem conexão. Verifique a internet.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">Z</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">ZapComanda</h1>
          <p className="text-sm text-gray-400 mt-1">Painel interno de leads</p>
        </div>

        {/* Form */}
        <form onSubmit={entrar} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Seu número de celular
            </label>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="(21) 99999-9999"
              value={telefone}
              onChange={(e) => {
                setErro("");
                setTelefone(formatarTelefone(e.target.value));
              }}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500 text-center tracking-widest"
            />
          </div>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 text-center">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando || telefone.replace(/\D/g, "").length < 10}
            className="w-full py-3 rounded-xl bg-green-600 text-white font-medium disabled:opacity-40 hover:bg-green-700 transition-colors"
          >
            {carregando ? "Verificando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-300 mt-6">
          Acesso restrito — ZapComanda &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
