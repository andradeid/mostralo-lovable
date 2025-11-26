# 🔧 Troubleshooting - Cadastro de Usuários

## 🚨 Problema: "Lojista sem loja vinculada"

### **Sintoma:**
- Usuário tenta criar conta
- Processo falha no meio
- Usuário fica preso no sistema
- Mensagem: "Você não está vinculado a nenhuma loja"
- Não consegue fazer logout
- Não consegue acessar nenhuma página

---

## 🔍 **Causa Raiz:**

Cadastro **parcialmente completado**:

```
1. ✅ Usuário criado no auth.users
2. ✅ Profile criado em profiles
3. ✅ Role criado em user_roles
4. ❌ FALHA ao criar loja (erro)
5. ❌ Usuario fica sem loja
6. 🔒 Sistema bloqueia acesso
```

---

## ✅ **Solução Aplicada:**

### **1. Código Corrigido: useStoreAccess.tsx**

**ANTES (❌ Bloqueava):**
```typescript
if (!stores || stores.length === 0) {
  toast.error('Você não está vinculado a nenhuma loja');
  setHasAccess(false);
  navigate('/');  // ❌ Redireciona mas continua logado
  return;
}
```

**AGORA (✅ Desbloqueia):**
```typescript
if (!stores || stores.length === 0) {
  // Se está aguardando aprovação, redireciona para assinatura
  if (profile?.approval_status === 'pending') {
    navigate('/dashboard/subscription');
    setHasAccess(false);
    return;
  }
  
  // Se não está pendente e não tem loja, faz logout
  toast.error('Você não está vinculado a nenhuma loja');
  await supabase.auth.signOut();  // ✅ Faz logout
  navigate('/auth');
  return;
}
```

---

## 🛠️ **Como Resolver Manualmente:**

### **Método 1: Limpar Navegador (Usuário)**

1. **Abrir Console do navegador:**
   ```
   F12 → Console
   ```

2. **Limpar dados:**
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   ```

3. **Recarregar:**
   ```
   CTRL + SHIFT + R
   ```

### **Método 2: Deletar Usuário Incompleto (Admin)**

```sql
-- Verificar usuário
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.user_type,
    s.id as store_id
FROM profiles p
LEFT JOIN stores s ON s.owner_id = p.id
WHERE p.email = 'email@problema.com';

-- Deletar usuário (cascata deleta profile, roles, etc)
DELETE FROM auth.users WHERE id = '<uuid_do_usuario>';
```

### **Método 3: Criar Loja Para Usuário Existente**

```sql
-- Criar loja para usuário sem loja
INSERT INTO stores (
    name, 
    owner_id, 
    status, 
    plan_id
)
VALUES (
    'Nome da Loja',
    '<uuid_do_usuario>',
    'inactive',
    '<uuid_do_plano>'
);
```

---

## 🎯 **Prevenção - Melhorias Futuras:**

### **1. Transaction Completa no Cadastro**

```typescript
// TODO: Implementar transação atômica
const { error } = await supabase.rpc('create_complete_account', {
  email,
  password,
  store_name,
  plan_id,
  // ... outros dados
});

// Se falhar, faz rollback completo
// Nada fica pela metade
```

### **2. Retry Automático**

```typescript
// TODO: Se criar loja falhar, tentar 3x
for (let i = 0; i < 3; i++) {
  const { error } = await createStore(...);
  if (!error) break;
  await sleep(1000 * i);  // Espera 0s, 1s, 2s
}
```

### **3. Fila de Processamento**

```typescript
// TODO: Criar fila para processar cadastros
// Se falhar, reprocessar automaticamente
// Notificar admin se falhar 3x
```

---

## 📋 **Checklist de Diagnóstico:**

Quando usuário reportar problema de acesso:

- [ ] Verificar se usuário existe em `auth.users`
- [ ] Verificar se profile existe em `profiles`
- [ ] Verificar se tem role em `user_roles`
- [ ] **Verificar se tem loja em `stores`** ⚠️
- [ ] Verificar `approval_status` do profile
- [ ] Verificar `status` da loja (se existir)
- [ ] Checar logs do Postgres para erros

---

## 🔐 **Comandos Úteis:**

### **Verificar Usuário Completo:**
```sql
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.user_type,
    p.approval_status,
    s.id as store_id,
    s.name as store_name,
    s.status as store_status,
    ur.role
FROM profiles p
LEFT JOIN stores s ON s.owner_id = p.id
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE p.email = 'email@usuario.com';
```

### **Listar Usuários Sem Loja:**
```sql
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.user_type,
    p.created_at
FROM profiles p
LEFT JOIN stores s ON s.owner_id = p.id
WHERE p.user_type = 'store_admin'
AND s.id IS NULL
ORDER BY p.created_at DESC;
```

### **Limpar Usuários Incompletos (CUIDADO!):**
```sql
-- Deletar usuários store_admin sem loja criados há mais de 1 hora
DELETE FROM auth.users
WHERE id IN (
    SELECT p.id
    FROM profiles p
    LEFT JOIN stores s ON s.owner_id = p.id
    WHERE p.user_type = 'store_admin'
    AND s.id IS NULL
    AND p.created_at < NOW() - INTERVAL '1 hour'
);
```

---

## ⚠️ **Avisos Importantes:**

1. **NUNCA** deletar usuários com loja associada
2. **SEMPRE** verificar antes de deletar
3. **BACKUP** antes de operações em massa
4. **AVISAR** usuário antes de deletar conta
5. **DOCUMENTAR** ações de admin

---

## 📞 **Suporte Rápido:**

Se usuário ficar preso:

**Usuário:**
1. F12 → Console
2. `localStorage.clear()`
3. CTRL + SHIFT + R

**Admin:**
```sql
-- Ver problema
SELECT * FROM profiles WHERE email = '...';

-- Deletar
DELETE FROM auth.users WHERE id = '...';
```

**Avisar usuário:**
"Seu cadastro anterior foi removido. Por favor, crie sua conta novamente."

---

**Data:** 22/11/2024  
**Versão:** 1.0  
**Status:** ✅ Documentado e Corrigido

