"use client";

import { useEffect, useState } from "react";
import type { WhatsAppInstance } from "@/types/database";

interface InstancesData {
  instances: WhatsAppInstance[];
  primary_instance_id: string | null;
  can_add: boolean;
}

export default function WhatsAppInstancesManager() {
  const [data, setData] = useState<InstancesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [instanceId, setInstanceId] = useState("");
  const [label, setLabel] = useState("Número 2");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadInstances() {
    try {
      const r = await fetch("/api/whatsapp-instances");
      const json = await r.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar instâncias");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInstances();
  }, []);

  async function handleAdd() {
    if (!instanceId.trim()) return;
    setAdding(true);
    setError(null);
    setSuccess(null);

    try {
      const r = await fetch("/api/whatsapp-instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instance_id: instanceId.trim(), label: label.trim() || "Número 2" }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error ?? "Erro ao adicionar");
      setSuccess("Instância adicionada com sucesso!");
      setInstanceId("");
      setLabel("Número 2");
      setShowForm(false);
      await loadInstances();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao adicionar instância");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(id: string) {
    setError(null);
    setSuccess(null);

    try {
      const r = await fetch(`/api/whatsapp-instances?id=${id}`, { method: "DELETE" });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error ?? "Erro ao remover");
      setSuccess("Instância removida.");
      await loadInstances();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao remover instância");
    }
  }

  if (loading) {
    return <div className="h-20 animate-pulse rounded-xl bg-gray-100" />;
  }

  return (
    <div className="space-y-4">
      {/* Primary instance */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Número principal</p>
            <p className="mt-0.5 text-xs text-gray-500">
              {data?.primary_instance_id
                ? <code className="font-mono">{data.primary_instance_id}</code>
                : "Não configurado — defina EVOLUTION_INSTANCE_NAME"}
            </p>
          </div>
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
            Ativo
          </span>
        </div>
      </div>

      {/* Extra instances */}
      {(data?.instances ?? []).map((inst) => (
        <div key={inst.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-700">{inst.label}</p>
              <p className="mt-0.5 truncate text-xs text-gray-500 font-mono">{inst.instance_id}</p>
            </div>
            <button
              type="button"
              onClick={() => handleRemove(inst.id)}
              className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              Remover
            </button>
          </div>
        </div>
      ))}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{success}</p>
      )}

      {/* Add form */}
      {data?.can_add && !showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 text-sm font-medium text-gray-500 hover:border-brand hover:text-brand"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Adicionar 2º número
        </button>
      )}

      {data?.can_add && showForm && (
        <div className="rounded-xl border border-brand/30 bg-brand-50/30 p-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Nome (ex: &quot;Delivery&quot; ou &quot;Número 2&quot;)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={50}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              ID da instância (Evolution) ou URL (Z-API)
            </label>
            <input
              type="text"
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
              placeholder="ex: minha-loja-2"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding || !instanceId.trim()}
              className="flex-1 rounded-lg bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {adding ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null); }}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {!data?.can_add && (data?.instances ?? []).length === 0 && (
        <p className="text-xs text-gray-400">
          Limite de 1 número adicional já atingido ou recurso indisponível no seu plano.
        </p>
      )}

      <p className="text-xs text-gray-400">
        O 2º número precisa estar configurado como webhook apontando para{" "}
        <code className="font-mono">/api/webhooks/whatsapp</code>.
      </p>
    </div>
  );
}
