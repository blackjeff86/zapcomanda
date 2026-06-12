# Guia de deploy — ZapComanda

Passo a passo para colocar o ZapComanda no ar na Vercel e conectar WhatsApp, Supabase e Asaas.

---

## Pré-requisitos (já feitos por você)

- [x] Migrations rodadas no Supabase (schema `zapcomanda`)
- [x] Repositório no GitHub: https://github.com/blackjeff86/zapcomanda

---

## 1. Deploy na Vercel

### 1.1 Importar o projeto

1. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
2. Clique em **Add New → Project**
3. Selecione o repositório **blackjeff86/zapcomanda**
4. Configurações do build:
   - **Framework Preset:** Next.js
   - **Root Directory:** deixe em branco (raiz do repo)
   - **Build Command:** `npm run build` (padrão)
   - **Output Directory:** `.next` (padrão)

5. **Não clique em Deploy ainda** — configure as variáveis de ambiente primeiro (seção 2)

### 1.2 Após o deploy

Anote a URL gerada, por exemplo:

```
https://zapcomanda.vercel.app
```

Você vai usar essa URL nos webhooks do WhatsApp e do Asaas.

---

## 2. Variáveis de ambiente na Vercel

No painel do projeto: **Settings → Environment Variables**

Copie os valores do seu `.env.local` local (ou do Supabase/Asaas/Evolution):

| Variável | Onde pegar | Obrigatória |
|----------|------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role (secreta) | Sim |
| `WHATSAPP_PROVIDER` | `evolution` ou `zapi` | Sim |
| `WHATSAPP_WEBHOOK_SECRET` | Crie um segredo aleatório (ex: `openssl rand -hex 24`) | Recomendado |
| `EVOLUTION_API_URL` | URL da sua Evolution API | Se usar Evolution |
| `EVOLUTION_API_KEY` | Painel da Evolution API | Se usar Evolution |
| `EVOLUTION_INSTANCE_NAME` | Nome da instância WhatsApp | Se usar Evolution |
| `ZAPI_INSTANCE_URL` | Painel Z-API | Se usar Z-API |
| `ZAPI_TOKEN` | Painel Z-API | Se usar Z-API |
| `ASAAS_ENV` | `sandbox` (testes) ou `production` | Sim |
| `ASAAS_API_KEY` | [asaas.com](https://www.asaas.com) → Integrações → API | Sim |
| `ASAAS_WEBHOOK_TOKEN` | Token que você define no webhook do Asaas | Recomendado |

Marque todas para **Production**, **Preview** e **Development**.

Depois de salvar, faça um **Redeploy** (Deployments → ⋮ → Redeploy) para aplicar as variáveis.

---

## 3. Supabase — conferências pós-migration

### 3.1 Schema

As tabelas ficam no schema `zapcomanda` (não em `public`):

- `establishments`, `menu_items`, `menu_item_addons`
- `orders`, `order_items`, `customers`, `payments`
- `whatsapp_sessions`

### 3.2 Autenticação

1. Supabase → **Authentication → URL Configuration**
2. Adicione em **Redirect URLs**:
   ```
   https://SEU-DOMINIO.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```

### 3.3 Realtime (painel de pedidos)

A migration `002_enable_realtime.sql` já habilita updates em tempo real na tabela `orders`.

Se o painel não atualizar sozinho, confira em **Database → Replication** se `zapcomanda.orders` está publicada.

---

## 4. WhatsApp — Evolution API (recomendado)

### 4.1 Conectar o número

1. Suba ou use uma instância Evolution API
2. Crie uma instância e conecte o WhatsApp Business do estabelecimento (QR Code)
3. Anote o **nome da instância** → `EVOLUTION_INSTANCE_NAME`

### 4.2 Configurar webhook

No painel da Evolution, aponte o webhook para:

```
POST https://SEU-DOMINIO.vercel.app/api/webhooks/whatsapp
```

Evento: **messages.upsert** (mensagens recebidas)

Se configurou `WHATSAPP_WEBHOOK_SECRET`, envie no header:

```
Authorization: Bearer SEU_SEGREDO
```

ou

```
apikey: SEU_SEGREDO
```

### 4.3 Vincular instância ao estabelecimento

No Supabase, após criar o estabelecimento pelo onboarding, atualize o campo:

```sql
UPDATE zapcomanda.establishments
SET whatsapp_instance_id = 'nome-da-sua-instancia'
WHERE id = 'uuid-do-estabelecimento';
```

Sem isso, o bot não sabe qual cardápio usar quando chega mensagem.

### 4.4 Testar

1. Mande **oi** para o número conectado
2. Deve aparecer o cardápio com listas clicáveis
3. O pedido deve surgir no painel `/dashboard`

---

## 5. WhatsApp — Z-API (alternativa)

Se `WHATSAPP_PROVIDER=zapi`:

1. Configure o webhook no painel Z-API:
   ```
   https://SEU-DOMINIO.vercel.app/api/webhooks/whatsapp
   ```
2. Preencha `ZAPI_INSTANCE_URL` e `ZAPI_TOKEN` na Vercel

---

## 6. Asaas — Pix automático

### 6.1 Conta e API

1. Crie conta em [asaas.com](https://www.asaas.com) (use sandbox para testes)
2. Gere a **API Key** em Integrações
3. Configure `ASAAS_ENV=sandbox` e `ASAAS_API_KEY` na Vercel

### 6.2 Webhook de pagamento

No Asaas → **Integrações → Webhooks**:

- **URL:** `https://SEU-DOMINIO.vercel.app/api/webhooks/asaas`
- **Eventos:** `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`
- **Token:** mesmo valor de `ASAAS_WEBHOOK_TOKEN` na Vercel

Quando o cliente paga o Pix, o pedido muda para **pago** e o bot envia confirmação no WhatsApp.

### 6.3 Testar em sandbox

Use as [credenciais de teste do Asaas](https://docs.asaas.com) para simular pagamentos sem dinheiro real.

---

## 7. Fluxo completo de teste

```
1. Acesse https://SEU-DOMINIO.vercel.app/signup
2. Crie conta → faça onboarding do estabelecimento
3. Cadastre itens (e adicionais, se quiser)
4. Vincule whatsapp_instance_id no Supabase
5. Mande "oi" no WhatsApp
6. Faça um pedido de teste
7. Pague o Pix (sandbox)
8. Confira o pedido em /dashboard
```

---

## 8. Domínio customizado (opcional)

1. Vercel → **Settings → Domains**
2. Adicione seu domínio (ex: `zapcomanda.seudominio.com.br`)
3. Atualize as Redirect URLs no Supabase
4. Atualize os webhooks do WhatsApp e Asaas com o novo domínio

---

## 9. Desenvolvimento local

```bash
# Na pasta Jeff3 (monorepo) ou zapcomanda/
cp .env.example .env.local
# Preencha .env.local com suas credenciais

npm run dev
# Acesse http://localhost:3000
```

Para testar webhooks localmente, use [ngrok](https://ngrok.com) ou similar:

```bash
ngrok http 3000
# Use a URL https://xxxx.ngrok.io nos webhooks
```

---

## 10. Checklist rápido

- [ ] Deploy na Vercel com variáveis de ambiente
- [ ] Redirect URL do Supabase Auth configurada
- [ ] Webhook WhatsApp apontando para `/api/webhooks/whatsapp`
- [ ] `whatsapp_instance_id` no estabelecimento
- [ ] Webhook Asaas apontando para `/api/webhooks/asaas`
- [ ] Teste: signup → onboarding → pedido via WhatsApp → Pix → painel

---

## Problemas comuns

| Problema | Solução |
|----------|---------|
| Erro Supabase no site | Confira `NEXT_PUBLIC_SUPABASE_URL` e `ANON_KEY` na Vercel |
| Bot não responde | Webhook URL errada ou `whatsapp_instance_id` vazio |
| Pix não gera | `ASAAS_API_KEY` inválida ou ambiente sandbox/production errado |
| Pagamento não confirma | Webhook Asaas não configurado ou token diferente |
| Login não funciona | Adicionar URL de callback no Supabase Auth |
| Listas não aparecem no WhatsApp | Número precisa ser WhatsApp Business API (não pessoal comum) |

---

## Links úteis

- Repositório: https://github.com/blackjeff86/zapcomanda
- Supabase Dashboard: https://supabase.com/dashboard
- Vercel Dashboard: https://vercel.com/dashboard
- Docs Asaas: https://docs.asaas.com
- Evolution API: https://doc.evolution-api.com

---

*Última atualização: junho/2026*
