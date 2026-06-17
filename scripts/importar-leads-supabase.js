#!/usr/bin/env node
/**
 * Importa os leads do docs/leads.md para o Supabase.
 * Execute UMA VEZ após rodar a migration 020.
 * Usa fetch nativo do Node.js 20 — sem dependências extras.
 */

const fs   = require('fs');
const path = require('path');

// Lê o .env.local manualmente
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('\n❌ Variáveis não encontradas no .env.local');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=eyJ...\n');
  process.exit(1);
}

const LEADS_FILE = path.resolve(__dirname, '../docs/leads.md');
const HEADERS = {
  'apikey':           serviceKey,
  'Authorization':    `Bearer ${serviceKey}`,
  'Content-Type':     'application/json',
  'Prefer':           'return=minimal',
  'Content-Profile':  'zapcomanda',
};

function parseLeadsMd(content) {
  const leads = [];
  for (const line of content.split('\n')) {
    if (!line.startsWith('|')) continue;
    const cols = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cols.length < 6) continue;
    const nome = cols[1];
    if (!nome || nome === 'Nome' || nome.startsWith('---') || nome.startsWith('Status')) continue;
    const clean = (v) => (!v || v === '—' || v === '-') ? null : v;
    leads.push({
      nome,
      telefone:       clean(cols[2]),
      local_endereco: clean(cols[3]),
      avaliacao:      clean(cols[4]),
      canal_origem:   clean(cols[5]) ?? 'Google Maps',
      notas:          cols[7] ? clean(cols[7]) : null,
      status:         'novo',
    });
  }
  return leads;
}

async function inserirBatch(batch) {
  const res = await fetch(`${supabaseUrl}/rest/v1/leads`, {
    method:  'POST',
    headers: HEADERS,
    body:    JSON.stringify(batch),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
}

async function main() {
  if (!fs.existsSync(LEADS_FILE)) {
    console.error('\n❌ docs/leads.md não encontrado.\n');
    process.exit(1);
  }

  const content = fs.readFileSync(LEADS_FILE, 'utf-8');
  const leads   = parseLeadsMd(content);

  if (leads.length === 0) {
    console.log('\nNenhum lead encontrado no arquivo.\n');
    return;
  }

  console.log(`\nImportando ${leads.length} leads para o Supabase...\n`);

  const BATCH = 50;
  let total = 0;

  for (let i = 0; i < leads.length; i += BATCH) {
    const batch = leads.slice(i, i + BATCH);
    try {
      await inserirBatch(batch);
      total += batch.length;
      process.stdout.write(`  ${total}/${leads.length} importados...\r`);
    } catch (err) {
      console.error(`\nErro no batch ${i}–${i + BATCH}:`, err.message);
    }
  }

  console.log(`\n✅ ${total} leads importados com sucesso!\n`);
}

main().catch(console.error);
