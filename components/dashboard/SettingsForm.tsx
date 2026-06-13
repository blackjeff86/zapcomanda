"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PlanSettingsCollapsible from "@/components/dashboard/PlanSettingsCollapsible";
import ProFeatureUpsell from "@/components/dashboard/ProFeatureUpsell";
import WhatsAppQrConnect from "@/components/dashboard/WhatsAppQrConnect";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type PaymentMethod,
} from "@/lib/payments/methods";
import {
  PIX_KEY_TYPES,
  PIX_KEY_TYPE_LABELS,
  type PixKeyType,
} from "@/lib/payments/pix-key";
import { canUseOrderCutoff, isProPlan } from "@/lib/plans/features";
import type { Establishment } from "@/types/database";
import WhatsAppInstancesManager from "@/components/dashboard/WhatsAppInstancesManager";
import ImageUpload from "@/components/ui/ImageUpload";

function formatCategory(category: string) {
  return category === "quentinha" ? "Quentinha / Marmita" : "Lanchonete";
}

export default function SettingsForm({
  establishment,
  devMock = false,
}: {
  establishment: Establishment;
  devMock?: boolean;
}) {
  const router = useRouter();
  const cutoff = establishment.order_cutoff_time?.slice(0, 5) ?? "";

  const [form, setForm] = useState({
    name: establishment.name,
    slug: establishment.slug ?? "",
    whatsapp_number: establishment.whatsapp_number,
    primary_color: establishment.primary_color,
    logo_url: establishment.logo_url ?? "",
    order_cutoff_time: cutoff,
    accepted_payment_methods: establishment.accepted_payment_methods ?? ["pix"],
    delivery_fee_enabled: establishment.delivery_fee_enabled ?? false,
    delivery_fee_amount: establishment.delivery_fee_amount ?? 0,
    pix_key_type: establishment.pix_key_type ?? "",
    pix_key: establishment.pix_key ?? "",
  });
  useEffect(() => {
    if (establishment.logo_url) {
      setForm((f) => ({ ...f, logo_url: establishment.logo_url ?? "" }));
    }
  }, [establishment.logo_url]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasOrderCutoff = canUseOrderCutoff(establishment.plan);
  const isPro = isProPlan(establishment.plan);
  const acceptsPix = form.accepted_payment_methods.includes("pix");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/establishments/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao salvar");

      setMessage(
        devMock
          ? "Salvo localmente (modo exemplo)."
          : "Configurações salvas com sucesso!"
      );
      if (!devMock) router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  function togglePaymentMethod(method: PaymentMethod) {
    setForm((prev) => {
      const current = prev.accepted_payment_methods;
      const has = current.includes(method);
      if (has) {
        const next = current.filter((m) => m !== method);
        return { ...prev, accepted_payment_methods: next.length > 0 ? next : ["pix"] };
      }
      return { ...prev, accepted_payment_methods: [...current, method] };
    });
  }

  return (
    <div className="space-y-6">
      {devMock && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Dados de exemplo — salvar não persiste no banco até criar um estabelecimento real.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Tipo de negócio</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {formatCategory(establishment.category)}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
      >
        <h3 className="font-semibold text-gray-900">Dados do negócio</h3>

        {message && (
          <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{message}</p>
        )}
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nome do estabelecimento
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              WhatsApp do negócio
            </label>
            <input
              required
              value={form.whatsapp_number}
              onChange={(e) => setForm((p) => ({ ...p, whatsapp_number: e.target.value }))}
              placeholder="5511999999999"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Cor principal
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={form.primary_color}
                onChange={(e) => setForm((p) => ({ ...p, primary_color: e.target.value }))}
                className="h-11 w-14 shrink-0 rounded-lg border border-gray-300 p-1"
              />
              <input
                value={form.primary_color}
                onChange={(e) => setForm((p) => ({ ...p, primary_color: e.target.value }))}
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          {establishment.category === "quentinha" && hasOrderCutoff && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Horário de corte de pedidos
              </label>
              <input
                type="time"
                value={form.order_cutoff_time}
                onChange={(e) =>
                  setForm((p) => ({ ...p, order_cutoff_time: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <p className="mt-1 text-xs text-gray-400">
                Após esse horário, o bot informa que o prazo encerrou.
              </p>
            </div>
          )}

          {establishment.category === "quentinha" && !hasOrderCutoff && (
            <div className="sm:col-span-2">
              <ProFeatureUpsell
                title="Horário de corte — plano Pro"
                description="Defina um horário para o bot parar de aceitar pedidos automaticamente (ex.: 11:00 para quentinhas)."
              />
            </div>
          )}

          <div className="sm:col-span-2">
            <ImageUpload
              value={form.logo_url}
              onChange={(url) => setForm((p) => ({ ...p, logo_url: url }))}
              folder="logos"
              label="Logo do estabelecimento"
              hint="JPG, PNG ou WebP · máx. 5 MB"
              aspectSquare
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Link do cardápio digital
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm">
              <span className="shrink-0 text-gray-400">zapcomanda.vercel.app/cardapio/</span>
              <input
                value={form.slug}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                  }))
                }
                className="min-w-0 flex-1 bg-transparent font-medium text-gray-900 outline-none"
                placeholder="meu-restaurante"
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Compartilhe esse link com seus clientes ou gere um QR Code.
              </p>
              {form.slug && (
                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `https://zapcomanda.vercel.app/cardapio/${form.slug}`
                    )
                  }
                  className="shrink-0 text-xs font-medium text-brand hover:underline"
                >
                  Copiar link
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-6">
          <h4 className="font-semibold text-gray-900">Taxa de entrega</h4>
          <p className="mt-1 text-sm text-gray-500">
            Se você entrega em casa, pode cobrar um valor fixo por entrega. Esse valor entra no
            total do pedido no WhatsApp (Pix ou pagamento na entrega).
          </p>
          <label
            className={`mt-4 flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 ${
              form.delivery_fee_enabled
                ? "border-brand bg-brand-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <input
              type="checkbox"
              checked={form.delivery_fee_enabled}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  delivery_fee_enabled: e.target.checked,
                  delivery_fee_amount: e.target.checked ? p.delivery_fee_amount || 5 : 0,
                }))
              }
              className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
            />
            <span className="text-sm font-medium text-gray-900">
              Cobrar taxa de entrega nos pedidos
            </span>
          </label>
          {form.delivery_fee_enabled && (
            <div className="mt-3">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Valor da entrega (R$)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                required
                value={form.delivery_fee_amount}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    delivery_fee_amount: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand sm:max-w-xs"
              />
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-gray-100 pt-6">
          <h4 className="font-semibold text-gray-900">Confirmação de entrega</h4>
          <p className="mt-2 text-sm text-gray-600">
            Quando o pedido <strong>sai para entrega</strong>, você pode confirmar no painel com o
            botão &quot;Cliente recebeu&quot;. Se quem leva o pedido não usa o painel (ex.: motoboy),
            copie o <strong>link de confirmação</strong> no card do pedido e envie por WhatsApp —
            ele abre uma página simples no celular para marcar entrega e opcionalmente tirar uma
            foto. O cliente também recebe mensagem automática no WhatsApp.
          </p>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-6">
          <h4 className="font-semibold text-gray-900">Formas de pagamento aceitas</h4>
          <p className="mt-1 text-sm text-gray-500">
            Pix: o cliente paga antes pelo WhatsApp. Outras formas: pagamento só na entrega.
          </p>
          <ul className="mt-4 space-y-2">
            {PAYMENT_METHODS.map((method) => {
              const checked = form.accepted_payment_methods.includes(method);
              return (
                <li key={method}>
                  <label
                    className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
                      checked
                        ? "border-brand bg-brand-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePaymentMethod(method)}
                      className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {PAYMENT_METHOD_LABELS[method]}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        {acceptsPix && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <h4 className="font-semibold text-gray-900">Recebimento via Pix</h4>
            <p className="mt-1 text-sm text-gray-500">
              O cliente recebe um Pix copia e cola com o valor do pedido já preenchido.
              Quando o pagamento cair no seu banco, confirme no painel em &quot;Pix
              recebido&quot;.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tipo da chave Pix
                </label>
                <select
                  required={acceptsPix}
                  value={form.pix_key_type}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      pix_key_type: e.target.value as PixKeyType | "",
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="">Selecione...</option>
                  {PIX_KEY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {PIX_KEY_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Chave Pix
                </label>
                <input
                  required={acceptsPix}
                  value={form.pix_key}
                  onChange={(e) => setForm((p) => ({ ...p, pix_key: e.target.value }))}
                  placeholder={
                    form.pix_key_type === "email"
                      ? "contato@seudominio.com"
                      : form.pix_key_type === "phone"
                        ? "5511999999999"
                        : form.pix_key_type === "cpf"
                          ? "00000000000"
                          : form.pix_key_type === "cnpj"
                            ? "00000000000000"
                            : "Sua chave Pix"
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
        <h3 className="font-semibold text-gray-900">Integração WhatsApp</h3>
        <p className="mt-1 text-sm text-gray-500">
          Escaneie o QR Code com o WhatsApp do negócio para ativar o bot.
        </p>
        <WhatsAppQrConnect />

        <div className="mt-5 border-t border-gray-100 pt-5">
          <p className="text-xs text-gray-400">
            O bot local envia as mensagens para:{" "}
            <span className="font-mono break-all">
              https://zapcomanda.vercel.app/api/webhooks/whatsapp
            </span>
          </p>
        </div>

        {isPro ? (
          <div className="mt-5 border-t border-gray-100 pt-5">
            <h4 className="text-sm font-semibold text-gray-800">2º número de WhatsApp</h4>
            <p className="mt-1 text-xs text-gray-500">
              Adicione um segundo número para atender por dois canais diferentes.
            </p>
            <div className="mt-3">
              <WhatsAppInstancesManager />
            </div>
          </div>
        ) : (
          <div className="mt-5 border-t border-gray-100 pt-5">
            <ProFeatureUpsell
              title="2 números de WhatsApp — plano Pro"
              description="Use um segundo número para separar canais (ex.: loja e delivery)."
              compact
            />
          </div>
        )}
      </div>

      <PlanSettingsCollapsible establishment={establishment} devMock={devMock} />
    </div>
  );
}
