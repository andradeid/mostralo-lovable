# ✅ Checklist de Deploy - Mostralo

Use este checklist para garantir que tudo está pronto antes do deploy!

---

## 📋 PRÉ-DEPLOY

### 1. Teste Local
- [ ] Aplicação roda sem erros (`bun run dev`)
- [ ] Login funciona (Admin e Cliente)
- [ ] Pedidos podem ser criados
- [ ] Painel de admin funciona
- [ ] Console (F12) sem erros críticos

### 2. Código
- [ ] Todas as alterações estão salvas
- [ ] Não há arquivos com erros (veja editor)
- [ ] `.gitignore` está configurado

### 3. Build Local
- [ ] `bun run build` executa sem erros
- [ ] `bun run preview` mostra app funcionando
- [ ] Tamanho do build é razoável (< 5 MB)

---

## 🚀 DEPLOY

### Opção A: Vercel (Recomendado)

#### Passo 1: GitHub
- [ ] Código commitado no Git
- [ ] Repositório criado no GitHub
- [ ] Push feito para GitHub

#### Passo 2: Vercel
- [ ] Conta criada no Vercel
- [ ] Repositório importado
- [ ] Framework: Vite
- [ ] Build Command: `bun run build`
- [ ] Output Directory: `dist`

#### Passo 3: Variáveis de Ambiente
- [ ] `VITE_SUPABASE_URL` adicionada
- [ ] `VITE_SUPABASE_ANON_KEY` adicionada
- [ ] Variáveis aplicadas a Production/Preview/Development

#### Passo 4: Deploy
- [ ] Deploy iniciado
- [ ] Deploy concluído sem erros
- [ ] URL de produção funcionando

---

### Opção B: Netlify

#### Passo 1: GitHub
- [ ] Código commitado no Git
- [ ] Repositório criado no GitHub
- [ ] Push feito para GitHub

#### Passo 2: Netlify
- [ ] Conta criada no Netlify
- [ ] Repositório importado
- [ ] Build command: `bun run build`
- [ ] Publish directory: `dist`

#### Passo 3: Variáveis de Ambiente
- [ ] `VITE_SUPABASE_URL` adicionada
- [ ] `VITE_SUPABASE_ANON_KEY` adicionada

#### Passo 4: Deploy
- [ ] Deploy iniciado
- [ ] Deploy concluído sem erros
- [ ] URL de produção funcionando

---

## 🧪 PÓS-DEPLOY

### Teste em Produção

- [ ] Site abre sem erro 404
- [ ] HTTPS funciona (🔒 cadeado verde)
- [ ] Login Admin funciona
- [ ] Login Cliente funciona
- [ ] Criar pedido funciona
- [ ] Painel de admin carrega
- [ ] Painel de entregador carrega
- [ ] Notificações funcionam
- [ ] PWA instala corretamente (botão "Instalar")

### Performance

- [ ] Site carrega em < 3 segundos
- [ ] Navegação é fluida
- [ ] Sem erros no console (F12)
- [ ] Service Worker registrado

### Mobile

- [ ] Teste no celular
- [ ] Layout responsivo funciona
- [ ] Touch funciona corretamente
- [ ] PWA pode ser instalado

---

## 🔧 CONFIGURAÇÕES EXTRAS

### Domínio Customizado (Opcional)
- [ ] Domínio comprado
- [ ] DNS configurado
- [ ] Domínio adicionado na plataforma
- [ ] HTTPS funcionando no domínio

### Analytics (Opcional)
- [ ] Google Analytics configurado
- [ ] Vercel Analytics ativado
- [ ] Tracking de conversões

### Monitoramento (Opcional)
- [ ] Sentry configurado (erros)
- [ ] Uptime monitoring
- [ ] Alerts configurados

---

## ⚠️ PROBLEMAS COMUNS

### Build falha
- Verifique se `bun run build` funciona localmente
- Veja logs completos no dashboard
- Verifique se todas as dependências estão no `package.json`

### Página em branco
- Console (F12) mostra erro?
- Variáveis de ambiente configuradas?
- Vercel/Netlify redirecionamentos configurados?

### 404 em rotas
- `vercel.json` está no repositório?
- `netlify.toml` está no repositório?
- Framework preset correto?

### Login não funciona
- Variáveis do Supabase estão corretas?
- URL do Supabase está certa?
- ANON_KEY está correta?

---

## 📱 COMPARTILHAR

Depois que tudo estiver funcionando:

- [ ] Testar link em outro dispositivo
- [ ] Enviar link para equipe
- [ ] Adicionar aos favoritos
- [ ] Criar atalho na home (PWA)

---

## 🎉 DEPLOY BEM-SUCEDIDO!

**Parabéns!** 🚀 Seu app está no ar!

### URLs para salvar:
- **Site em produção:** https://______.vercel.app
- **Dashboard Vercel:** https://vercel.com/dashboard
- **Dashboard Supabase:** https://supabase.com/dashboard

### Próximos deploys:
```bash
git add .
git commit -m "Nova feature"
git push
# Deploy automático! 🎉
```

---

**Última atualização:** 2025-01-25

