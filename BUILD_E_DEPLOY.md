# 🚀 Build e Deploy - Guia Completo

## 📋 Índice
- [Preparação](#preparação)
- [Build Local](#build-local)
- [Deploy Vercel (Recomendado)](#deploy-vercel-recomendado)
- [Deploy Netlify](#deploy-netlify)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Troubleshooting](#troubleshooting)

---

## ✅ Preparação

### 1. Verificar Dependências

```powershell
cd C:\Users\PC\Projetos Cursor\.mostralo
bun install
```

### 2. Testar Localmente

```powershell
bun run dev
```

Abra: http://localhost:5173

✅ **Tudo funcionando?** Próximo passo!

---

## 🏗️ Build Local

### Comando de Build

```powershell
cd C:\Users\PC\Projetos Cursor\.mostralo
bun run build
```

### O Que Acontece:

1. ✅ Vite compila o código
2. ✅ Otimiza assets (CSS, JS, imagens)
3. ✅ Gera PWA (Service Worker)
4. ✅ Cria pasta `dist/` com build final

### Verificar Build

```powershell
bun run preview
```

Abra: http://localhost:4173

✅ **Build funcionando?** Pronto para deploy!

---

## 🚀 Deploy Vercel (Recomendado)

### Por Que Vercel?

✅ **Grátis** para projetos pessoais
✅ **Deploy automático** via Git
✅ **HTTPS** automático
✅ **CDN global** ultra rápido
✅ **Zero configuração**

### Passo a Passo

#### 1️⃣ **Criar Conta**

1. Acesse: https://vercel.com/signup
2. Clique em **"Continue with GitHub"**
3. Autorize o Vercel

#### 2️⃣ **Fazer Push para GitHub**

```powershell
cd C:\Users\PC\Projetos Cursor\.mostralo

# Inicializar Git (se ainda não tem)
git init

# Adicionar arquivos
git add .

# Commit
git commit -m "Deploy inicial - Mostralo"

# Criar repositório no GitHub e conectar
# (GitHub vai te dar os comandos exatos)
```

#### 3️⃣ **Importar no Vercel**

1. No Vercel Dashboard: https://vercel.com/dashboard
2. Clique em **"New Project"**
3. Selecione seu repositório **mostralo**
4. Configure:

```
Framework Preset: Vite
Root Directory: ./
Build Command: bun run build
Output Directory: dist
Install Command: bun install
```

#### 4️⃣ **Configurar Variáveis de Ambiente**

Na página do projeto no Vercel:

1. Vá em **Settings** > **Environment Variables**
2. Adicione:

```
VITE_SUPABASE_URL=https://noshwvwpjtnvndokbfjx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2h3dndwanRudm5kb2tiZmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTY2NzYsImV4cCI6MjA3MTM3MjY3Nn0.RkppC11I7QW8n8Fdx5FOyjlX_yE1kOFGUlzb3xpphEA
```

3. Selecione **"Production"**, **"Preview"**, **"Development"**
4. Clique em **"Save"**

#### 5️⃣ **Deploy!**

1. Clique em **"Deploy"**
2. Aguarde 1-2 minutos ⏱️
3. **PRONTO!** 🎉

Seu site estará em: `https://seu-projeto.vercel.app`

### 🔄 Deploys Automáticos

A partir de agora, **QUALQUER push** para GitHub faz deploy automático!

```powershell
# Fazer alteração
git add .
git commit -m "Nova feature"
git push

# Deploy automático! 🚀
```

---

## 🔷 Deploy Netlify

### Alternativa ao Vercel

#### 1️⃣ **Criar Conta**

1. Acesse: https://app.netlify.com/signup
2. Continue com GitHub

#### 2️⃣ **Deploy via Git**

1. **"Add new site"** > **"Import an existing project"**
2. Conecte GitHub
3. Selecione repositório
4. Configure:

```
Build command: bun run build
Publish directory: dist
```

#### 3️⃣ **Variáveis de Ambiente**

Site settings > Environment variables > Add a variable

```
VITE_SUPABASE_URL=https://noshwvwpjtnvndokbfjx.supabase.co
VITE_SUPABASE_ANON_KEY=seu_anon_key_aqui
```

#### 4️⃣ **Deploy!**

Clique em **"Deploy site"**

---

## 🌍 Deploy Manual (Sem Git)

### Vercel CLI

```powershell
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
cd C:\Users\PC\Projetos Cursor\.mostralo
vercel

# Seguir instruções no terminal
```

### Netlify CLI

```powershell
# Instalar Netlify CLI
npm i -g netlify-cli

# Fazer login
netlify login

# Deploy
cd C:\Users\PC\Projetos Cursor\.mostralo
netlify deploy --prod

# Seguir instruções no terminal
```

---

## 🔐 Variáveis de Ambiente

### ⚠️ IMPORTANTE

As variáveis de ambiente do Supabase JÁ estão configuradas no código como fallback.

**Para produção, é RECOMENDADO configurar no Vercel/Netlify:**

```
VITE_SUPABASE_URL=https://noshwvwpjtnvndokbfjx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2h3dndwanRudm5kb2tiZmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTY2NzYsImV4cCI6MjA3MTM3MjY3Nn0.RkppC11I7QW8n8Fdx5FOyjlX_yE1kOFGUlzb3xpphEA
```

### Por Que Usar Variáveis de Ambiente?

✅ **Segurança:** Credenciais não ficam no código
✅ **Flexibilidade:** Trocar ambiente facilmente
✅ **Boas práticas:** Padrão da indústria

---

## 🆘 Troubleshooting

### ❌ Build falha com erro de memória

**Solução:**

```json
// package.json
"scripts": {
  "build": "NODE_OPTIONS=--max-old-space-size=4096 vite build"
}
```

### ❌ "Cannot find module @/"

**Solução:** Verificar `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### ❌ Página em branco após deploy

**Verificar:**
1. Console do navegador (F12)
2. Variáveis de ambiente configuradas?
3. Build local funciona? (`bun run preview`)

### ❌ Service Worker não funciona

**Motivo:** Precisa HTTPS em produção

**Solução:** Vercel/Netlify fornecem HTTPS automático!

### ❌ 404 em rotas (ex: /dashboard)

**Motivo:** Falta configuração de SPA

**Solução:** Arquivos `vercel.json` e `netlify.toml` JÁ configurados!

---

## 📊 Performance

### Build Otimizado

O build automático já inclui:

✅ **Minificação** de JS/CSS
✅ **Tree shaking** (remove código não usado)
✅ **Code splitting** (carrega só o necessário)
✅ **Lazy loading** de rotas
✅ **PWA** com cache estratégico
✅ **Compressão** Gzip/Brotli (Vercel/Netlify)

### Tamanho Esperado

```
dist/
  - index.html: ~2 KB
  - assets/
    - index-[hash].js: ~500-800 KB (React + libs)
    - index-[hash].css: ~50-100 KB
  - sounds/: ~300 KB
```

---

## 🎯 Checklist Final

Antes de deploy em produção:

- [ ] ✅ Testado localmente (`bun run dev`)
- [ ] ✅ Build local funciona (`bun run build` + `bun run preview`)
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ Git commit + push
- [ ] ✅ Deploy no Vercel/Netlify
- [ ] ✅ Testar site em produção
- [ ] ✅ Testar login (Admin e Cliente)
- [ ] ✅ Testar pedidos
- [ ] ✅ Testar PWA (botão "Instalar" no Chrome)

---

## 🚀 Próximos Passos

### Domínio Customizado

**Vercel:**
1. Settings > Domains
2. Add domain: `seudominio.com`
3. Configurar DNS conforme instruções

**Netlify:**
1. Domain settings > Add custom domain
2. Configurar DNS

### Analytics

**Vercel Analytics:**
```powershell
bun add @vercel/analytics
```

**Netlify Analytics:**
Ativar no dashboard (pago)

### Monitoramento

- **Sentry:** Tracking de erros
- **LogRocket:** Gravação de sessões
- **Google Analytics:** Métricas de uso

---

## 💡 Dicas Pro

### Deploy Preview

**Vercel:** Toda PR gera preview automático
**Netlify:** Deploy previews automáticos

### Rollback

**Vercel:** Deployments > Clique em versão anterior > "Promote to Production"
**Netlify:** Deploys > Clique em versão anterior > "Publish deploy"

### CI/CD

Já configurado automaticamente com Git push!

---

## 📞 Suporte

**Problemas?**

1. Verifique logs no dashboard do Vercel/Netlify
2. Teste build local primeiro
3. Me chame! 🚀

---

**Última atualização:** 2025-01-25
**Versão:** 1.0.0

---

**QUER FAZER DEPLOY AGORA?**

Escolha um método:
- [ ] 🚀 Vercel (Recomendado) - Deploy em 5 minutos
- [ ] 🔷 Netlify - Alternativa confiável
- [ ] 💻 Manual via CLI - Para avançados

**Me avise qual você quer e eu te guio passo a passo!** 🎯

