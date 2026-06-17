"use client";

import { useState } from "react";

type Aba = "whatsapp" | "ligacao" | "marketplace" | "estrategia";

function BotaoCopiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(texto.trim());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <button
      onClick={copiar}
      className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors font-medium"
    >
      {copiado ? "✓ Copiado!" : "📋 Copiar"}
    </button>
  );
}

function Script({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-600">{titulo}</p>
      </div>
      <div className="p-3">
        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{texto.trim()}</pre>
        <BotaoCopiar texto={texto} />
      </div>
    </div>
  );
}

function AbaWhatsApp() {
  return (
    <div className="space-y-4">
      <Script
        titulo="Abordagem fria — Versão curta (recomendada)"
        texto={`Oi [Nome]! Vi que vocês fazem delivery por aí 🍱

Montei um cardápio digital próprio para negócios como o de vocês — sem cobrar comissão por pedido. O cliente acessa o link, escolhe os itens e paga o Pix direto.

Posso mostrar como ficaria pro [Nome da Loja] em 10 minutinhos?`}
      />
      <Script
        titulo="Abordagem fria — Para quem está no iFood"
        texto={`Oi [Nome], vi vocês no iFood!

Tenho uma ferramenta que deixa você ter cardápio digital próprio — pedidos organizados e Pix na hora, sem pagar taxa por pedido. Serve como canal direto paralelo ao iFood.

Vale uma demo rápida de 10 min?`}
      />
      <Script
        titulo="Abordagem fria — Marmiteiros / Quentinheiras"
        texto={`Oi [Nome]! Vi que vocês vendem marmita por aqui 🥡

Trabalho com um sistema que organiza seus pedidos automaticamente — cliente escolhe no cardápio, já calcula o total e paga o Pix. Sem ficar mandando mensagem para confirmar item por item.

Posso mostrar funcionando? Leva 10 min.`}
      />
      <Script
        titulo="Follow-up — 3 dias sem resposta"
        texto={`Oi [Nome], tudo bem? Mandei uma mensagem outro dia sobre o cardápio digital.

Caso queira dar uma olhada, montei uma demo aqui: [link do cardápio demo]

Qualquer coisa, só falar!`}
      />
      <Script
        titulo="Encerramento de ciclo — 7 dias sem resposta"
        texto={`Oi [Nome]! Só passando para deixar o contato.

Se em algum momento quiser conhecer o ZapComanda — cardápio digital sem comissão por pedido — é só me chamar.

Boa semana! 👊`}
      />
      <Script
        titulo="Divulgação para grupos de WhatsApp"
        texto={`Oi pessoal! 👋

Para quem faz delivery e cansa de receber pedido por mensagem de voz, foto e textão — criei uma ferramenta chamada ZapComanda.

É um cardápio digital próprio: cliente acessa o link, escolhe os itens, paga o Pix e o pedido já chega organizado pra você. Sem comissão por pedido.

Planos a partir de R$ 49/mês. Tem versão de teste pra conhecer.

Quem quiser ver uma demo rápida, me chama aqui ou acessa: [link]

Qualquer dúvida, só perguntar! 🍕🥡`}
      />
      <Script
        titulo="Pós-demo — dentro de 2h"
        texto={`[Nome], foi um prazer mostrar o ZapComanda pra vocês!

Resumo do que vimos:
✅ Cardápio digital pronto em 30 min
✅ Pedido organizado com total calculado
✅ Pix na hora, sem comissão por pedido
✅ Painel para acompanhar tudo

O plano Basic é R$ 49/mês. Para fechar ainda essa semana, consigo [oferta especial / primeiro mês grátis].

Qual seria o melhor momento para vocês começarem?`}
      />
    </div>
  );
}

function AbaLigacao() {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 font-medium">
        Estrutura: máx. 8 minutos · Tenha o link da demo em mãos antes de ligar
      </div>
      <Script
        titulo="[0:00 – 0:30] Abertura"
        texto={`"Oi [Nome], tudo bem? Aqui é o [seu nome], da ZapComanda.
Tenho uma solução de cardápio digital para negócios de alimentação e vi que [vocês fazem delivery / estão no iFood / vendem marmita].
Tenho 2 minutinhos do seu tempo?"`}
      />
      <Script
        titulo="[0:30 – 2:00] Diagnóstico — faça UMA e ouça"
        texto={`"Vocês recebem pedido por WhatsApp hoje?"
"Quanto pagam de comissão por mês no iFood, aproximadamente?"
"Alguma vez perdeu pedido porque não viu a mensagem a tempo?"`}
      />
      <Script
        titulo="[2:00 – 5:00] Apresentação direta"
        texto={`"Entendo. O ZapComanda resolve exatamente isso.

É um cardápio digital com link próprio — o cliente abre, escolhe os itens, paga o Pix e o pedido já chega organizado pra você no painel. Sem precisar ficar confirmando item por item, sem comissão por pedido.

O plano começa em R$ 49 por mês. É menos do que 2 pedidos perdidos pra comissão."`}
      />
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-600">[5:00 – 6:30] Contorno de objeções</p>
        </div>
        <div className="p-3 space-y-3">
          {[
            { objecao: "Já tenho iFood", resposta: "O ZapComanda não substitui o iFood — é o seu canal direto, sem taxa. Você mantém os dois e captura os clientes fiéis sem pagar comissão pra eles." },
            { objecao: "É caro", resposta: "R$ 49 por mês dá menos de R$ 2 por dia. Um pedido de R$ 30 no iFood já paga quase o mês inteiro em comissão. Posso mostrar a conta?" },
            { objecao: "Não tenho tempo pra aprender", resposta: "O cardápio fica pronto em 30 minutos. Posso montar junto com você numa ligação de vídeo — não precisa aprender nada sozinho." },
            { objecao: "Vou pensar", resposta: "Claro. O que faria você decidir ainda essa semana? Tem alguma dúvida que eu posso responder agora?" },
          ].map((item) => (
            <div key={item.objecao} className="bg-gray-50 rounded-lg p-2.5">
              <p className="text-xs font-semibold text-red-600 mb-1">&ldquo;{item.objecao}&rdquo;</p>
              <p className="text-xs text-gray-700">{item.resposta}</p>
            </div>
          ))}
        </div>
      </div>
      <Script
        titulo="[6:30 – 8:00] Fechamento"
        texto={`"Posso te mandar o link de uma demo funcionando agora pelo WhatsApp?
Você vê em 5 minutos e me fala o que achou."

— Se quiser demo ao vivo —
"Que tal a gente fazer uma videochamada rápida de 10 minutos? Posso mostrar na tela como ficaria o cardápio de vocês. Quando você tem um espaço hoje ou amanhã?"`}
      />
      <div className="bg-yellow-50 rounded-xl p-3 text-xs text-yellow-800">
        ⭐ <strong>Regra de ouro:</strong> Nunca encerre sem uma data/horário de próximo passo confirmado.
      </div>
    </div>
  );
}

function AbaMarketplace() {
  return (
    <div className="space-y-4">
      <Script
        titulo="Título do anúncio"
        texto="Cardápio Digital para Restaurante, Marmita e Lanchonete — Sem Comissão"
      />
      <Script
        titulo="Descrição completa"
        texto={`🍽️ ZAPCOMANDA — Cardápio digital próprio para seu negócio de alimentação

Cansado de perder dinheiro com comissão do iFood? Ou de ficar respondendo pedido por mensagem de voz?

O ZapComanda é um sistema simples para:
✅ Ter seu cardápio digital com link próprio
✅ Receber pedidos organizados (sem caos no WhatsApp)
✅ Receber o Pix na hora, diretamente na sua conta
✅ Acompanhar todos os pedidos pelo painel
✅ Sem comissão por pedido — você fica com 100% da venda

🎯 Ideal para:
- Marmiteiros e quentinheiras
- Lanchonetes e hamburguerias
- Pizzarias e esfirrarias
- Docerias e confeitarias

💰 A partir de R$ 49/mês

📱 Quer ver funcionando antes de contratar? Peço 10 minutos do seu tempo e mostro tudo na tela — sem compromisso.

📞 Me chama no WhatsApp: [seu número]
🔗 Veja a demo: [link do cardápio demo]

---
ZapComanda | Cardápio digital. Pedido na conta. Sem comissão.`}
      />
      <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600">
        <p className="font-semibold mb-1">Categoria recomendada:</p>
        <p>Serviços → Serviços para Empresas</p>
        <p className="mt-2 font-semibold">Foto:</p>
        <p>Use captura de tela do cardápio demo no celular — converte mais que arte gráfica.</p>
      </div>
    </div>
  );
}

function AbaEstrategia() {
  return (
    <div className="space-y-4">
      <Script
        titulo="Indicação ativa — enviar após 2 semanas de uso"
        texto={`"[Nome], fico feliz que esteja usando o ZapComanda!
Você conhece algum outro marmiteiro, lanchonete ou restaurante que poderia gostar?
Pra cada indicação que fechar, você ganha 1 mês grátis na sua conta."`}
      />

      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-600">Prioridade por canal</p>
        </div>
        <div className="p-3 space-y-2">
          {[
            { canal: "Indicação de cliente", qualidade: "Muito alta", esforco: "Muito baixo" },
            { canal: "Google Maps + ligação", qualidade: "Alta", esforco: "Médio" },
            { canal: "Instagram DM", qualidade: "Alta", esforco: "Baixo" },
            { canal: "iFood cold WhatsApp", qualidade: "Média", esforco: "Baixo" },
            { canal: "Grupos WhatsApp/FB", qualidade: "Média", esforco: "Baixo" },
            { canal: "Facebook Marketplace", qualidade: "Média", esforco: "Muito baixo" },
          ].map((item) => (
            <div key={item.canal} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
              <span className="font-medium text-gray-700">{item.canal}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                item.qualidade === "Muito alta" ? "bg-green-100 text-green-700" :
                item.qualidade === "Alta" ? "bg-blue-100 text-blue-700" :
                "bg-gray-100 text-gray-600"
              }`}>{item.qualidade}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-600">Agenda semanal (~3–4h/semana)</p>
        </div>
        <div className="p-3 space-y-2">
          {[
            { dia: "Segunda", atividade: "20 leads iFood + 10 Instagram", tempo: "45 min" },
            { dia: "Terça", atividade: "Enviar mensagens para os 30 leads", tempo: "30 min" },
            { dia: "Quarta", atividade: "Follow-up D+3 · 5 ligações Maps", tempo: "45 min" },
            { dia: "Quinta", atividade: "20 leads novos · Responder interessados", tempo: "45 min" },
            { dia: "Sexta", atividade: "Encerrar ciclo D+7 · Agendar demos", tempo: "30 min" },
          ].map((item) => (
            <div key={item.dia} className="text-xs bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex justify-between mb-0.5">
                <span className="font-semibold text-gray-700">{item.dia}</span>
                <span className="text-gray-400">{item.tempo}</span>
              </div>
              <span className="text-gray-600">{item.atividade}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Painel principal ─────────────────────────────────────────────────────────

export default function CrmMaterialPanel({ onFechar }: { onFechar: () => void }) {
  const [aba, setAba] = useState<Aba>("whatsapp");

  const abas: { key: Aba; label: string }[] = [
    { key: "whatsapp",    label: "WhatsApp" },
    { key: "ligacao",     label: "Ligação" },
    { key: "marketplace", label: "Marketplace" },
    { key: "estrategia",  label: "Estratégia" },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onFechar}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-bold text-gray-900 text-sm">Material Comercial</h2>
            <p className="text-xs text-gray-400">Scripts prontos para usar</p>
          </div>
          <button
            onClick={onFechar}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-lg"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b shrink-0 px-2">
          {abas.map((a) => (
            <button
              key={a.key}
              onClick={() => setAba(a.key)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                aba === a.key
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-4">
          {aba === "whatsapp"    && <AbaWhatsApp />}
          {aba === "ligacao"     && <AbaLigacao />}
          {aba === "marketplace" && <AbaMarketplace />}
          {aba === "estrategia"  && <AbaEstrategia />}
        </div>
      </div>
    </>
  );
}
