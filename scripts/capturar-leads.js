#!/usr/bin/env node
/**
 * ZapComanda — Capturador de Leads
 *
 * Uso:
 *   node scripts/capturar-leads.js "marmita" "São Paulo, SP"
 *   node scripts/capturar-leads.js "lanchonete" "Campinas, SP" "Vila Industrial"
 *   node scripts/capturar-leads.js --manual
 *
 * Configuração (uma vez só):
 *   Windows PowerShell:  $env:GOOGLE_PLACES_API_KEY="SUA_CHAVE"
 *   Linux/Mac:           export GOOGLE_PLACES_API_KEY="SUA_CHAVE"
 *
 * Como obter a chave gratuita:
 *   1. Acesse https://console.cloud.google.com
 *   2. Crie um projeto > APIs > Places API > Ativar
 *   3. Credenciais > Criar chave de API
 *   $200 de crédito/mês grátis (~6.000 buscas)
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const LEADS_FILE = path.resolve(__dirname, '../docs/leads.md');
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// ─── Cabeçalho do arquivo de leads ───────────────────────────────────────────

const CABECALHO = `# Pipeline de Leads — ZapComanda

> Edite o **Status** manualmente conforme avança no processo.
>
> | Emoji | Significado |
> |-------|-------------|
> | 🆕 | Novo — ainda não contatado |
> | 📨 | Contatado — mensagem enviada |
> | 💬 | Respondeu — em conversa |
> | 📅 | Demo agendada |
> | ✅ | Fechado — cliente ativo |
> | ❌ | Sem interesse |
> | 🔄 | Follow-up pendente |

---

| Status | Nome | Telefone | Local | ⭐ | Canal | Contatado em | Notas |
|--------|------|----------|-------|-----|-------|-------------|-------|
`;

// ─── Utilitários de arquivo ───────────────────────────────────────────────────

function lerArquivo() {
  if (!fs.existsSync(LEADS_FILE)) return null;
  return fs.readFileSync(LEADS_FILE, 'utf-8');
}

function inicializarArquivo() {
  const dir = path.dirname(LEADS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(LEADS_FILE, CABECALHO, 'utf-8');
  console.log('📄 Arquivo docs/leads.md criado.\n');
}

function jaExiste(conteudo, nome) {
  const normalizar = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  return conteudo
    .split('\n')
    .some((linha) => linha.includes('|') && normalizar(linha).includes(normalizar(nome)));
}

function formatarLinha(lead) {
  const {
    status = '🆕',
    nome,
    telefone = '—',
    local = '—',
    avaliacao = '—',
    canal = 'Google Maps',
    contatado = '—',
    notas = '—',
  } = lead;
  // Escapa pipes dentro dos campos para não quebrar a tabela markdown
  const esc = (s) => String(s).replace(/\|/g, '-');
  return `| ${esc(status)} | ${esc(nome)} | ${esc(telefone)} | ${esc(local)} | ${esc(avaliacao)} | ${esc(canal)} | ${esc(contatado)} | ${esc(notas)} |`;
}

function adicionarLead(lead) {
  let conteudo = lerArquivo();
  if (!conteudo) {
    inicializarArquivo();
    conteudo = lerArquivo();
  }

  if (jaExiste(conteudo, lead.nome)) {
    console.log(`  ⏭️  Já existe: ${lead.nome}`);
    return false;
  }

  const linha = formatarLinha(lead);
  const atualizado = conteudo.trimEnd() + '\n' + linha + '\n';
  fs.writeFileSync(LEADS_FILE, atualizado, 'utf-8');
  return true;
}

function contarLeads() {
  const conteudo = lerArquivo();
  if (!conteudo) return { total: 0, contatados: 0, demos: 0, fechados: 0 };
  const linhas = conteudo.split('\n').filter((l) => l.startsWith('|') && !l.includes('Status') && !l.includes('---'));
  return {
    total: linhas.length,
    contatados: linhas.filter((l) => l.includes('📨') || l.includes('💬') || l.includes('📅') || l.includes('✅')).length,
    demos: linhas.filter((l) => l.includes('📅')).length,
    fechados: linhas.filter((l) => l.includes('✅')).length,
  };
}

// ─── Google Places API ────────────────────────────────────────────────────────

async function buscarPlaces(query) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=food&language=pt-BR&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API: ${data.status} — ${data.error_message || ''}`);
  }
  return data.results || [];
}

async function detalhesPlace(placeId) {
  const campos = 'name,formatted_phone_number,formatted_address,rating,url';
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${campos}&language=pt-BR&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.result || {};
}

function abreviarEndereco(endereco) {
  if (!endereco) return '—';
  const partes = endereco.split(',');
  return partes.slice(0, 2).join(',').trim();
}

// ─── Modo automático (Google Places) ─────────────────────────────────────────

async function modoAutomatico(termos) {
  if (!API_KEY) {
    console.error('\n❌ Chave da API não encontrada.\n');
    console.error('Configure antes de rodar:');
    console.error('  PowerShell: $env:GOOGLE_PLACES_API_KEY="sua_chave"');
    console.error('  Linux/Mac:  export GOOGLE_PLACES_API_KEY="sua_chave"\n');
    console.error('Como obter a chave (gratuita):');
    console.error('  https://console.cloud.google.com/apis/library/places-backend.googleapis.com\n');
    process.exit(1);
  }

  const query = termos.join(' ');
  console.log(`\n🔍 Buscando: "${query}"...\n`);

  let places;
  try {
    places = await buscarPlaces(query);
  } catch (err) {
    console.error(`\n❌ Erro na busca: ${err.message}\n`);
    process.exit(1);
  }

  if (places.length === 0) {
    console.log('Nenhum resultado encontrado. Tente termos diferentes.\n');
    return;
  }

  console.log(`Encontrados ${places.length} estabelecimentos. Coletando detalhes...\n`);

  let adicionados = 0;
  for (const place of places) {
    process.stdout.write(`  → ${place.name.padEnd(40)} `);

    let detalhes = {};
    try {
      detalhes = await detalhesPlace(place.place_id);
    } catch {
      // Continua sem detalhes se a chamada falhar
    }

    const lead = {
      nome: place.name,
      telefone: detalhes.formatted_phone_number || '—',
      local: abreviarEndereco(detalhes.formatted_address || place.formatted_address),
      avaliacao: place.rating ? `${place.rating}⭐` : '—',
      canal: 'Google Maps',
    };

    const ok = adicionarLead(lead);
    if (ok) {
      adicionados++;
      console.log('✅');
    } else {
      console.log('(já existe)');
    }

    // Intervalo respeitoso com a API (150ms entre chamadas)
    await new Promise((r) => setTimeout(r, 150));
  }

  const stats = contarLeads();
  console.log(`\n✅ ${adicionados} leads novos adicionados.`);
  console.log(`📊 Pipeline atual: ${stats.total} total · ${stats.contatados} contatados · ${stats.demos} demos · ${stats.fechados} fechados\n`);
  console.log(`📄 Arquivo: docs/leads.md\n`);
}

// ─── Modo manual (iFood, Instagram, Presencial) ───────────────────────────────

async function modoManual() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const perguntar = (q) => new Promise((resolve) => rl.question(q, (r) => resolve(r.trim())));

  console.log('\n📝 Adicionar lead manualmente\n');
  console.log('Canais sugeridos: iFood · Instagram · Indicação · WhatsApp · Presencial · Google Maps · Outro\n');

  const nome = await perguntar('Nome do negócio: ');
  if (!nome) { rl.close(); console.log('Cancelado.\n'); return; }

  const telefone = (await perguntar('Telefone (Enter para pular): ')) || '—';
  const local    = (await perguntar('Cidade / Bairro: ')) || '—';
  const canal    = (await perguntar('Canal de onde veio o lead: ')) || '—';
  const notas    = (await perguntar('Notas extras (Enter para pular): ')) || '—';

  rl.close();

  const ok = adicionarLead({ nome, telefone, local, avaliacao: '—', canal, notas });
  if (ok) {
    const stats = contarLeads();
    console.log(`\n✅ Lead adicionado: ${nome}`);
    console.log(`📊 Pipeline: ${stats.total} total · ${stats.contatados} contatados · ${stats.fechados} fechados\n`);
  }
}

// ─── Modo relatório ───────────────────────────────────────────────────────────

function modoRelatorio() {
  const stats = contarLeads();
  const conteudo = lerArquivo();

  if (!conteudo) {
    console.log('\nNenhum lead cadastrado ainda.\n');
    return;
  }

  const linhas = conteudo.split('\n').filter((l) => l.startsWith('|') && !l.includes('Status') && !l.includes('---'));

  console.log('\n📊 Relatório do Pipeline — ZapComanda\n');
  console.log(`  Total de leads:    ${stats.total}`);
  console.log(`  Contatados:        ${linhas.filter((l) => l.includes('📨')).length}`);
  console.log(`  Responderam:       ${linhas.filter((l) => l.includes('💬')).length}`);
  console.log(`  Demo agendada:     ${linhas.filter((l) => l.includes('📅')).length}`);
  console.log(`  Fechados:          ${linhas.filter((l) => l.includes('✅')).length}`);
  console.log(`  Sem interesse:     ${linhas.filter((l) => l.includes('❌')).length}`);
  console.log(`  Follow-up pend.:   ${linhas.filter((l) => l.includes('🔄')).length}`);

  const taxa = stats.total > 0 ? ((stats.fechados / stats.total) * 100).toFixed(1) : 0;
  console.log(`\n  Taxa de conversão: ${taxa}% (fechados/total)\n`);

  // Mostra leads que precisam de ação
  const pendentes = linhas.filter((l) => l.includes('🔄') || l.includes('📅'));
  if (pendentes.length > 0) {
    console.log('  ⚠️  Ação necessária:');
    pendentes.forEach((l) => {
      const cols = l.split('|').filter(Boolean).map((c) => c.trim());
      console.log(`     • ${cols[1]} (${cols[0]})`);
    });
    console.log('');
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function ajuda() {
  console.log(`
ZapComanda — Capturador de Leads

Comandos:
  node scripts/capturar-leads.js "marmita" "São Paulo, SP"
  node scripts/capturar-leads.js "lanchonete" "Campinas" "Vila Industrial"
  node scripts/capturar-leads.js --manual        Adiciona lead manualmente
  node scripts/capturar-leads.js --relatorio      Mostra resumo do pipeline
  node scripts/capturar-leads.js --ajuda          Exibe esta mensagem

Variável de ambiente (para busca automática):
  $env:GOOGLE_PLACES_API_KEY="sua_chave_aqui"   (PowerShell)
  export GOOGLE_PLACES_API_KEY="sua_chave"       (Linux/Mac)

Leads salvos em: docs/leads.md
  `);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--ajuda') || args.includes('-h')) {
    ajuda();
    return;
  }

  if (args.includes('--relatorio') || args.includes('-r')) {
    modoRelatorio();
    return;
  }

  if (args.includes('--manual') || args.includes('-m')) {
    await modoManual();
    return;
  }

  // Qualquer outro argumento = busca automática
  await modoAutomatico(args);
}

main().catch((err) => {
  console.error('\n❌ Erro inesperado:', err.message, '\n');
  process.exit(1);
});
