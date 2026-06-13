"use client";

import { useState } from "react";
import type { MemberRole } from "@/types/database";

type Member = {
  id: string;
  user_id: string;
  role: MemberRole;
  name: string;
  email: string;
  created_at: string;
};

type Owner = {
  user_id: string;
  email: string | null;
};

type Props = {
  owner: Owner;
  initialMembers: Member[];
};

const ROLE_LABELS: Record<MemberRole, string> = {
  admin: "Administrador",
  caixa: "Caixa",
};

const ROLE_COLORS: Record<MemberRole, string> = {
  admin: "bg-violet-100 text-violet-700",
  caixa: "bg-sky-100 text-sky-700",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function MembrosClient({ owner, initialMembers }: Props) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "caixa" as MemberRole });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function resetForm() {
    setForm({ name: "", email: "", password: "", role: "caixa" });
    setError("");
    setShowForm(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as Member & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar membro");
      setMembers((prev) => [...prev, data]);
      setSuccess(`Conta de ${data.name} criada com sucesso.`);
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar membro");
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(member: Member, newRole: MemberRole) {
    const prev = members;
    setMembers((m) => m.map((x) => (x.id === member.id ? { ...x, role: newRole } : x)));
    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setMembers(prev);
    }
  }

  async function handleDelete(member: Member) {
    if (!confirm(`Remover ${member.name}? O acesso será revogado imediatamente.`)) return;
    setDeletingId(member.id);
    try {
      await fetch(`/api/members/${member.id}`, { method: "DELETE" });
      setMembers((m) => m.filter((x) => x.id !== member.id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <svg className="h-4 w-4 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm text-green-800">{success}</p>
          <button type="button" onClick={() => setSuccess("")} className="ml-auto text-green-600 hover:text-green-800">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Members list */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="font-semibold text-gray-900">Membros da equipe</h3>
            <p className="mt-0.5 text-xs text-gray-500">{members.length + 1} pessoa{members.length !== 0 ? "s" : ""} com acesso ao painel</p>
          </div>
          <button
            type="button"
            onClick={() => { setShowForm(true); setSuccess(""); setError(""); }}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Adicionar
          </button>
        </div>

        <ul className="divide-y divide-gray-100">
          {/* Owner row */}
          <li className="flex items-center gap-4 px-6 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand font-semibold text-sm text-white">
              {owner.email?.charAt(0).toUpperCase() ?? "P"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">{owner.email ?? "Proprietário"}</p>
              <p className="text-xs text-gray-500">Conta do proprietário</p>
            </div>
            <span className="shrink-0 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
              Proprietário
            </span>
          </li>

          {members.length === 0 && (
            <li className="px-6 py-8 text-center text-sm text-gray-400">
              Nenhum funcionário cadastrado ainda. Clique em &quot;Adicionar&quot; para criar o primeiro acesso.
            </li>
          )}

          {members.map((member) => (
            <li key={member.id} className="flex items-center gap-4 px-6 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 font-semibold text-sm text-gray-600">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{member.name}</p>
                <p className="truncate text-xs text-gray-500">{member.email}</p>
                <p className="text-xs text-gray-400">Desde {fmtDate(member.created_at)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member, e.target.value as MemberRole)}
                  className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand ${ROLE_COLORS[member.role]}`}
                >
                  <option value="admin">Administrador</option>
                  <option value="caixa">Caixa</option>
                </select>
                <button
                  type="button"
                  disabled={deletingId === member.id}
                  onClick={() => handleDelete(member)}
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  title="Remover membro"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Permissions info */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h4 className="font-semibold text-gray-900">Permissões por perfil</h4>
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Funcionalidade</th>
                <th className="px-4 py-2.5 text-center font-medium text-gray-600">Proprietário</th>
                <th className="px-4 py-2.5 text-center font-medium text-gray-600">Admin</th>
                <th className="px-4 py-2.5 text-center font-medium text-gray-600">Caixa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { feature: "Pedidos", owner: true, admin: true, caixa: true },
                { feature: "Caixa (POS)", owner: true, admin: true, caixa: true },
                { feature: "Cardápio", owner: true, admin: true, caixa: true },
                { feature: "Clientes", owner: true, admin: true, caixa: true },
                { feature: "Relatório", owner: true, admin: true, caixa: true },
                { feature: "Broadcast", owner: true, admin: true, caixa: true },
                { feature: "Configurações gerais", owner: true, admin: true, caixa: true },
                { feature: "Chave Pix", owner: true, admin: true, caixa: false },
                { feature: "Gerenciar membros", owner: true, admin: true, caixa: false },
              ].map(({ feature, owner, admin, caixa }) => (
                <tr key={feature}>
                  <td className="px-4 py-2.5 text-gray-700">{feature}</td>
                  {[owner, admin, caixa].map((allowed, i) => (
                    <td key={i} className="px-4 py-2.5 text-center">
                      {allowed ? (
                        <span className="inline-flex items-center justify-center">
                          <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center">
                          <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add member modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/40" onClick={resetForm} />
          <div className="relative w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Adicionar membro</h3>
              <button type="button" onClick={resetForm} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nome</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Maria Silva"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">E-mail</label>
                <input
                  required
                  type="email"
                  placeholder="funcionario@email.com"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Senha temporária</label>
                <input
                  required
                  type="password"
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <p className="mt-1 text-xs text-gray-400">Compartilhe a senha com o funcionário. Ele poderá alterá-la depois.</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Perfil de acesso</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["caixa", "admin"] as MemberRole[]).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, role }))}
                      className={`rounded-xl border-2 px-3 py-2.5 text-left transition ${
                        form.role === role
                          ? "border-brand bg-brand/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-900">{ROLE_LABELS[role]}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {role === "caixa" ? "Acesso a tudo, exceto chave Pix" : "Acesso total ao painel"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
                >
                  {saving ? "Criando..." : "Criar conta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
