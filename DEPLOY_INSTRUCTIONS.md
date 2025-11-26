# 🚀 Instruções para Deploy da Edge Function

## Função: `reset-customer-password`

### ✅ Correções Aplicadas

A função foi atualizada com:
- ✅ Validação de autenticação (Authorization header)
- ✅ Validação de permissões (store_admin ou master_admin)
- ✅ Códigos HTTP apropriados (400, 401, 403, 404, 500)
- ✅ Service role key para alterar senhas

---

## 📦 Método 1: Deploy via Supabase Dashboard (RECOMENDADO - Mais Fácil)

1. **Acesse o Dashboard:**
   - URL: https://supabase.com/dashboard
   - Faça login na sua conta

2. **Selecione o Projeto:**
   - Projeto ID: `noshwvwpjtnvndokbfjx`
   - URL: `https://noshwvwpjtnvndokbfjx.supabase.co`

3. **Navegue até Edge Functions:**
   - No menu lateral, clique em **"Edge Functions"**
   - Ou acesse diretamente: https://supabase.com/dashboard/project/noshwvwpjtnvndokbfjx/functions

4. **Encontre a Função:**
   - Procure por `reset-customer-password` na lista de funções

5. **Faça o Deploy:**
   - Clique no botão **"Deploy"** ou **"Redeploy"**
   - O Supabase lerá automaticamente o código de:
     ```
     .mostralo/supabase/functions/reset-customer-password/index.ts
     ```

6. **Verifique o Deploy:**
   - Após o deploy, a função estará disponível em:
     ```
     https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/reset-customer-password
     ```

---

## 📦 Método 2: Deploy via Supabase CLI

### Instalação do Supabase CLI

**Opção A: Via npm (requer Node.js)**
```powershell
npm install -g supabase
```

**Opção B: Via Scoop (Windows)**
```powershell
scoop install supabase
```

**Opção C: Via Chocolatey (Windows)**
```powershell
choco install supabase
```

**Opção D: Download Manual**
1. Acesse: https://github.com/supabase/cli/releases
2. Baixe a versão para Windows
3. Extraia e adicione ao PATH

### Fazer o Deploy

1. **Navegue até o diretório do projeto:**
   ```powershell
   cd "C:\Users\PC\Projetos Cursor\.mostralo"
   ```

2. **Faça login no Supabase (primeira vez):**
   ```powershell
   supabase login
   ```

3. **Conecte ao projeto:**
   ```powershell
   supabase link --project-ref noshwvwpjtnvndokbfjx
   ```

4. **Faça o deploy da função:**
   ```powershell
   supabase functions deploy reset-customer-password --no-verify-jwt
   ```

   > **Nota:** O flag `--no-verify-jwt` é necessário porque a função agora faz sua própria validação de JWT internamente.

---

## 🧪 Testar a Função

Após o deploy, você pode testar a função:

1. **No Dashboard do Supabase:**
   - Vá em Edge Functions > `reset-customer-password`
   - Clique em "Test" ou "Invoke"
   - Use o body:
     ```json
     {
       "customerId": "id-do-cliente",
       "newPassword": "novaSenha123"
     }
     ```

2. **Via Código:**
   - A função já está sendo chamada em:
     ```
     .mostralo/src/pages/admin/AdminCustomersPage.tsx
     ```
   - Teste resetando a senha de um cliente na interface admin

---

## ✅ Verificação

Após o deploy, verifique:

- [ ] A função aparece na lista de Edge Functions
- [ ] O status está como "Active" ou "Deployed"
- [ ] Não há erros nos logs
- [ ] Teste resetar a senha de um cliente na interface admin

---

## 🐛 Troubleshooting

### Erro: "Function not found"
- Verifique se o caminho do arquivo está correto
- Certifique-se de que está no diretório `.mostralo`

### Erro: "Authentication failed"
- Faça login novamente: `supabase login`
- Verifique se você tem permissões no projeto

### Erro: "Permission denied"
- Verifique se você é owner/admin do projeto no Supabase
- Entre em contato com o administrador do projeto

---

## 📝 Arquivos Modificados

- ✅ `.mostralo/supabase/functions/reset-customer-password/index.ts` - Função atualizada
- ✅ `.mostralo/src/pages/admin/AdminCustomersPage.tsx` - Correção de busca de clientes

---

**Última atualização:** Função corrigida com validações de segurança completas.

