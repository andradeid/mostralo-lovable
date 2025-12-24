# Como Criar Usuários Reais para Demonstração

## 🔑 Passo a Passo

### 1. Acesse a página de registro
Vá para: `/auth` no seu projeto

### 2. Crie as seguintes contas:

#### Super Admin
- **Email**: admin@mostralo.com  
- **Senha**: admin123456
- **Tipo**: Será automaticamente definido como `master_admin` pelo trigger

#### Dono da Pizzaria
- **Email**: joao@pizzaria.com
- **Senha**: pizzaria123
- **Tipo**: Será definido como `store_admin`

#### Cliente/Usuário
- **Email**: maria@cliente.com
- **Senha**: cliente123
- **Tipo**: Será definido como `store_admin`

### 3. O que acontece automaticamente:

1. **Signup** cria o usuário em `auth.users`
2. **Trigger** `handle_new_user()` cria/atualiza o perfil em `public.profiles`
3. **Perfis existentes** são atualizados com os novos IDs dos usuários reais

## ⚡ Script Alternativo (Se preferir)

Posso criar um script que gere os usuários automaticamente via código, se preferir não fazer manualmente.

## 🎯 Resultado Esperado

Após criar os usuários:
- ✅ Usuários reais em `auth.users`
- ✅ Perfis conectados em `public.profiles`  
- ✅ Login funcionando
- ✅ Permissões RLS ativas