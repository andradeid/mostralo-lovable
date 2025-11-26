# 📧 Templates de Email - Mostralo

Este diretório contém todos os templates de email em HTML usados pela plataforma Mostralo.

## 🎨 Identidade Visual

### Cores Principais
- **Laranja Primário:** `#D97706` (hsl(24 70% 50%))
- **Laranja Secundário:** `#F59E0B`
- **Verde Sucesso:** `#10B981`
- **Vermelho Alerta:** `#EF4444`
- **Cinza Claro:** `#F9FAFB`
- **Cinza Texto:** `#4a4a4a`

### Gradientes
```css
background: linear-gradient(135deg, #D97706 0%, #F59E0B 100%);
```

## 📁 Templates Disponíveis

### 1. `welcome-account-created.html`
**Descrição:** Email de boas-vindas enviado após criação de conta

**Variáveis do Supabase:**
- `{{ .Email }}` - Email do usuário
- `{{ .ConfirmationUrl }}` - URL de confirmação de email
- `{{ .CreatedAt }}` - Data de criação da conta

**Quando usar:**
- Após criação de nova conta
- Processo de signup/registro

---

## 🔧 Como Usar no Supabase

### 1. Acessar Configurações de Email
```
Supabase Dashboard → Authentication → Email Templates
```

### 2. Selecionar Template
Escolha o tipo de email:
- **Confirm signup** (Confirmar cadastro)
- **Magic Link**
- **Change Email Address**
- **Reset Password**

### 3. Copiar e Colar HTML
Copie o conteúdo do arquivo `.html` e cole no editor do Supabase.

### 4. Variáveis Disponíveis por Tipo

#### Confirm Signup (welcome-account-created.html)
```
{{ .Email }}
{{ .Token }}
{{ .TokenHash }}
{{ .SiteURL }}
{{ .ConfirmationURL }}
```

#### Magic Link
```
{{ .Email }}
{{ .Token }}
{{ .TokenHash }}
{{ .SiteURL }}
{{ .MagicLink }}
```

#### Reset Password
```
{{ .Email }}
{{ .Token }}
{{ .TokenHash }}
{{ .SiteURL }}
{{ .RedirectTo }}
```

#### Change Email
```
{{ .Email }}
{{ .NewEmail }}
{{ .Token }}
{{ .TokenHash }}
{{ .SiteURL }}
{{ .ChangeEmailURL }}
```

---

## ✅ Checklist de Teste

Antes de usar em produção, teste:

- [ ] **Desktop:** Outlook, Gmail, Apple Mail
- [ ] **Mobile:** Gmail App, iPhone Mail, Outlook App
- [ ] **Web:** Gmail Web, Outlook Web, Yahoo Mail
- [ ] **Links:** Todos os links funcionam
- [ ] **Imagens:** Todas as imagens carregam
- [ ] **Variáveis:** Todas as variáveis são substituídas
- [ ] **Responsivo:** Design se adapta a telas pequenas
- [ ] **Dark Mode:** Teste em clientes com modo escuro

---

## 📝 Boas Práticas

### ✅ DO (Faça)
- Use tabelas para layout (compatibilidade)
- Inline CSS sempre
- Teste em múltiplos clientes de email
- Use cores com alto contraste
- Mantenha largura máxima de 600px
- Forneça link alternativo ao texto
- Use alt text em imagens
- Mobile-first design

### ❌ DON'T (Não Faça)
- Não use CSS externo ou `<style>` tags
- Não use JavaScript
- Não use vídeos ou conteúdo interativo
- Não use fontes web sem fallback
- Não dependa apenas de imagens
- Não use position: absolute/fixed
- Não use background-image (pode não funcionar)

---

## 🔄 Criar Novo Template

### Estrutura Base

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Título do Email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  <table role="presentation" width="100%">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px;">
          
          <!-- Header com Gradiente -->
          <tr>
            <td style="background: linear-gradient(135deg, #D97706 0%, #F59E0B 100%); padding: 40px 30px;">
              <!-- Logo Mostralo -->
            </td>
          </tr>
          
          <!-- Corpo -->
          <tr>
            <td style="padding: 40px;">
              <!-- Conteúdo aqui -->
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #FAFAFA; padding: 32px 40px;">
              <!-- Footer aqui -->
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 🎯 Templates Futuros

Templates que podem ser criados:

- [ ] `password-reset.html` - Reset de senha
- [ ] `magic-link.html` - Login sem senha
- [ ] `email-change.html` - Mudança de email
- [ ] `order-confirmation.html` - Confirmação de pedido
- [ ] `order-status-update.html` - Atualização de status
- [ ] `new-order-admin.html` - Novo pedido para admin
- [ ] `delivery-assigned.html` - Entregador atribuído
- [ ] `promotion-notification.html` - Nova promoção
- [ ] `subscription-expiring.html` - Assinatura expirando
- [ ] `subscription-expired.html` - Assinatura expirada
- [ ] `welcome-driver.html` - Boas-vindas entregador
- [ ] `payment-success.html` - Pagamento confirmado
- [ ] `payment-failed.html` - Falha no pagamento

---

## 📚 Recursos Úteis

### Ferramentas de Teste
- [Litmus](https://www.litmus.com/) - Teste em múltiplos clientes
- [Email on Acid](https://www.emailonacid.com/) - Validação de emails
- [Mailtrap](https://mailtrap.io/) - Teste de emails dev
- [PutsMail](https://putsmail.com/) - Envio de email teste

### Referências
- [Can I Email](https://www.caniemail.com/) - Suporte CSS em emails
- [Really Good Emails](https://reallygoodemails.com/) - Inspiração
- [Email Love](https://emaillove.com/) - Galeria de emails

### Validação
- [HTML Email Check](https://www.htmlemailcheck.com/check/) - Validador
- [Mail Tester](https://www.mail-tester.com/) - Score de spam

---

## 🛠️ Suporte

Dúvidas sobre templates de email?

- **Email:** dev@mostralo.com.br
- **Docs:** `/GUIAS_E_DOCS.md`
- **Supabase Docs:** [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

---

**Desenvolvido com ❤️ para o Mostralo**  
**Última atualização:** 22/11/2024

