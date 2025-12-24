# 🚀 Deploy: Funcionalidade de Reset de Senha

## ✅ Arquivos Criados

### Frontend:
- ✅ `src/components/admin/UserPasswordResetDialog.tsx` (novo componente)
- ✅ `src/pages/admin/UsersPage.tsx` (atualizado com botão)

### Backend:
- ✅ `supabase/functions/admin-reset-password/index.ts` (nova Edge Function)
- ✅ `supabase/migrations/20241122000000_add_password_reset_policies.sql` (migration)
- ✅ `supabase/config.toml` (atualizado)

### Documentação:
- ✅ `FUNCIONALIDADE_RESET_SENHA.md` (guia completo)
- ✅ `DEPLOY_RESET_SENHA.md` (este arquivo)

---

## 🎯 Próximos Passos para Deploy

### 1️⃣ **Aplicar Migration no Banco de Dados**

```bash
# Navegar até o projeto
cd "C:\Users\PC\Projetos Cursor\.mostralo"

# Aplicar migration
supabase db push
```

**O que isso faz:**
- Cria/verifica tabela `admin_audit_log`
- Aplica políticas RLS
- Cria função helper `is_master_admin()`
- Adiciona índices de performance

---

### 2️⃣ **Deploy da Edge Function**

```bash
# Deploy da função
supabase functions deploy admin-reset-password

# Verificar se foi deployada
supabase functions list
```

**Verificar:**
- Função aparece na lista
- Status: deployed
- verify_jwt: true

---

### 3️⃣ **Testar Localmente (Opcional mas Recomendado)**

#### A. Iniciar servidor local:
```bash
bun run dev
```

#### B. Acessar:
```
http://localhost:5173/auth
```

#### C. Fazer login como master_admin:
```
Email: ingabeachsports@gmail.com
Senha: Ing@beach!951753
```

#### D. Ir para lista de usuários:
```
http://localhost:5173/dashboard/users
```

#### E. Testar:
1. Clicar nos 3 pontos de um usuário
2. Clicar em "Resetar Senha"
3. Testar aba "Enviar Email"
4. Testar aba "Definir Senha" (se master_admin)

---

### 4️⃣ **Verificar em Produção**

#### A. Verificar Migration:
```bash
# Ver migrations aplicadas
supabase db show
```

#### B. Verificar Edge Function:
```bash
# Ver logs da função
supabase functions logs admin-reset-password
```

#### C. Verificar RLS Policies:
```sql
-- No Supabase Dashboard > SQL Editor
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'admin_audit_log';
```

---

## ✅ Checklist de Validação

### Banco de Dados:
- [ ] Migration aplicada sem erros
- [ ] Tabela `admin_audit_log` existe
- [ ] 3+ políticas RLS criadas
- [ ] Função `is_master_admin()` existe
- [ ] Índices criados

### Edge Function:
- [ ] Função deployada
- [ ] Aparece em `supabase functions list`
- [ ] verify_jwt = true
- [ ] Sem erros nos logs

### Frontend:
- [ ] Botão "Resetar Senha" aparece no menu
- [ ] Dialog abre corretamente
- [ ] Abas funcionam (Email e Manual)
- [ ] Validações funcionam
- [ ] Toasts aparecem

### Funcional:
- [ ] Envio de email funciona
- [ ] Email chega na caixa de entrada
- [ ] Link do email funciona
- [ ] Reset manual funciona (master_admin)
- [ ] Reset manual bloqueado (store_admin)
- [ ] Audit log registra ações
- [ ] Senha nova permite login

---

## 🧪 Testes Sugeridos

### Teste 1: Enviar Email
```
1. Login como master_admin
2. /dashboard/users
3. Selecionar usuário qualquer
4. Resetar Senha → Enviar Email
5. Verificar email chegou
6. Clicar no link
7. Definir nova senha
8. Fazer login
```

### Teste 2: Reset Manual
```
1. Login como master_admin
2. /dashboard/users
3. Selecionar usuário qualquer
4. Resetar Senha → Definir Senha
5. Digite: "teste123" e confirme
6. Verificar toast de sucesso
7. Fazer logout
8. Login com o usuário e nova senha
9. Verificar audit log
```

### Teste 3: Permissões
```
1. Login como store_admin
2. /dashboard/users
3. Tentar resetar senha
4. Verificar que aba "Definir Senha" está desabilitada
5. Verificar que pode enviar email
```

---

## 🐛 Resolução de Problemas

### ❌ Erro: "Migration failed"
**Solução:**
```bash
# Ver erro específico
supabase db push --debug

# Se conflito, resetar localmente
supabase db reset
```

### ❌ Erro: "Function deployment failed"
**Solução:**
```bash
# Ver logs
supabase functions logs admin-reset-password --tail

# Redeploy
supabase functions deploy admin-reset-password --no-verify-jwt
```

### ❌ Erro: "Forbidden" ao resetar
**Soluções:**
1. Verificar se usuário é master_admin:
```sql
SELECT id, email, user_type 
FROM profiles 
WHERE id = auth.uid();
```

2. Verificar RLS policies:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'admin_audit_log';
```

3. Verificar service_role key:
- Supabase Dashboard > Settings > API
- Service role key deve estar configurada

### ❌ Email não chega
**Soluções:**
1. Verificar SMTP:
   - Supabase Dashboard > Authentication > Email Templates
   - Configurar SMTP se necessário

2. Verificar spam/lixo eletrônico

3. Testar com outro provedor de email

---

## 📊 Monitoramento

### Ver Logs de Reset de Senha:
```sql
-- Últimos 20 resets
SELECT 
  al.created_at,
  pa.email as admin_email,
  pu.email as user_email,
  al.details
FROM admin_audit_log al
LEFT JOIN profiles pa ON pa.id = al.admin_id
LEFT JOIN profiles pu ON pu.id = al.target_user_id
WHERE al.action = 'password_reset'
ORDER BY al.created_at DESC
LIMIT 20;
```

### Alertas:
```sql
-- Alertar se muitos resets em pouco tempo
SELECT 
  COUNT(*) as resets_ultimas_24h
FROM admin_audit_log
WHERE action = 'password_reset'
  AND created_at > NOW() - INTERVAL '24 hours';
```

---

## 🎉 Conclusão

Após seguir todos os passos acima, a funcionalidade de **Reset de Senha** estará 100% funcional em produção!

### O que você ganha:
- ✅ Master Admins podem resetar senhas
- ✅ Duas formas: email ou manual
- ✅ Auditoria completa
- ✅ Segurança robusta
- ✅ Interface intuitiva

---

## 📞 Suporte

Se encontrar problemas:
1. Ver `FUNCIONALIDADE_RESET_SENHA.md` (guia completo)
2. Ver logs: `supabase functions logs admin-reset-password`
3. Ver RLS: Supabase Dashboard > Database > Policies
4. Abrir issue no repositório

---

**Status:** ✅ Pronto para Deploy  
**Tempo Estimado:** 10-15 minutos  
**Complexidade:** Média  
**Risco:** Baixo (não afeta funcionalidades existentes)

---

**Boa sorte com o deploy! 🚀**

