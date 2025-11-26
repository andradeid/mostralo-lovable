# 📧 Como Configurar Templates de Email no Supabase

Guia passo a passo para configurar os templates de email do Mostralo no Supabase.

---

## 🚀 Passo a Passo Completo

### 1️⃣ Acessar o Dashboard do Supabase

1. Acesse: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login com sua conta
3. Selecione seu projeto **Mostralo**

---

### 2️⃣ Navegar até Email Templates

```
Dashboard → Authentication (🔐) → Email Templates
```

Ou acesse diretamente:
```
https://supabase.com/dashboard/project/SEU_PROJECT_ID/auth/templates
```

---

### 3️⃣ Configurar Cada Template

#### 📋 Templates Disponíveis no Supabase:

| Template | Arquivo | Quando Usar |
|----------|---------|-------------|
| **Confirm signup** | `welcome-account-created.html` | Confirmação de cadastro |
| **Magic Link** | `magic-link.html` | Login sem senha |
| **Reset Password** | `password-reset.html` | Recuperação de senha |
| **Change Email Address** | *(criar futuramente)* | Mudança de email |
| **Invite User** | *(criar futuramente)* | Convite de usuário |

---

## 📝 Configurando: Confirm Signup (Boas-vindas)

### Passo 1: Selecionar Template
No dashboard do Supabase, clique em **"Confirm signup"**

### Passo 2: Copiar HTML
Abra o arquivo `email-templates/welcome-account-created.html` e copie TODO o conteúdo

### Passo 3: Colar no Supabase
Cole no campo **"Message"** ou **"HTML Template"**

### Passo 4: Configurar Subject
```
Bem-vindo ao Mostralo! 🎉 Confirme seu email
```

### Passo 5: Verificar Variáveis
O Supabase substituirá automaticamente:
- `{{ .Email }}` → Email do usuário
- `{{ .ConfirmationUrl }}` → Link de confirmação
- `{{ .Token }}` → Token de confirmação
- `{{ .TokenHash }}` → Hash do token
- `{{ .SiteURL }}` → URL do seu site

### Passo 6: Salvar
Clique em **"Save"** ou **"Update"**

---

## 🔒 Configurando: Reset Password (Recuperação)

### Passo 1: Selecionar Template
No dashboard do Supabase, clique em **"Reset Password"**

### Passo 2: Copiar HTML
Abra o arquivo `email-templates/password-reset.html` e copie TODO o conteúdo

### Passo 3: Colar no Supabase
Cole no campo de template

### Passo 4: Configurar Subject
```
Recuperação de Senha - Mostralo 🔐
```

### Passo 5: Verificar Variáveis
- `{{ .Email }}` → Email do usuário
- `{{ .ConfirmationUrl }}` → Link de reset
- `{{ .Token }}` → Token
- `{{ .RedirectTo }}` → URL de redirecionamento (opcional)

### Passo 6: Salvar
Clique em **"Save"**

---

## ⚡ Configurando: Magic Link (Login Rápido)

### Passo 1: Selecionar Template
No dashboard do Supabase, clique em **"Magic Link"**

### Passo 2: Copiar HTML
Abra o arquivo `email-templates/magic-link.html` e copie TODO o conteúdo

### Passo 3: Colar no Supabase
Cole no campo de template

### Passo 4: Configurar Subject
```
Login Rápido - Mostralo ⚡
```

### Passo 5: Verificar Variáveis
- `{{ .Email }}` → Email do usuário
- `{{ .ConfirmationUrl }}` → Link mágico de login
- `{{ .Token }}` → Token
- `{{ .SiteURL }}` → URL do site

### Passo 6: Salvar
Clique em **"Save"**

---

## ⚙️ Configurações Importantes

### 1. Site URL
Vá em: **Authentication → URL Configuration**

Defina sua URL de produção:
```
https://seu-dominio.com.br
```

Para desenvolvimento:
```
http://localhost:5173
```

### 2. Redirect URLs
Adicione URLs permitidas para redirecionamento:
```
https://seu-dominio.com.br/**
http://localhost:5173/**
```

### 3. Email Rate Limits
Para evitar spam, configure limites:
- Max 3-5 emails por hora por usuário
- Max 10 tentativas de login por hora

---

## 🧪 Testando os Templates

### Método 1: Teste Real
1. Crie uma conta de teste
2. Verifique o email recebido
3. Confira se as cores e links estão corretos

### Método 2: Preview no Supabase
Alguns templates do Supabase permitem preview direto no dashboard.

### Método 3: Mailtrap (Recomendado para DEV)
```javascript
// Em desenvolvimento, use Mailtrap para testar
// Não enviar emails reais durante desenvolvimento
```

---

## 📋 Checklist de Configuração

Antes de ir para produção:

### ✅ Templates Configurados
- [ ] Confirm Signup (welcome-account-created.html)
- [ ] Reset Password (password-reset.html)
- [ ] Magic Link (magic-link.html)

### ✅ Configurações Gerais
- [ ] Site URL configurada
- [ ] Redirect URLs configuradas
- [ ] SMTP configurado (se usar custom)
- [ ] Rate limits configurados

### ✅ Testes Realizados
- [ ] Testado em Gmail
- [ ] Testado em Outlook
- [ ] Testado em mobile
- [ ] Links funcionando
- [ ] Variáveis substituídas corretamente

### ✅ Personalização
- [ ] Subject lines definidos
- [ ] Logo adicionado (se aplicável)
- [ ] Links de redes sociais atualizados
- [ ] Email de suporte correto

---

## 🎨 Personalizando Cores

Se quiser ajustar as cores da marca:

### Cor Primária (Laranja)
Procure por: `#D97706` e `#F59E0B`
Substitua por sua cor

### Gradientes
Procure por:
```css
background: linear-gradient(135deg, #D97706 0%, #F59E0B 100%);
```

### Cores de Alerta
- Verde sucesso: `#10B981`
- Vermelho erro: `#EF4444`
- Amarelo aviso: `#FEF3C7`

---

## 🔧 SMTP Customizado (Opcional)

Se quiser usar seu próprio servidor de email:

### Passo 1: Configurar SMTP
```
Dashboard → Settings → Email → SMTP Settings
```

### Passo 2: Preencher Dados
```
SMTP Host: smtp.seu-provedor.com
SMTP Port: 587 (ou 465 para SSL)
SMTP User: seu-email@dominio.com
SMTP Password: sua-senha
From Email: noreply@mostralo.com.br
From Name: Mostralo
```

### Passo 3: Testar Conexão
Clique em **"Test Connection"**

### Passo 4: Salvar
Se teste passar, clique em **"Save"**

### ⚠️ Provedores Recomendados:
- **SendGrid** (Grátis até 100 emails/dia)
- **Mailgun** (Bom para alto volume)
- **AWS SES** (Muito barato)
- **Postmark** (Excelente deliverability)

---

## 📊 Monitoramento

### Ver Emails Enviados
```
Dashboard → Logs → Search "email"
```

### Métricas Importantes
- Taxa de entrega (Delivery Rate)
- Taxa de abertura (Open Rate)
- Taxa de clique (Click Rate)
- Emails rejeitados (Bounced)

---

## 🆘 Troubleshooting

### Problema: Emails não estão sendo enviados
**Solução:**
1. Verifique logs do Supabase
2. Confira configurações de SMTP
3. Verifique se email está na blacklist
4. Teste com outro provedor de email

### Problema: Emails caindo no spam
**Solução:**
1. Configure SPF, DKIM, DMARC
2. Use domínio próprio (não @gmail.com)
3. Melhore conteúdo (menos links suspeitos)
4. Aqueça seu domínio gradualmente

### Problema: Links não funcionam
**Solução:**
1. Verifique Site URL no Supabase
2. Confira Redirect URLs
3. Teste links manualmente
4. Verifique se variáveis estão corretas

### Problema: Design quebrado
**Solução:**
1. Teste em diferentes clientes (Gmail, Outlook)
2. Use apenas CSS inline
3. Use tabelas para layout
4. Evite CSS avançado

---

## 📚 Recursos Adicionais

### Documentação Oficial
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase SMTP Settings](https://supabase.com/docs/guides/auth/auth-smtp)

### Ferramentas Úteis
- [Mailtrap](https://mailtrap.io/) - Teste de emails
- [Litmus](https://www.litmus.com/) - Teste em múltiplos clientes
- [Mail Tester](https://www.mail-tester.com/) - Score de spam

---

## 💡 Dicas Pro

### 1. Use Domínio Próprio
Em vez de enviar de `noreply@supabase.co`, use `noreply@mostralo.com.br`

### 2. Segmente Emails
Diferentes templates para diferentes ações do usuário

### 3. A/B Testing
Teste diferentes subject lines e designs

### 4. Monitore Métricas
Acompanhe taxas de abertura e cliques

### 5. Mantenha Simples
Emails simples têm melhor deliverability

---

## ✅ Próximos Passos

Após configurar os templates:

1. **Teste em Staging** - Sempre teste antes de produção
2. **Configure DNS** - SPF, DKIM, DMARC para melhor entrega
3. **Monitore Métricas** - Acompanhe performance dos emails
4. **Crie Novos Templates** - Email de pedidos, notificações, etc.
5. **Otimize Continuamente** - Melhore baseado em feedback

---

**Alguma dúvida?** Entre em contato: dev@mostralo.com.br

**Última atualização:** 22/11/2024

