# 🚀 Guia: Como Executar o SQL no Supabase Dashboard

## ⚠️ Por que não consegui executar automaticamente?

O cliente Supabase usa a chave `anon` (pública) que tem limitações de **Row Level Security (RLS)**. Para fazer UPDATE em `profiles`, é necessário acesso direto ao banco via **Dashboard** ou chave `service_role`.

**Mas não se preocupe!** É muito simples executar pelo dashboard. Siga este guia passo a passo com prints:

---

## 📋 **PASSO A PASSO (2 minutos)**

### **PASSO 1: Abrir Supabase Dashboard**

```
1. Abrir navegador
2. Ir para: https://supabase.com/dashboard
3. Fazer login (se não estiver logado)
4. Selecionar seu projeto: "noshwvwpjtnvndokbfjx"
```

---

### **PASSO 2: Abrir SQL Editor**

```
1. No menu lateral esquerdo, procurar "SQL Editor"
2. Clicar em "SQL Editor"
3. Deve abrir uma tela com um editor de código
```

**Visual:**
```
┌─────────────────────────┐
│ Supabase                │
├─────────────────────────┤
│ 🏠 Home                 │
│ 📊 Table Editor         │
│ 🔍 SQL Editor       ← CLICAR AQUI
│ 📡 Database             │
│ 🔒 Authentication       │
│ 📁 Storage              │
└─────────────────────────┘
```

---

### **PASSO 3: Criar Nova Query**

```
1. Clicar no botão "+ New query" (canto superior direito)
2. Deve abrir um editor em branco
```

---

### **PASSO 4: Colar o SQL**

```sql
-- COPIAR E COLAR ESTE SQL NO EDITOR:

UPDATE profiles
SET 
  approval_status = 'approved',
  updated_at = NOW()
WHERE email = 'ingabeachsports@gmail.com';
```

**Importante:** Copie o SQL COMPLETO acima (incluindo o WHERE)!

---

### **PASSO 5: Executar**

```
1. Revisar o SQL no editor
2. Clicar no botão "Run" (ou apertar Ctrl+Enter)
3. Aguardar alguns segundos
4. Deve aparecer: "Success. 1 rows affected" ✅
```

**Visual do botão Run:**
```
┌──────────────────────────────────────┐
│  [▶ Run]  [Save]  [Share]           │
└──────────────────────────────────────┘
```

---

### **PASSO 6: Verificar Resultado**

Após executar, deve aparecer na parte inferior:

```
✅ Success. 1 rows affected

Rows: 1
Time: 0.123s
```

Se aparecer **"0 rows affected"**, significa que o email está diferente no banco. Nesse caso, veja a seção "Troubleshooting" abaixo.

---

## ✅ **PASSO 7: Testar no Sistema**

```
1. Voltar para o sistema Mostralo
2. CTRL + SHIFT + R (recarregar e limpar cache)
3. Se estiver logado como ingabeachsports, fazer LOGOUT
4. Fazer LOGIN novamente
5. ✅ Menu completo deve aparecer!
6. ✅ Todas as funcionalidades desbloqueadas!
```

---

## 🔍 **Troubleshooting**

### **Se aparecer "0 rows affected":**

O email pode estar diferente. Execute este SQL para ver todos os store_admin:

```sql
-- Ver todos os usuários do tipo store_admin
SELECT 
  email,
  full_name,
  user_type,
  approval_status,
  created_at
FROM profiles
WHERE user_type = 'store_admin'
ORDER BY created_at DESC
LIMIT 20;
```

Procure pelo usuário e veja qual é o email exato no banco. Depois execute o UPDATE com o email correto.

---

### **Se der erro de permissão:**

```
Error: new row violates row-level security policy
```

**Solução:** Você precisa estar logado como super admin no Supabase Dashboard. O RLS não afeta queries executadas diretamente no SQL Editor quando você está autenticado no dashboard.

---

### **Se não aparecer o botão "Run":**

Certifique-se de que:
1. Está no **SQL Editor** (não em Table Editor)
2. Criou uma **nova query** (+New query)
3. O SQL está no editor (não em branco)

---

## 📊 **SQL Alternativo (Verificar Antes)**

Se quiser verificar o estado ANTES de fazer o UPDATE:

```sql
-- 1. PRIMEIRO: Ver o estado atual
SELECT 
  email,
  full_name,
  user_type,
  approval_status,
  created_at
FROM profiles
WHERE email = 'ingabeachsports@gmail.com';

-- 2. DEPOIS: Se confirmar que é o usuário certo e approval_status está 'pending':
UPDATE profiles
SET 
  approval_status = 'approved',
  updated_at = NOW()
WHERE email = 'ingabeachsports@gmail.com';

-- 3. FINALMENTE: Verificar que foi corrigido
SELECT 
  email,
  approval_status,
  '✅ CORRIGIDO!' as resultado
FROM profiles
WHERE email = 'ingabeachsports@gmail.com';
```

Execute os 3 SQLs um de cada vez (copiar, colar, Run, ver resultado, repetir).

---

## 🎯 **Resumo Super Rápido**

```
1. supabase.com/dashboard
2. SQL Editor (menu lateral)
3. + New query
4. Colar: UPDATE profiles SET approval_status = 'approved' 
           WHERE email = 'ingabeachsports@gmail.com';
5. Run (ou Ctrl+Enter)
6. Ver: "Success. 1 rows affected" ✅
7. Voltar ao sistema e recarregar (Ctrl+Shift+R)
8. Logout e login novamente
9. ✅ Pronto!
```

---

## 📱 **Vídeo Tutorial (Se Precisar)**

Se ainda tiver dúvida, posso criar um GIF animado mostrando o passo a passo. Mas é realmente muito simples:

1. Dashboard → SQL Editor → New Query
2. Colar o SQL
3. Run
4. Done! ✅

---

## ⏱️ **Tempo Estimado**

- **Se você já tem acesso ao Supabase:** 30 segundos ⚡
- **Se precisa fazer login primeiro:** 1-2 minutos 🚀
- **Total:** Menos de 2 minutos! ✅

---

## ✅ **Resultado Final Esperado**

### No Supabase (após executar):
```
✅ Success. 1 rows affected
```

### No Sistema (após recarregar):
```
✅ Menu completo liberado
✅ Dashboard disponível
✅ Produtos, Categorias, Pedidos, etc
✅ Todas as funcionalidades ativas
✅ Status: "Tudo em dia"
```

---

## 📞 **Precisa de Ajuda?**

Se tiver qualquer problema:

1. **Tire print da tela** do Supabase Dashboard
2. **Copie a mensagem de erro** completa
3. **Me envie** que eu te ajudo a resolver!

Mas garanto que é super simples. Você vai conseguir! 💪

---

**Última atualização:** 24/11/2025  
**Tempo de execução:** < 2 minutos  
**Dificuldade:** ⭐ Muito Fácil

