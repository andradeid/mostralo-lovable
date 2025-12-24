# 🔍 Como Verificar Usuário no Supabase

## Problema: "Invalid login credentials"

Quando você recebe este erro, pode ser por várias razões. Siga estes passos para diagnosticar:

### 1. Verificar no Dashboard do Supabase

1. Acesse: https://supabase.com/dashboard/project/noshwvwpjtnvndokbfjx/auth/users
2. Procure pelo email: `ingabeachsports@gmail.com`
3. Verifique:
   - ✅ O usuário existe?
   - ✅ O email está correto (sem espaços, maiúsculas/minúsculas)?
   - ✅ A conta está ativa (não bloqueada)?
   - ✅ O email está confirmado?

### 2. Verificar Senha

- A senha pode ter sido alterada
- Pode haver caracteres especiais que estão sendo digitados incorretamente
- Use "Esqueceu a senha?" para redefinir

### 3. Verificar no Banco de Dados

Execute esta query no SQL Editor do Supabase:

```sql
-- Verificar se o usuário existe na tabela auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  banned_until
FROM auth.users
WHERE email = 'ingabeachsports@gmail.com';

-- Verificar se existe na tabela profiles
SELECT 
  id,
  email,
  full_name,
  is_blocked,
  is_deleted,
  blocked_at,
  deleted_at
FROM profiles
WHERE email = 'ingabeachsports@gmail.com';

-- Verificar roles
SELECT 
  ur.role,
  ur.store_id,
  p.email,
  p.full_name
FROM user_roles ur
JOIN profiles p ON p.id = ur.user_id
WHERE p.email = 'ingabeachsports@gmail.com';
```

### 4. Possíveis Soluções

#### Se o usuário não existe:
- Crie uma nova conta
- Ou use outro email que você sabe que existe

#### Se o usuário existe mas a senha não funciona:
- Use "Esqueceu a senha?" na tela de login
- Ou reset a senha via Admin (se você tiver acesso)

#### Se a conta está bloqueada:
- Desbloqueie via Dashboard do Supabase
- Ou via interface admin (se você tiver acesso)

#### Se o email não está confirmado:
- Verifique a caixa de entrada
- Reenvie o email de confirmação

### 5. Testar Login Direto no Supabase

Você pode testar o login diretamente usando a API do Supabase:

```javascript
// No console do navegador (F12)
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'ingabeachsports@gmail.com',
  password: 'sua-senha-aqui'
});

console.log('Data:', data);
console.log('Error:', error);
```

---

## ⚠️ Avisos Importantes

- **Segurança**: Nunca compartilhe senhas
- **Case Sensitivity**: O Supabase geralmente trata emails como case-insensitive, mas é melhor usar lowercase
- **Espaços**: Certifique-se de que não há espaços antes ou depois do email
- **Caracteres Especiais**: Verifique se não há caracteres invisíveis no email

---

## 📝 Logs para Debug

Quando tentar fazer login, verifique no console do navegador (F12):

```
🔐 Tentando login: { emailOriginal: "...", emailNormalized: "...", ... }
❌ Erro no login: { message: "...", status: 400, ... }
```

Isso ajudará a identificar se o problema é com a normalização do email ou com as credenciais.

