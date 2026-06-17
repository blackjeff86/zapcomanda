"use client";

import { useState, useMemo } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Lead = {
  id: string;
  nome: string;
  telefone: string | null;
  local_endereco: string | null;
  avaliacao: string | null;
  canal_origem: string;
  status: string;
  tipo_contato: string | null;
  tem_interesse: boolean | null;
  contatado_em: string | null;
  respondeu: boolean | null;
  notas: string | null;
  status_google: string | null;
  instagram_url: string | null;
  website_url: string | null;
  verificado_em: string | null;
};

type ContatoForm = {
  tipo_contato: string;
  resultado: string;
  notas: string;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUS: Record<string, { emoji: string; label: string; cor: string }> = {
  novo:          { emoji: "🆕", label: "Novo",          cor: "bg-gray-100 text-gray-700" },
  contatado:     { emoji: "📨", label: "Contatado",     cor: "bg-blue-100 text-blue-700" },
  respondeu:     { emoji: "💬", label: "Respondeu",     cor: "bg-yellow-100 text-yellow-800" },
  demo:          { emoji: "📅", label: "Demo agendada", cor: "bg-purple-100 text-purple-700" },
  fechado:       { emoji: "✅", label: "Fechado",       cor: "bg-green-100 text-green-700" },
  sem_interesse: { emoji: "❌", label: "Sem interesse", cor: "bg-red-100 text-red-700" },
  follow_up:     { emoji: "🔄", label: "Follow-up",    cor: "bg-orange-100 text-orange-700" },
};

const RESULTADOS = [
  { value: "nao_respondeu",   label: "📵 Não respondeu",           status: "contatado",     respondeu: false, interesse: null },
  { value: "respondeu_nao",   label: "👎 Respondeu — sem interesse", status: "sem_interesse", respondeu: true,  interesse: false },
  { value: "respondeu_sim",   label: "👍 Respondeu — tem interesse", status: "respondeu",     respondeu: true,  interesse: true },
  { value: "demo",            label: "📅 Demo agendada",            status: "demo",          respondeu: true,  interesse: true },
  { value: "fechado",         label: "✅ Fechou! Novo cliente!",    status: "fechado",       respondeu: true,  interesse: true },
  { value: "follow_up",       label: "🔄 Follow-up pendente",       status: "follow_up",     respondeu: null,  interesse: null },
];

const TIPOS_CONTATO = [
  { value: "whatsapp",   label: "WhatsApp" },
  { value: "ligacao",    label: "Ligação" },
  { value: "instagram",  label: "Instagram" },
  { value: "presencial", label: "Presencial" },
  { value: "email",      label: "E-mail" },
];

const POR_PAGINA = 30;

const STATUS_GOOGLE: Record<string, { label: string; cor: string }> = {
  ATIVO:          { label: "✓ Ativo",         cor: "bg-green-100 text-green-700" },
  FECHADO_TEMP:   { label: "⚠ Temp. fechado", cor: "bg-yellow-100 text-yellow-700" },
  ENCERRADO:      { label: "✗ Encerrado",     cor: "bg-red-100 text-red-700" },
  NAO_ENCONTRADO: { label: "? Não encontrado", cor: "bg-gray-100 text-gray-500" },
};

const CATEGORIAS: { label: string; keywords: string[] }[] = [
  { label: "Marmita/Quentinha", keywords: ["marmita", "marmitex", "quentinha", "prato feito", "comida caseira", "refeição", "refeicao", "comida", "sabor"] },
  { label: "Lanchonete",        keywords: ["lanchonete", "lanches", "lanche"] },
  { label: "Pizzaria",          keywords: ["pizza", "pizzaria"] },
  { label: "Hamburgueria",      keywords: ["burger", "hamburguer", "hamburgueria", "hambúrguer", "smash"] },
  { label: "Doceria/Confeit.",  keywords: ["doceria", "doce", "confeitaria", "bolo", "bolos", "cake", "brigadeiro", "candy", "sobremesa", "atelier"] },
  { label: "Açaíteria",         keywords: ["açaí", "acai", "acaiteria", "açaiteria"] },
  { label: "Restaurante",       keywords: ["restaurante"] },
];

function extrairCategoria(nome: string | null): string {
  if (!nome) return "Outros";
  const lower = nome.toLowerCase();
  for (const cat of CATEGORIAS) {
    if (cat.keywords.some((kw) => lower.includes(kw))) return cat.label;
  }
  return "Outros";
}

const BAIRROS = [
  "Campo Grande",
  "Inhoaíba",
  "Cesarão",
  "Antares",
  "Santa Cruz",
  "Sepetiba",
];

function extrairBairro(endereco: string | null): string {
  if (!endereco) return "Outros";
  const lower = endereco.toLowerCase();
  for (const b of BAIRROS) {
    if (lower.includes(b.toLowerCase())) return b;
  }
  return "Outros";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function whatsappLink(telefone: string): string {
  const digits = telefone.replace(/\D/g, "");
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}`;
}

async function atualizarLead(id: string, dados: Record<string, unknown>) {
  const res = await fetch(`/api/crm/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error("Erro ao salvar");
  return res.json();
}

// ─── Modal de contato ─────────────────────────────────────────────────────────

function ModalContato({
  lead,
  onSalvar,
  onFechar,
}: {
  lead: Lead;
  onSalvar: (lead: Lead) => void;
  onFechar: () => void;
}) {
  const [form, setForm] = useState<ContatoForm>({
    tipo_contato: "whatsapp",
    resultado: "",
    notas: lead.notas ?? "",
  });
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!form.resultado) return;
    setSalvando(true);
    const res = RESULTADOS.find((r) => r.value === form.resultado)!;
    try {
      const updated = await atualizarLead(lead.id, {
        status: res.status,
        tipo_contato: form.tipo_contato,
        respondeu: res.respondeu,
        tem_interesse: res.interesse,
        contatado_em: new Date().toISOString(),
        notas: form.notas || null,
      });
      onSalvar(updated);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-5 border-b">
          <h2 className="font-bold text-lg text-gray-900">Registrar contato</h2>
          <p className="text-sm text-gray-500 mt-0.5">{lead.nome}</p>
        </div>

        <div className="p-5 space-y-5">
          {/* Tipo de contato */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Como você entrou em contato?</p>
            <div className="flex flex-wrap gap-2">
              {TIPOS_CONTATO.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setForm((f) => ({ ...f, tipo_contato: t.value }))}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    form.tipo_contato === t.value
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resultado */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Qual foi o resultado?</p>
            <div className="space-y-2">
              {RESULTADOS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setForm((f) => ({ ...f, resultado: r.value }))}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    form.resultado === r.value
                      ? "bg-green-50 border-2 border-green-500 text-green-800"
                      : "bg-gray-50 border-2 border-transparent text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Observações (opcional)</p>
            <textarea
              value={form.notas}
              onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
              placeholder="Ex: Liga depois das 14h, está no iFood mas quer sair..."
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="p-5 pt-0 flex gap-3">
          <button
            onClick={onFechar}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={!form.resultado || salvando}
            className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium disabled:opacity-40 hover:bg-green-700 transition-colors"
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Card de lead ─────────────────────────────────────────────────────────────

function LeadCard({
  lead,
  onUpdate,
}: {
  lead: Lead;
  onUpdate: (lead: Lead) => void;
}) {
  const [modalAberto, setModalAberto] = useState(false);
  const status = STATUS[lead.status] ?? STATUS.novo;

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-tight">{lead.nome}</p>
            {lead.telefone && (
              <p className="text-xs text-gray-500 mt-0.5">{lead.telefone}</p>
            )}
          </div>
          <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${status.cor}`}>
            {status.emoji} {status.label}
          </span>
        </div>

        {/* Info */}
        <div className="space-y-1">
          {lead.local_endereco && (
            <p className="text-xs text-gray-500 truncate">📍 {lead.local_endereco}</p>
          )}
          <div className="flex gap-3 text-xs text-gray-400">
            {lead.avaliacao && <span>⭐ {lead.avaliacao.replace("⭐", "")}</span>}
            <span>📡 {lead.canal_origem}</span>
            {lead.contatado_em && (
              <span>🗓 {new Date(lead.contatado_em).toLocaleDateString("pt-BR")}</span>
            )}
          </div>
          {lead.notas && (
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-2 py-1.5 mt-1">
              💬 {lead.notas}
            </p>
          )}
        </div>

        {/* Badge de verificação Google */}
        {lead.status_google && STATUS_GOOGLE[lead.status_google] && (
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_GOOGLE[lead.status_google].cor}`}>
            {STATUS_GOOGLE[lead.status_google].label}
          </span>
        )}

        {/* Ações */}
        <div className="flex gap-2 pt-1 flex-wrap">
          <button
            onClick={() => setModalAberto(true)}
            className="flex-1 py-2 rounded-xl bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors"
          >
            Registrar contato
          </button>
          {lead.telefone && (
            <a
              href={whatsappLink(lead.telefone)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors"
            >
              WhatsApp
            </a>
          )}
          {lead.instagram_url ? (
            <a
              href={lead.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-pink-50 text-pink-600 text-xs font-medium hover:bg-pink-100 transition-colors"
            >
              Instagram
            </a>
          ) : (
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`"${lead.nome}" instagram`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-gray-50 text-gray-500 text-xs font-medium hover:bg-gray-100 transition-colors"
              title="Buscar Instagram manualmente"
            >
              Buscar IG
            </a>
          )}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.nome} ${lead.local_endereco ?? "Rio de Janeiro"}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors"
            title="Ver no Google Maps"
          >
            Maps
          </a>
        </div>
      </div>

      {modalAberto && (
        <ModalContato
          lead={lead}
          onSalvar={(updated) => {
            onUpdate(updated);
            setModalAberto(false);
          }}
          onFechar={() => setModalAberto(false)}
        />
      )}
    </>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CrmClient({
  leads: leadsIniciais,
  userName,
}: {
  leads: Lead[];
  userName: string;
}) {
  const [leads, setLeads] = useState<Lead[]>(leadsIniciais);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroBairro, setFiltroBairro] = useState("todos");
  const [filtroCat, setFiltroCat] = useState("todos");
  const [filtroGoogle, setFiltroGoogle] = useState("todos");
  const [filtroBusca, setFiltroBusca] = useState("");
  const [pagina, setPagina] = useState(1);

  // Stats
  const stats = useMemo(() => {
    const total = leads.length;
    const novos = leads.filter((l) => l.status === "novo").length;
    const contatados = leads.filter((l) => l.status === "contatado").length;
    const responderam = leads.filter((l) => l.status === "respondeu").length;
    const demos = leads.filter((l) => l.status === "demo").length;
    const fechados = leads.filter((l) => l.status === "fechado").length;
    return { total, novos, contatados, responderam, demos, fechados };
  }, [leads]);

  // Contagem por bairro
  const contagemBairros = useMemo(() => {
    const counts: Record<string, number> = { todos: leads.length };
    for (const lead of leads) {
      const b = extrairBairro(lead.local_endereco);
      counts[b] = (counts[b] ?? 0) + 1;
    }
    return counts;
  }, [leads]);

  // Contagem por categoria
  const contagemCats = useMemo(() => {
    const counts: Record<string, number> = { todos: leads.length };
    for (const lead of leads) {
      const c = extrairCategoria(lead.nome);
      counts[c] = (counts[c] ?? 0) + 1;
    }
    return counts;
  }, [leads]);

  // Filtros
  const leadsFiltrados = useMemo(() => {
    return leads.filter((l) => {
      const matchStatus = filtroStatus === "todos" || l.status === filtroStatus;
      const matchBairro = filtroBairro === "todos" || extrairBairro(l.local_endereco) === filtroBairro;
      const matchCat    = filtroCat === "todos" || extrairCategoria(l.nome) === filtroCat;
      const matchGoogle =
        filtroGoogle === "todos" ||
        (filtroGoogle === "ativos"       && l.status_google === "ATIVO") ||
        (filtroGoogle === "encerrados"   && (l.status_google === "ENCERRADO" || l.status_google === "NAO_ENCONTRADO")) ||
        (filtroGoogle === "nao_verif"    && !l.status_google) ||
        (filtroGoogle === "tem_ig"       && !!l.instagram_url);
      const busca = filtroBusca.toLowerCase();
      const matchBusca =
        !busca ||
        l.nome.toLowerCase().includes(busca) ||
        (l.telefone ?? "").includes(busca) ||
        (l.local_endereco ?? "").toLowerCase().includes(busca);
      return matchStatus && matchBairro && matchCat && matchGoogle && matchBusca;
    });
  }, [leads, filtroStatus, filtroBairro, filtroCat, filtroGoogle, filtroBusca]);

  // Paginação
  const totalPaginas = Math.ceil(leadsFiltrados.length / POR_PAGINA);
  const leadsPagina = leadsFiltrados.slice(
    (pagina - 1) * POR_PAGINA,
    pagina * POR_PAGINA
  );

  function handleUpdate(updated: Lead) {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  }

  function handleFiltroStatus(status: string) {
    setFiltroStatus(status);
    setPagina(1);
  }

  function handleFiltroCat(cat: string) {
    setFiltroCat(cat);
    setPagina(1);
  }

  function handleFiltroBairro(bairro: string) {
    setFiltroBairro(bairro);
    setPagina(1);
  }

  function handleFiltroGoogle(v: string) {
    setFiltroGoogle(v);
    setPagina(1);
  }

  function handleBusca(v: string) {
    setFiltroBusca(v);
    setPagina(1);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-900">Pipeline ZapComanda</h1>
            <p className="text-xs text-gray-400">{userName}</p>
          </div>
          <span className="text-xs bg-green-50 text-green-700 font-medium px-2 py-1 rounded-full">
            {stats.total} leads
          </span>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { label: "Novos",       value: stats.novos,       color: "text-gray-700" },
            { label: "Contatados",  value: stats.contatados,  color: "text-blue-600" },
            { label: "Responderam", value: stats.responderam, color: "text-yellow-600" },
            { label: "Demos",       value: stats.demos,       color: "text-purple-600" },
            { label: "Fechados",    value: stats.fechados,    color: "text-green-600" },
            {
              label: "Conversão",
              value: stats.total > 0 ? `${((stats.fechados / stats.total) * 100).toFixed(1)}%` : "0%",
              color: "text-green-700",
            },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Busca */}
        <input
          type="text"
          placeholder="Buscar por nome, telefone ou endereço..."
          value={filtroBusca}
          onChange={(e) => handleBusca(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        {/* Filtro por categoria */}
        <div>
          <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Categoria</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => handleFiltroCat("todos")}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filtroCat === "todos"
                  ? "bg-orange-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Todos ({leads.length})
            </button>
            {[...CATEGORIAS.map((c) => c.label), "Outros"].map((cat) => {
              const count = contagemCats[cat] ?? 0;
              if (count === 0) return null;
              return (
                <button
                  key={cat}
                  onClick={() => handleFiltroCat(cat)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filtroCat === cat
                      ? "bg-orange-600 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Filtro por bairro */}
        <div>
          <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Região</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[{ key: "todos", label: "Todos" }, ...BAIRROS.map((b) => ({ key: b, label: b }))].map(({ key, label }) => {
              const count = contagemBairros[key] ?? 0;
              if (key !== "todos" && count === 0) return null;
              return (
                <button
                  key={key}
                  onClick={() => handleFiltroBairro(key)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filtroBairro === key
                      ? "bg-green-700 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Filtro de verificação */}
        {leads.some((l) => l.status_google) && (
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Verificação</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { key: "todos",      label: "Todos" },
                { key: "ativos",     label: "✓ Ativos" },
                { key: "tem_ig",     label: "Instagram encontrado" },
                { key: "encerrados", label: "✗ Encerrados" },
                { key: "nao_verif",  label: "Não verificados" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleFiltroGoogle(key)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filtroGoogle === key
                      ? "bg-indigo-700 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filtro de status */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => handleFiltroStatus("todos")}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filtroStatus === "todos"
                ? "bg-gray-800 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Todos ({leads.length})
          </button>
          {Object.entries(STATUS).map(([key, s]) => {
            const count = leads.filter((l) => l.status === key).length;
            if (count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => handleFiltroStatus(key)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filtroStatus === key
                    ? "bg-gray-800 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {s.emoji} {s.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Resultado da busca */}
        {leadsFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Nenhum lead encontrado com esses filtros.
          </div>
        ) : (
          <>
            <div className="text-xs text-gray-400">
              Mostrando {leadsPagina.length} de {leadsFiltrados.length} leads
            </div>

            {/* Grid de cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {leadsPagina.map((lead) => (
                <LeadCard key={lead.id} lead={lead} onUpdate={handleUpdate} />
              ))}
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-30 hover:bg-gray-50"
                >
                  ← Anterior
                </button>
                <span className="text-sm text-gray-500">
                  {pagina} / {totalPaginas}
                </span>
                <button
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-30 hover:bg-gray-50"
                >
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
