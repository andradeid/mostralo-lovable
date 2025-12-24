# 🔓 Correção: Usuário Bloqueado por Approval Status

## 📋 **PROBLEMA REAL IDENTIFICADO**

### O que estava acontecendo:
- ✅ Data de expiração foi corrigida (31/12/2026)
- ✅ Plano Premium está ativo
- ✅ Store.status está 'active'
- ❌ **MAS** `approval_status` está 'pending' ← **ESTE É O PROBLEMA!**
- ❌ Usuário continua bloqueado

---

## 🔍 **Por que isso acontece?**

O sistema tem **DUAS verificações independentes**:

### 1. **Verificação de Assinatura** (Já corrigida ✅)
```typescript
// Verifica se tem plano ativo e data de expiração válida
const isSubscriptionInactive = planInfo?.status === 'expired' || storeConfig?.status === 'inactive';
```

### 2. **Verificação de Aprovação** (❌ ESTE está bloqueando!)
```typescript
// Verifica se o perfil foi aprovado pelo super admin
const isApprovalPending = profile?.approval_status === 'pending' || profile?.approval_status === 'rejected';

// Se approval_status não for 'approved', BLOQUEIA!
if (isApprovalPending || isSubscriptionInactive) {
  return [ /* apenas menu de assinatura */ ];
}
```

**Locais que bloqueiam:**
1. **AdminLayout.tsx** (linha 76): Redireciona para /dashboard/subscription
2. **AdminSidebar.tsx** (linha 176): Mostra apenas menu "Minha Assinatura"

---

## 📊 **Valores possíveis de approval_status:**

| Valor | Significado | Acesso |
|-------|-------------|--------|
| `pending` | Aguardando aprovação do admin | ❌ BLOQUEADO |
| `rejected` | Pagamento rejeitado | ❌ BLOQUEADO |
| `approved` | Pagamento aprovado | ✅ LIBERADO |

---

## ✅ **SOLUÇÃO (3 Opções)**

### **OPÇÃO 1: Interface do Sistema (Recomendado)**

```
1. Login como master_admin
2. Acessar: /dashboard/subscription-payments
3. Procurar "ingabeachsports@gmail.com" em "Novos Assinantes Pendentes"
4. Clicar no botão verde "Aprovar"
5. ✅ Sistema automaticamente:
   - Muda approval_status para 'approved'
   - Libera o acesso
   - Cria fatura
```

**Vantagens:**
- ✅ Usa o fluxo oficial do sistema
- ✅ Registra no histórico
- ✅ Cria fatura automaticamente
- ✅ Seguro e rastreável

---

### **OPÇÃO 2: SQL Direto no Banco (Mais rápido)**

```sql
-- Aprovar o usuário manualmente
UPDATE profiles
SET 
  approval_status = 'approved',
  updated_at = NOW()
WHERE email = 'ingabeachsports@gmail.com';
```

**Como executar:**
```
1. Acessar Supabase Dashboard
2. Ir em SQL Editor
3. Colar o SQL acima
4. Executar (Run)
5. Recarregar navegador no sistema
6. ✅ Usuário liberado!
```

**Vantagens:**
- ✅ Muito rápido
- ✅ Simples e direto
- ❌ Não registra no histórico do sistema
- ❌ Não cria fatura automaticamente

---

### **OPÇÃO 3: Aprovar em Massa (Cuidado!)**

Se você tem **VÁRIOS usuários** bloqueados:

```sql
-- Ver todos os usuários bloqueados
SELECT 
  p.email,
  p.full_name,
  p.approval_status,
  s.name as store_name,
  pl.name as plan_name
FROM profiles p
LEFT JOIN stores s ON s.owner_id = p.id
LEFT JOIN plans pl ON s.plan_id = pl.id
WHERE 
  p.user_type = 'store_admin'
  AND p.approval_status = 'pending'
ORDER BY p.created_at DESC;

-- Aprovar TODOS que têm plano ativo
UPDATE profiles
SET 
  approval_status = 'approved',
  updated_at = NOW()
WHERE 
  user_type = 'store_admin'
  AND approval_status = 'pending'
  AND id IN (
    SELECT owner_id 
    FROM stores 
    WHERE plan_id IS NOT NULL 
    AND status = 'active'
  );
```

**⚠️ CUIDADO:** Isso aprova TODOS os usuários pendentes que têm plano!

---

## 🔄 **Fluxo Normal do Sistema**

### Como DEVERIA funcionar:

```
1. Usuário cria conta (/signup)
   └─ approval_status = 'pending' ⏳

2. Usuário envia comprovante (/payment-proof)
   └─ Cria registro em payment_approvals

3. Super admin acessa /dashboard/subscription-payments
   └─ Vê o usuário em "Novos Assinantes Pendentes"

4. Super admin clica em "Aprovar"
   └─ Função approve_payment() executa:
      ├─ approval_status = 'approved' ✅
      ├─ Define subscription_expires_at
      ├─ store.status = 'active'
      └─ Cria fatura

5. Usuário é liberado ✅
```

### O que aconteceu com ingabeachsports@gmail.com:

```
1. Usuário criou conta
   └─ approval_status = 'pending' ⏳

2. ???
   └─ Provavelmente pulou o passo do comprovante
   └─ OU super admin não aprovou

3. Alguém configurou manualmente:
   ├─ plan_id = Premium
   ├─ subscription_expires_at = 31/12/2026
   └─ store.status = 'active'

4. MAS esqueceu de:
   └─ approval_status ainda 'pending' ❌

5. Resultado:
   └─ Assinatura OK ✅ mas perfil bloqueado ❌
```

---

## 🚀 **CORREÇÃO PASSO A PASSO**

### Se você é o super admin:

#### **Método 1: Interface (Mais Profissional)**

```
1. CTRL + SHIFT + R (limpar cache)
2. Login como master_admin
3. /dashboard/subscription-payments
4. Procurar "ingabeachsports@gmail.com"
5. Se aparecer em "Pendentes": Clicar em "Aprovar"
6. Se NÃO aparecer: Usar Método 2 (SQL)
```

#### **Método 2: SQL (Mais Rápido)**

```
1. Supabase Dashboard
2. SQL Editor
3. Colar:
   UPDATE profiles
   SET approval_status = 'approved', updated_at = NOW()
   WHERE email = 'ingabeachsports@gmail.com';
4. Run
5. CTRL + SHIFT + R no sistema
6. Logout e login novamente
7. ✅ Liberado!
```

---

## 🔍 **Verificação**

### SQL para diagnóstico completo:

```sql
-- Ver TUDO sobre o usuário
SELECT 
  p.email,
  p.approval_status, -- Deve ser 'approved'
  s.status as store_status, -- Deve ser 'active'
  s.subscription_expires_at, -- Deve ter data futura
  pl.name as plan_name, -- Deve ter plano
  CASE 
    WHEN p.approval_status = 'approved' AND s.status = 'active' AND s.subscription_expires_at > NOW()
      THEN '✅ TUDO OK - LIBERADO'
    WHEN p.approval_status != 'approved'
      THEN '❌ BLOQUEADO - approval_status não aprovado'
    WHEN s.status != 'active'
      THEN '❌ BLOQUEADO - store inativa'
    WHEN s.subscription_expires_at < NOW()
      THEN '❌ BLOQUEADO - assinatura expirada'
    ELSE '⚠️ VERIFICAR MANUALMENTE'
  END as situacao_final
FROM profiles p
LEFT JOIN stores s ON s.owner_id = p.id
LEFT JOIN plans pl ON s.plan_id = pl.id
WHERE p.email = 'ingabeachsports@gmail.com';
```

---

## 📊 **Resultado Esperado**

### Antes da correção:
```
Email: ingabeachsports@gmail.com
approval_status: pending ❌
store_status: active ✅
subscription_expires_at: 31/12/2026 ✅
plan_name: Premium ✅

SITUAÇÃO: ❌ BLOQUEADO - approval_status não aprovado
```

### Depois da correção:
```
Email: ingabeachsports@gmail.com
approval_status: approved ✅
store_status: active ✅
subscription_expires_at: 31/12/2026 ✅
plan_name: Premium ✅

SITUAÇÃO: ✅ TUDO OK - LIBERADO
```

### No sistema:
```
ANTES:
- Menu: Apenas "Minha Assinatura" ❌
- Acesso: Redireciona para /dashboard/subscription ❌
- Status: "Ação imediata requerida" ❌

DEPOIS:
- Menu: Completo (Dashboard, Produtos, etc) ✅
- Acesso: Todas as páginas liberadas ✅
- Status: "Tudo em dia" ✅
```

---

## 🛡️ **Para Outros Usuários**

### Verificar se há mais usuários afetados:

```sql
-- Listar TODOS os usuários bloqueados
SELECT 
  p.email,
  p.full_name,
  p.approval_status,
  s.name as store_name,
  s.status as store_status,
  s.subscription_expires_at,
  pl.name as plan_name,
  CASE 
    WHEN p.approval_status != 'approved' THEN '❌ BLOQUEADO POR APPROVAL'
    WHEN s.status != 'active' THEN '❌ BLOQUEADO POR STORE INATIVA'
    WHEN s.subscription_expires_at < NOW() THEN '❌ BLOQUEADO POR EXPIRAÇÃO'
    WHEN s.subscription_expires_at IS NULL AND s.plan_id IS NOT NULL THEN '⚠️ SEM DATA MAS COM PLANO'
    ELSE '✅ OK'
  END as motivo_bloqueio
FROM profiles p
LEFT JOIN stores s ON s.owner_id = p.id
LEFT JOIN plans pl ON s.plan_id = pl.id
WHERE 
  p.user_type = 'store_admin'
  AND (
    p.approval_status IN ('pending', 'rejected')
    OR s.status != 'active'
    OR (s.subscription_expires_at IS NOT NULL AND s.subscription_expires_at < NOW())
  )
ORDER BY p.created_at DESC;
```

---

## 📝 **Resumo do Problema**

### Checklist de verificação:

Para um usuário ter **ACESSO COMPLETO**, ele precisa de:

- [x] `profiles.approval_status` = **'approved'** ← ESTE estava errado!
- [x] `stores.status` = **'active'**
- [x] `stores.plan_id` = **Plano válido**
- [x] `stores.subscription_expires_at` = **Data futura OU NULL com plano**

Se **QUALQUER UM** desses estiver errado, o usuário fica bloqueado!

---

## 🔧 **Arquivos Criados**

1. **FIX_APPROVAL_STATUS.sql**  
   Script SQL completo para diagnóstico e correção

2. **CORRECAO_APPROVAL_STATUS.md**  
   Esta documentação

---

## 🎯 **PRÓXIMO PASSO**

```
ESCOLHA UMA OPÇÃO:

OPÇÃO 1 (Recomendada):
1. Login como master_admin
2. /dashboard/subscription-payments
3. Aprovar o usuário
4. ✅ Feito!

OPÇÃO 2 (Mais rápida):
1. Supabase → SQL Editor
2. UPDATE profiles SET approval_status = 'approved' 
   WHERE email = 'ingabeachsports@gmail.com';
3. CTRL + SHIFT + R no sistema
4. ✅ Feito!
```

---

**Última atualização:** 24/11/2025  
**Versão:** 1.0  
**Status:** ✅ Solução completa documentada

