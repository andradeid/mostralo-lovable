# 🔑 Como Obter o Token do Supabase

## Passo a Passo para Obter o Access Token

### 1. Acesse o Dashboard do Supabase
- URL: https://supabase.com/dashboard
- Faça login na sua conta

### 2. Vá para a Página de Tokens
- Clique no seu **perfil/avatar** no canto superior direito
- Selecione **"Account Settings"** ou **"Account"**
- No menu lateral, clique em **"Access Tokens"** ou **"Tokens"**
- Ou acesse diretamente: https://supabase.com/dashboard/account/tokens

### 3. Crie um Novo Token
- Clique no botão **"Generate New Token"** ou **"Create Token"**
- Dê um nome descritivo (ex: "Deploy Functions")
- Clique em **"Generate Token"** ou **"Create"**
- ⚠️ **IMPORTANTE**: Copie o token imediatamente! Ele só será mostrado uma vez.

### 4. Use o Token
- O token terá um formato como: `sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Você pode me passar o token de duas formas:
  1. **Via mensagem** (não recomendado por segurança, mas funciona)
  2. **Via variável de ambiente** (mais seguro)

---

## 🚀 Como Fazer o Deploy com o Token

### Opção 1: Passar o Token Diretamente (Mais Rápido)
Depois que você me passar o token, eu executo:
```powershell
$env:SUPABASE_ACCESS_TOKEN='seu-token-aqui'
bunx supabase functions deploy reset-customer-password --no-verify-jwt --project-ref noshwvwpjtnvndokbfjx
```

### Opção 2: Você Executa Localmente (Mais Seguro)
Se preferir executar você mesmo:
```powershell
cd "C:\Users\PC\Projetos Cursor\.mostralo"
$env:SUPABASE_ACCESS_TOKEN='seu-token-aqui'
bunx supabase functions deploy reset-customer-password --no-verify-jwt --project-ref noshwvwpjtnvndokbfjx
```

---

## ⚠️ Segurança

- O token dá acesso completo ao seu projeto Supabase
- Não compartilhe o token publicamente
- Você pode revogar tokens antigos a qualquer momento
- Após o deploy, você pode deletar o token se quiser

---

## 📝 Resumo Rápido

1. Acesse: https://supabase.com/dashboard/account/tokens
2. Clique em "Generate New Token"
3. Copie o token (formato: `sbp_...`)
4. Me passe o token ou execute o comando acima

