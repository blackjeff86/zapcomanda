#!/usr/bin/env node
/**
 * Valida e enriquece os leads:
 *  1. Google Places → business_status (Ativo / Encerrado / etc.)
 *  2. Verifica website e tenta encontrar o Instagram automaticamente
 *
 * Uso:
 *   node scripts/validar-leads.js           → valida todos os não verificados
 *   node scripts/validar-leads.js --todos   → re-valida todos (inclusive já verificados)
 *
 * Variáveis necessárias no .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GOOGLE_PLACES_API_KEY
 */

const fs   = require('fs');
const path = require('path');

// ── Env ──────────────────────────────────────────────────────────────────────

function loadEnvLocal() {
  const envFile = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnvLocal();

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PLACES_KEY    = process.env.GOOGLE_PLACES_API_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || !PLACES_KEY) {
  console.error('\n❌ Variáveis necessárias no .env.local:');
  if (!SUPABASE_URL)  console.error('  NEXT_PUBLIC_SUPABASE_URL');
  if (!SERVICE_KEY)   console.error('  SUPABASE_SERVICE_ROLE_KEY');
  if (!PLACES_KEY)    console.error('  GOOGLE_PLACES_API_KEY');
  process.exit(1);
}

const RETODOS = process.argv.includes('--todos');
const DELAY   = 350; // ms entre chamadas à API

// ── Supabase REST ─────────────────────────────────────────────────────────────

const SB_HEADERS = {
  'apikey':          SERVICE_KEY,
  'Authorization':   `Bearer ${SERVICE_KEY}`,
  'Content-Type':    'application/json',
  'Accept-Profile':  'zapcomanda',
  'Content-Profile': 'zapcomanda',
};

async function fetchLeads() {
  const filter = RETODOS ? '' : '&status_google=is.null';
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/leads?select=id,nome,local_endereco${filter}&order=id`,
    { headers: SB_HEADERS }
  );
  if (!res.ok) throw new Error(`Supabase: ${res.status} ${await res.text()}`);
  return res.json();
}

async function atualizarLead(id, dados) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${id}`, {
    method:  'PATCH',
    headers: { ...SB_HEADERS, 'Prefer': 'return=minimal' },
    body:    JSON.stringify(dados),
  });
  if (!res.ok) throw new Error(`Patch ${id}: ${res.status} ${await res.text()}`);
}

// ── Google Places ─────────────────────────────────────────────────────────────

async function textSearch(query) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${PLACES_KEY}&language=pt-BR&region=br`;
  const res  = await fetch(url);
  const data = await res.json();
  if (data.status === 'ZERO_RESULTS' || !data.results?.length) return null;
  return data.results[0]; // melhor resultado
}

async function placeDetails(placeId) {
  const fields = 'business_status,website,url,name';
  const url    = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${PLACES_KEY}&language=pt-BR`;
  const res    = await fetch(url);
  const data   = await res.json();
  if (data.status !== 'OK') return null;
  return data.result;
}

// ── Instagram helpers ─────────────────────────────────────────────────────────

function extrairInstagram(website) {
  if (!website) return null;
  if (website.includes('instagram.com')) {
    // Normaliza para https://instagram.com/usuario
    const match = website.match(/instagram\.com\/([^/?#]+)/);
    if (match) return `https://instagram.com/${match[1]}`;
  }
  return null;
}

function nomeSimilar(nomeA, nomeB) {
  if (!nomeA || !nomeB) return false;
  const a = nomeA.toLowerCase().replace(/[^a-z0-9]/g, '');
  const b = nomeB.toLowerCase().replace(/[^a-z0-9]/g, '');
  return a.includes(b.slice(0, 6)) || b.includes(a.slice(0, 6));
}

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_MAP = {
  OPERATIONAL:          'ATIVO',
  CLOSED_TEMPORARILY:   'FECHADO_TEMP',
  CLOSED_PERMANENTLY:   'ENCERRADO',
};

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function processarLead(lead, idx, total) {
  const prefixo = `[${String(idx + 1).padStart(3, ' ')}/${total}]`;

  // Monta a query: nome + bairro/cidade
  const locShort = (lead.local_endereco ?? 'Rio de Janeiro')
    .split(',').slice(-2).join(',').trim().slice(0, 60);
  const query = `${lead.nome} ${locShort}`;

  process.stdout.write(`${prefixo} ${lead.nome.slice(0, 40).padEnd(40)} `);

  // 1. Text Search
  const resultado = await textSearch(query);
  await sleep(DELAY);

  if (!resultado) {
    await atualizarLead(lead.id, {
      status_google: 'NAO_ENCONTRADO',
      verificado_em: new Date().toISOString(),
    });
    console.log('→ Não encontrado');
    return;
  }

  // Verifica similaridade do nome para evitar falso positivo
  if (!nomeSimilar(lead.nome, resultado.name)) {
    await atualizarLead(lead.id, {
      status_google: 'NAO_ENCONTRADO',
      verificado_em: new Date().toISOString(),
    });
    console.log(`→ Nome diferente (${resultado.name.slice(0, 30)})`);
    return;
  }

  // 2. Place Details
  const detalhes = await placeDetails(resultado.place_id);
  await sleep(DELAY);

  const statusGoogle = STATUS_MAP[detalhes?.business_status] ?? 'NAO_ENCONTRADO';
  const website      = detalhes?.website ?? null;
  const instagram    = extrairInstagram(website);

  await atualizarLead(lead.id, {
    place_id:      resultado.place_id,
    status_google: statusGoogle,
    website_url:   website,
    instagram_url: instagram,
    verificado_em: new Date().toISOString(),
  });

  const igInfo = instagram ? ' | IG: encontrado' : '';
  console.log(`→ ${statusGoogle}${igInfo}`);
}

async function main() {
  console.log('\n🔍 Validando leads via Google Places...');
  console.log(RETODOS ? '   Modo: TODOS (re-valida já verificados)\n' : '   Modo: apenas não verificados\n');

  const leads = await fetchLeads();

  if (leads.length === 0) {
    console.log('Nenhum lead para validar. Use --todos para re-validar.\n');
    return;
  }

  console.log(`${leads.length} leads para processar.\n`);

  let ativos = 0, encerrados = 0, fechadoTemp = 0, naoEncontrado = 0, comIG = 0;

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    await processarLead(lead, i, leads.length);

    // Atualiza contadores (re-busca não é necessária, só aproximação)
    await sleep(50);
  }

  console.log('\n✅ Validação concluída!');
  console.log('Abra o painel CRM para ver os resultados com os badges de status.\n');
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message);
  process.exit(1);
});
