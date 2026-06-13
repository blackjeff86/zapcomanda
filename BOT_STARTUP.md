# ZapComanda — Como ligar o bot

## Visão geral

O bot precisa de **2 janelas de terminal abertas** para funcionar. Se qualquer uma fechar, o WhatsApp para de responder.

```
WhatsApp  ←→  bot.js (porta 8080)  ←→  Cloudflare Tunnel  ←→  Vercel (zapcomanda.vercel.app)
```

---

## Janela 1 — Bot do WhatsApp (Baileys)

**Abrir PowerShell e rodar:**

```powershell
cd C:\evolution-api
node bot.js
```

**O que esperar:**
- Na primeira vez: aparece um QR code no terminal → escaneie com o WhatsApp
- Nas próximas vezes: `WhatsApp conectado!` (sem QR, usa sessão salva em `auth_baileys/`)

**Sinais de que está OK:**
```
WhatsApp conectado!
Bot rodando na porta 8080
```

---

## Janela 2 — Cloudflare Tunnel

**Abrir outro PowerShell e rodar:**

```powershell
cloudflared tunnel --url http://localhost:8080
```

**O que esperar:**
```
Your quick Tunnel has been created!
https://XXXX-XXXX-XXXX-XXXX.trycloudflare.com
```

**⚠️ ATENÇÃO — A URL muda a cada reinício!**

Cada vez que o tunnel reiniciar, você recebe uma URL nova (ex: `chicago-apple-dog-hello.trycloudflare.com`). Nesse caso, siga os passos abaixo.

---

## Quando a URL do tunnel mudar

1. Copie a nova URL (ex: `https://nova-url.trycloudflare.com`)
2. Acesse: [vercel.com/dashboard](https://vercel.com/dashboard) → projeto `zapcomanda` → **Settings → Environment Variables**
3. Edite `EVOLUTION_API_URL` e cole a nova URL
4. Clique em **Save**
5. Vá em **Deployments** → clique nos 3 pontos do último deploy → **Redeploy**
6. Aguarde o deploy terminar (1-2 min)

---

## Checklist rápido (toda vez que ligar o PC)

- [ ] Janela 1: `cd C:\evolution-api` → `node bot.js` → ver `WhatsApp conectado!`
- [ ] Janela 2: `cloudflared tunnel --url http://localhost:8080` → copiar URL
- [ ] Se a URL mudou: atualizar `EVOLUTION_API_URL` no Vercel e redesenhar

---

## Solução de problemas

| Sintoma | Causa | Solução |
|--------|-------|---------|
| Bot não responde no WhatsApp | Janela 1 fechada | Reabrir e rodar `node bot.js` |
| Bot responde mas mensagens não chegam de volta | Tunnel fechado ou URL mudou | Reabrir tunnel, atualizar URL no Vercel |
| QR code aparece de novo | Sessão expirou ou pasta `auth_baileys` foi apagada | Escanear o QR normalmente |
| `WhatsApp conectado!` mas sem resposta | URL do tunnel não atualizada no Vercel | Verificar e atualizar `EVOLUTION_API_URL` |
| Erro `EADDRINUSE port 8080` | Outro processo usando a porta | Fechar outros terminais com node, ou reiniciar o PC |

---

## Localização dos arquivos

| Arquivo | Caminho |
|---------|---------|
| Código do bot | `C:\evolution-api\bot.js` |
| Sessão do WhatsApp | `C:\evolution-api\auth_baileys\` |
| Variáveis de ambiente (local) | `C:\ProjetosFlutter\zapcomanda\.env.local` |
