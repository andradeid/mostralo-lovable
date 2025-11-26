# 🔐 Soluções para Problemas de Login de Cliente

## 🎯 Problema Reportado
Cliente com telefone **22222222222** não consegue fazer login após 2 tentativas com senha errada.

---

## 🔍 Possíveis Causas e Soluções

### 1️⃣ **Cliente NÃO EXISTE no Sistema**
**Sintoma:** Mensagem "Cliente não encontrado. Crie uma conta primeiro."

**Solução:**
- O cliente precisa se **CADASTRAR** primeiro
- No diálogo de login, clicar em **"Criar conta"**
- Preencher todos os dados e criar a conta

---

### 2️⃣ **SENHA INCORRETA**
**Sintoma:** Mensagem "Senha incorreta. Verifique sua senha."

**Solução:**
- Verificar se está digitando a senha correta
- Senhas são **case-sensitive** (maiúsculas ≠ minúsculas)
- Se esqueceu a senha, entre em contato com suporte

---

### 3️⃣ **RATE LIMITING (Bloqueio Temporário)**
**Sintoma:** 
- Erro genérico após múltiplas tentativas erradas
- "Erro ao fazer login. Verifique suas credenciais."
- Sistema pode estar bloqueando temporariamente

**Causa:**
O Supabase Auth tem proteção contra brute-force que **bloqueia temporariamente** após várias tentativas erradas:
- **5-10 tentativas erradas** = bloqueio de 15-30 minutos
- Isso é **NORMAL e SEGURO** (proteção contra hackers)

**Solução:**
1. **AGUARDAR 30 minutos** e tentar novamente
2. **OU** desbloquear manualmente via SQL:

```sql
-- Execute no Supabase Dashboard > SQL Editor
UPDATE auth.users 
SET banned_until = NULL 
WHERE email = 'cliente_22222222222@temp.mostralo.com';
```

---

### 4️⃣ **Cliente sem auth_user_id**
**Sintoma:** Mensagem "Conta sem autenticação. Entre em contato com o suporte."

**Causa:** Cliente foi criado antes da implementação de autenticação

**Solução:**
```sql
-- 1. Verificar o problema
SELECT id, name, phone, auth_user_id 
FROM customers 
WHERE phone = '22222222222';

-- 2. Se auth_user_id estiver NULL, o cliente precisa ser RECRIADO
-- (Não tente corrigir manualmente - sistema complexo)
```

---

## 📋 Diagnóstico Completo

Execute o script **DIAGNOSTICO_CLIENTE.sql** no Supabase Dashboard:

```bash
# Caminho do arquivo
.mostralo/DIAGNOSTICO_CLIENTE.sql
```

Ele vai mostrar:
- ✅ Se o cliente existe
- ✅ Status do auth_user_id
- ✅ Se está bloqueado (banned_until)
- ✅ Roles do usuário
- ✅ Histórico de tentativas

---

## 🚀 Procedimento Recomendado

### Para o USUÁRIO FINAL:
1. Aguardar **30 minutos**
2. Tentar login novamente
3. Se não funcionar, **CRIAR NOVA CONTA**

### Para o ADMINISTRADOR:
1. Executar **DIAGNOSTICO_CLIENTE.sql**
2. Verificar o resultado
3. Aplicar solução apropriada baseada no diagnóstico

---

## ⚠️ Importante

**NUNCA:**
- Desabilitar o rate limiting (segurança essencial)
- Modificar diretamente tabelas do auth.users sem entender

**SEMPRE:**
- Aguardar o tempo de bloqueio expirar (melhor opção)
- Verificar se a senha está correta
- Verificar se o cliente realmente existe

---

## 📞 Suporte Técnico

Se nenhuma solução funcionar:
1. Execute o **DIAGNOSTICO_CLIENTE.sql**
2. Copie os resultados
3. Entre em contato com o desenvolvedor
4. Forneça:
   - Telefone do cliente
   - Mensagem de erro exata
   - Resultados do diagnóstico

---

## 🎓 Entendendo o Rate Limiting

O Supabase Auth **protege automaticamente** contra:
- **Brute Force:** Tentativas repetidas de adivinhar senha
- **Credential Stuffing:** Uso de senhas vazadas
- **Bot Attacks:** Ataques automatizados

**Comportamento:**
```
Tentativa 1-3: ✅ Normal
Tentativa 4-5: ⚠️ Atenção
Tentativa 6+:  🚫 BLOQUEIO (15-30 min)
```

**Isso é BOM!** Significa que o sistema está protegido! 🛡️

---

## ✅ Resumo Rápido

| Situação | Solução |
|----------|---------|
| Cliente não existe | Criar conta |
| Senha errada | Verificar senha ou aguardar |
| Muitas tentativas | Aguardar 30 min OU desbloquear via SQL |
| Sem auth_user_id | Recriar cliente (suporte técnico) |

---

**Data:** 2025-01-24  
**Sistema:** Mostralo - Customer Auth  
**Módulo:** Edge Function `customer-auth`

