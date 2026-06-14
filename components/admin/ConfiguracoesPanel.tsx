"use client";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Config = {
  plans: { basic: number; pro: number };
  trialDays: number;
  pix: {
    configured: boolean;
    keyMasked: string | null;
    keyType: string | null;
    merchantName: string | null;
  };
  admin: {
    emailCount: number;
    emails: string[];
  };
  envStatus: Record<string, boolean>;
};

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-outline-variant flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary-container/10 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[22px] text-primary">{icon}</span>
        </div>
        <div>
          <h3 className="text-headline-md text-on-surface">{title}</h3>
          <p className="text-body-sm text-on-surface-variant">{description}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function ConfigRow({
  label,
  value,
  badge,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  badge?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-outline-variant/40 last:border-0">
      <span className="text-body-sm text-on-surface-variant">{label}</span>
      <div className="flex items-center gap-3">
        {badge}
        <span
          className={`text-body-md text-on-surface font-medium ${mono ? "font-mono text-sm" : ""}`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`w-2 h-2 rounded-full flex-shrink-0 ${
        ok ? "bg-secondary" : "bg-error"
      }`}
    />
  );
}

function EnvBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary-container/20 text-secondary text-[11px] font-bold">
      <span className="material-symbols-outlined text-[13px]">check_circle</span>
      Configurado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-error-container text-error text-[11px] font-bold">
      <span className="material-symbols-outlined text-[13px]">error</span>
      Ausente
    </span>
  );
}

const PIX_KEY_TYPE_LABEL: Record<string, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  email: "E-mail",
  phone: "Telefone",
  random: "Chave aleatória",
};

export default function ConfiguracoesPanel({ config }: { config: Config }) {
  const allEnvsOk = Object.values(config.envStatus).every(Boolean);
  const missingCount = Object.values(config.envStatus).filter((v) => !v).length;

  return (
    <div className="max-w-[1440px] mx-auto p-6 md:p-8 space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[30px] font-bold leading-[38px] tracking-tight text-on-surface">
            Configurações
          </h2>
          <p className="text-body-md text-on-surface-variant">
            Parâmetros do sistema ZapComanda Admin.
          </p>
        </div>
        {/* System health chip */}
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-body-sm font-medium self-start md:self-auto ${
            allEnvsOk
              ? "bg-secondary-container/10 border-secondary-container text-secondary"
              : "bg-error-container border-error-container text-error"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              allEnvsOk ? "bg-secondary" : "bg-error animate-pulse"
            }`}
          />
          {allEnvsOk
            ? "Sistema configurado"
            : `${missingCount} variável${missingCount > 1 ? "is" : ""} ausente${missingCount > 1 ? "s" : ""}`}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plans & Pricing */}
        <SectionCard
          icon="sell"
          title="Planos e Preços"
          description="Valores de assinatura por plano mensal"
        >
          <ConfigRow
            label="Plano Basic"
            value={`${fmt(config.plans.basic)}/mês`}
            badge={
              <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant text-[11px] font-bold">
                BASIC
              </span>
            }
          />
          <ConfigRow
            label="Plano Pro"
            value={`${fmt(config.plans.pro)}/mês`}
            badge={
              <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant text-[11px] font-bold">
                PRO
              </span>
            }
          />
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-surface-container">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0 mt-0.5">
              info
            </span>
            <p className="text-body-sm text-on-surface-variant">
              Para alterar os preços, edite o arquivo{" "}
              <code className="font-mono text-[12px] bg-surface-container-high px-1 py-0.5 rounded">
                lib/admin/plans.ts
              </code>{" "}
              e faça um novo deploy.
            </p>
          </div>
        </SectionCard>

        {/* Trial */}
        <SectionCard
          icon="hourglass_empty"
          title="Período de Avaliação"
          description="Configurações do trial gratuito"
        >
          <ConfigRow
            label="Duração do trial"
            value={`${config.trialDays} dias`}
            badge={
              <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-bold">
                TRIAL
              </span>
            }
          />
          <ConfigRow
            label="Conversão automática"
            value="Manual (admin verifica)"
          />
          <ConfigRow
            label="Cobranças após trial"
            value="Via WhatsApp (PIX)"
          />
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-surface-container">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0 mt-0.5">
              info
            </span>
            <p className="text-body-sm text-on-surface-variant">
              A constante <code className="font-mono text-[12px] bg-surface-container-high px-1 py-0.5 rounded">TRIAL_DAYS</code>{" "}
              está definida nas páginas do admin. Ajuste no código para alterar.
            </p>
          </div>
        </SectionCard>

        {/* PIX Config */}
        <SectionCard
          icon="pix"
          title="Configurações PIX (Cobrança)"
          description="Chave PIX usada para receber assinaturas dos estabelecimentos"
        >
          <ConfigRow
            label="Status"
            value={config.pix.configured ? "Configurado" : "Não configurado"}
            badge={
              config.pix.configured ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary-container/20 text-secondary text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[13px]">check_circle</span>
                  Ativo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-error-container text-error text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[13px]">error</span>
                  Inativo
                </span>
              )
            }
          />
          <ConfigRow
            label="Tipo de chave"
            value={
              config.pix.keyType
                ? (PIX_KEY_TYPE_LABEL[config.pix.keyType] ?? config.pix.keyType)
                : "—"
            }
          />
          <ConfigRow
            label="Chave PIX"
            value={config.pix.keyMasked ?? "—"}
            mono
          />
          <ConfigRow
            label="Nome do comerciante"
            value={config.pix.merchantName ?? "—"}
          />
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-surface-container">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0 mt-0.5">
              lock
            </span>
            <p className="text-body-sm text-on-surface-variant">
              Configure via variáveis de ambiente:{" "}
              <code className="font-mono text-[12px] bg-surface-container-high px-1 py-0.5 rounded">
                ZAPCOMANDA_PIX_KEY
              </code>
              ,{" "}
              <code className="font-mono text-[12px] bg-surface-container-high px-1 py-0.5 rounded">
                ZAPCOMANDA_PIX_KEY_TYPE
              </code>{" "}
              e{" "}
              <code className="font-mono text-[12px] bg-surface-container-high px-1 py-0.5 rounded">
                ZAPCOMANDA_PIX_MERCHANT_NAME
              </code>
              .
            </p>
          </div>
        </SectionCard>

        {/* Admin access */}
        <SectionCard
          icon="admin_panel_settings"
          title="Acesso Administrativo"
          description="E-mails com permissão de acesso ao painel interno"
        >
          <ConfigRow
            label="Total de admins"
            value={
              config.admin.emailCount > 0
                ? `${config.admin.emailCount} e-mail${config.admin.emailCount > 1 ? "s" : ""}`
                : "Nenhum configurado"
            }
            badge={
              config.admin.emailCount > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary-container/20 text-secondary text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[13px]">check_circle</span>
                  Configurado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-error-container text-error text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[13px]">error</span>
                  Ausente
                </span>
              )
            }
          />
          {config.admin.emails.map((email, i) => (
            <ConfigRow
              key={i}
              label={`Admin ${i + 1}`}
              value={email}
              mono
            />
          ))}
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-surface-container">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0 mt-0.5">
              info
            </span>
            <p className="text-body-sm text-on-surface-variant">
              Adicione e-mails separados por vírgula em{" "}
              <code className="font-mono text-[12px] bg-surface-container-high px-1 py-0.5 rounded">
                INTERNAL_ADMIN_EMAILS
              </code>
              .
            </p>
          </div>
        </SectionCard>
      </div>

      {/* Environment variables status */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary-container/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px] text-primary">code</span>
          </div>
          <div>
            <h3 className="text-headline-md text-on-surface">Variáveis de Ambiente</h3>
            <p className="text-body-sm text-on-surface-variant">
              Status das variáveis necessárias para o funcionamento do sistema
            </p>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(config.envStatus).map(([key, ok]) => (
              <div
                key={key}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                  ok
                    ? "bg-secondary-container/5 border-secondary-container/20"
                    : "bg-error-container/10 border-error-container"
                }`}
              >
                <StatusDot ok={ok} />
                <span className="font-mono text-[12px] text-on-surface font-medium flex-1 truncate">
                  {key}
                </span>
                <EnvBadge ok={ok} />
              </div>
            ))}
          </div>
          {!allEnvsOk && (
            <div className="mt-4 flex items-start gap-2 p-4 rounded-lg bg-error-container/10 border border-error-container">
              <span className="material-symbols-outlined text-[20px] text-error shrink-0 mt-0.5">
                warning
              </span>
              <div>
                <p className="text-body-sm font-bold text-error">
                  Variáveis ausentes detectadas
                </p>
                <p className="text-body-sm text-on-surface-variant mt-0.5">
                  Configure as variáveis faltantes no painel da Vercel (Settings → Environment
                  Variables) e faça um novo deploy para ativar as funcionalidades.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
