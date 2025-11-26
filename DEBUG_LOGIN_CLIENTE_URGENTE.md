# 🚨 DEBUG URGENTE - Login de Clientes Falhando

## ⚠️ Situação Atual
- Cliente 22222222222: NÃO consegue fazer login
- Cliente 33333333333: NÃO consegue fazer login (testado em aba privada)
- **Problema SISTÊMICO** - não é rate limiting

---

## 🔍 Informações Necessárias (URGENTE)

### 1️⃣ **Qual é a MENSAGEM DE ERRO EXATA?**
- [ ] "Cliente não encontrado. Crie uma conta primeiro."
- [ ] "Senha incorreta. Verifique sua senha."
- [ ] "Erro ao fazer login. Verifique suas credenciais."
- [ ] "Conta sem autenticação. Entre em contato com o suporte."
- [ ] Outro: _______________________

### 2️⃣ **O que aparece no CONSOLE DO NAVEGADOR?**
- Abra as ferramentas de desenvolvedor (F12)
- Vá na aba "Console"
- Tente fazer login
- **COPIE E COLE TODOS OS ERROS** que aparecerem em vermelho

### 3️⃣ **Como esses clientes foram criados?**
- [ ] Pelo sistema de cadastro com senha (CustomerAuthDialog)
- [ ] Pelo checkout sem autenticação (método antigo)
- [ ] Manualmente pelo admin
- [ ] Não sei

---

## 🔬 Diagnóstico SQL (Execute AGORA)

```sql
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Verificar se os clientes EXISTEM
SELECT 
  'VERIFICANDO CLIENTES' AS status,
  id,
  name,
  phone,
  auth_user_id,
  CASE 
    WHEN auth_user_id IS NULL THEN '⚠️ SEM AUTH - NÃO PODE LOGAR!'
    ELSE '✅ TEM AUTH'
  END AS auth_status,
  created_at
FROM customers
WHERE phone IN ('22222222222', '33333333333')
ORDER BY phone;

-- 2. Se encontrou clientes SEM auth_user_id, esse é o problema!
-- Eles foram criados pelo fluxo antigo (sem autenticação)

-- 3. Verificar quantos clientes estão sem auth_user_id
SELECT 
  'TOTAL SEM AUTH' AS status,
  COUNT(*) AS total_sem_auth
FROM customers
WHERE auth_user_id IS NULL;

-- 4. Verificar se a tabela customers tem a coluna auth_user_id
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'customers' 
  AND table_schema = 'public'
  AND column_name = 'auth_user_id';
```

---

## 🎯 Possíveis Causas (Ordenadas por Probabilidade)

### 🥇 **CAUSA #1: Clientes SEM auth_user_id**
**Probabilidade:** ⭐⭐⭐⭐⭐ (95%)

**Explicação:**
- Os clientes foram criados pelo fluxo antigo (checkout/cadastro sem senha)
- Não têm usuário de autenticação vinculado
- Sistema de login exige auth_user_id

**Solução:**
- Clientes precisam se **RE-CADASTRAR** com senha
- OU migrar os clientes antigos (criar auth_user_id para eles)

**Verificação:**
Execute o SQL acima e veja se `auth_user_id` está `NULL`

---

### 🥈 **CAUSA #2: Edge Function Não Deployada**
**Probabilidade:** ⭐⭐⭐ (30%)

**Explicação:**
- A Edge Function `customer-auth` pode não estar deployada
- Ou não está funcionando corretamente

**Solução:**
```bash
# Verificar se está deployada
supabase functions list

# Deploy da function
supabase functions deploy customer-auth
```

**Verificação:**
- No console do navegador, procure por erro 404 ou 500 na chamada da function

---

### 🥉 **CAUSA #3: RLS Bloqueando Consulta**
**Probabilidade:** ⭐⭐ (20%)

**Explicação:**
- Políticas RLS na tabela `customers` podem estar bloqueando
- Edge Function não consegue buscar o cliente

**Solução:**
Verificar as policies:
```sql
-- Ver policies da tabela customers
SELECT * FROM pg_policies WHERE tablename = 'customers';
```

---

### **CAUSA #4: Problema de Normalização de Telefone**
**Probabilidade:** ⭐ (10%)

**Explicação:**
- Telefone pode estar salvo com formato diferente
- Ex: salvo como "22222222222" mas buscando "0022222222222"

**Verificação:**
```sql
-- Ver formatos exatos dos telefones
SELECT phone, LENGTH(phone) AS tamanho
FROM customers
WHERE phone LIKE '%2222%' OR phone LIKE '%3333%';
```

---

## 🚀 Ações Imediatas

### PASSO 1: Execute o SQL de diagnóstico
Copie o resultado COMPLETO

### PASSO 2: Abra o Console do Navegador (F12)
Tente fazer login e copie TODOS os erros

### PASSO 3: Me envie:
1. Resultado do SQL
2. Erros do console
3. Mensagem de erro exata que aparece para o usuário

### PASSO 4: Informações adicionais
- Os clientes conseguem se **CADASTRAR** com sucesso?
- Ou só o **LOGIN** que está falhando?

---

## 📋 Checklist de Informações

```
[ ] Mensagem de erro exata
[ ] Erros do console do navegador
[ ] Resultado do SQL de diagnóstico
[ ] Como os clientes foram criados
[ ] Se cadastro funciona ou não
[ ] Se é só login que falha
```

---

## ⚡ Solução Temporária

Enquanto investigamos, os clientes podem fazer pedidos pelo **checkout normal** (sem autenticação).

O sistema permite checkout sem login, então os pedidos não serão afetados.

---

## 📞 Próximos Passos

Assim que tiver as informações acima, vou:
1. Identificar a causa raiz
2. Criar a correção apropriada
3. Testar a solução
4. Documentar para prevenção futura

---

**URGÊNCIA:** 🔴 ALTA  
**IMPACTO:** Todos os clientes não conseguem fazer login  
**WORKAROUND:** Checkout sem autenticação ainda funciona

