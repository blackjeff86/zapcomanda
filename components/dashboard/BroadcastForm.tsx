"use client";

import { useEffect, useState } from "react";

interface Customer {
  id: string;
  phone: string;
  name: string | null;
}

interface BroadcastResult {
  sent: number;
  errors: number;
  total: number;
}

export default function BroadcastForm() {
  const [message, setMessage] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/broadcast")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setCustomers(json.customers ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingCustomers(false));
  }, []);

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Erro ao enviar");
      setResult(data);
      setMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao enviar broadcast");
    } finally {
      setSending(false);
    }
  }

  const remaining = 1000 - message.length;
  const canSend = message.trim().length > 0 && customers.length > 0 && !sending;

  return (
    <div className="space-y-6">
      {/* Audience card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700">Destinatários</h3>
        {loadingCustomers ? (
          <div className="mt-3 h-5 w-32 animate-pulse rounded bg-gray-200" />
        ) : (
          <div className="mt-2 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
              {customers.length}
            </span>
            <p className="text-sm text-gray-600">
              {customers.length === 0
                ? "Nenhum cliente cadastrado ainda. Os clientes são adicionados automaticamente ao fazer pedidos."
                : customers.length === 1
                ? "1 cliente cadastrado"
                : `${customers.length} clientes cadastrados`}
            </p>
          </div>
        )}
      </div>

      {/* Message composer */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-semibold text-gray-700" htmlFor="broadcast-message">
          Mensagem
        </label>
        <p className="mt-0.5 text-xs text-gray-400">
          A mensagem será enviada via WhatsApp para todos os clientes cadastrados.
        </p>
        <textarea
          id="broadcast-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={1000}
          rows={5}
          placeholder="Ex: Oi! Hoje temos marmita especial de frango por R$ 15. Peça pelo WhatsApp!"
          className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand resize-none"
        />
        <div className="mt-1 flex items-center justify-between">
          <span className={`text-xs ${remaining < 100 ? "text-amber-600" : "text-gray-400"}`}>
            {remaining} caracteres restantes
          </span>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {result && (
          <div className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            <p className="font-semibold">Broadcast enviado!</p>
            <p className="mt-0.5">
              {result.sent} de {result.total} mensagens enviadas com sucesso.
              {result.errors > 0 && ` ${result.errors} falharam.`}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Enviando...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Enviar para {customers.length} cliente{customers.length !== 1 ? "s" : ""}
            </>
          )}
        </button>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Atenção:</strong> Use com moderação. Mensagens em excesso podem fazer clientes bloquearem o número.
        Ideal para promoções e avisos importantes.
      </div>
    </div>
  );
}
