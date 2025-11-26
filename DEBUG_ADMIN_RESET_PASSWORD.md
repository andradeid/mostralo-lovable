# 🔍 Debug: Erro ao Resetar Senha (admin-reset-password)

## Problema
Erro 401 (Unauthorized) ao tentar resetar senha via função `admin-reset-password`.

## Como Verificar os Logs

### 1. Acesse o Dashboard do Supabase
- URL: https://supabase.com/dashboard/project/noshwvwpjtnvndokbfjx/functions
- Encontre a função: `admin-reset-password`
- Clique em "Logs" ou "View Logs"

### 2. Procure por Logs Recentes
Os logs devem mostrar:
- `🔐 Auth header presente: true/false`
- `🔐 User auth check: { hasUser: ..., userId: ..., error: ... }`
- `🔍 Profile check: { hasProfile: ..., userType: ..., error: ... }`
- `🔍 Role check: { role: ... }`
- `✅ Master admin verified` (se passar)

### 3. Possíveis Causas

#### Se aparecer "Missing authorization header":
- O token não está sendo enviado
- Verifique se você está logado

#### Se aparecer "Auth error":
- Token inválido ou expirado
- Faça logout e login novamente

#### Se aparecer "Not master admin":
- O usuário não tem role `master_admin`
- Verifique no banco de dados

## Verificação no Banco de Dados

Execute no SQL Editor do Supabase:

```sql
-- Verificar se o usuário é master_admin
SELECT 
  p.id,
  p.email,
  p.user_type,
  ur.role
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE p.email = 'seu-email@aqui.com';
```

## Solução Rápida

1. **Faça logout e login novamente**
2. **Verifique se você é master_admin**:
   - Vá em Dashboard → Usuários
   - Procure seu usuário
   - Verifique se tem role `master_admin`

3. **Tente resetar a senha novamente**

## Logs no Console do Navegador

Quando tentar resetar, verifique no console (F12):
- `🔐 Resetando senha via admin-reset-password`
- `🔐 Resposta da função`
- `❌ Erro HTTP completo` (com status code)

O status code mostrará o problema:
- **401** = Não autorizado (token inválido ou não enviado)
- **403** = Acesso negado (não é master_admin)
- **400** = Dados inválidos
- **500** = Erro interno

---

**Última atualização**: Função atualizada com logs detalhados para debug.

