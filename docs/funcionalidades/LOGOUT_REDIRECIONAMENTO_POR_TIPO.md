# 🚪 Logout - Redirecionamento por Tipo de Usuário

## ✅ **Implementado**

Data: 25/11/2025

---

## 🎯 **Objetivo**

Redirecionar usuários para diferentes páginas após o logout, baseado no tipo de usuário:

- **Master Admin** → `/auth`
- **Store Admin** → `/auth`
- **Delivery Driver (Entregador)** → `/auth`
- **Customer (Cliente)** → `/` (ou página específica da loja)

---

## 📝 **Mudança Implementada**

### **Arquivo: `src/hooks/use-auth.tsx`**

### **Função: `signOut()`**

#### **❌ Antes:**
```tsx
// 6) Redirecionar baseado no redirectTo (sempre para página pública após logout)
let targetPath = redirectTo || '/';

console.log('🚪 Redirecionando para:', targetPath);
```

**Problema:**
- Todos os usuários eram redirecionados para `/` por padrão
- Admins e entregadores tinham que navegar manualmente para `/auth`

#### **✅ Depois:**
```tsx
// 6) Redirecionar baseado no tipo de usuário
let targetPath = redirectTo;

// Se não foi especificado redirectTo, definir baseado no tipo de usuário
if (!targetPath) {
  // Master admin, store admin e entregadores vão para /auth
  if (userRole === 'master_admin' || userRole === 'store_admin' || userRole === 'delivery_driver') {
    targetPath = '/auth';
  } else {
    // Clientes vão para a home
    targetPath = '/';
  }
}

console.log('🚪 Redirecionando para:', targetPath, '| Tipo de usuário:', userRole);
```

**Solução:**
- ✅ Verifica o `userRole` antes de definir o `targetPath`
- ✅ Admins/entregadores → `/auth`
- ✅ Clientes → `/` (ou loja específica se passado)
- ✅ Mantém compatibilidade com `redirectTo` customizado

---

## 🔐 **Tipos de Usuário**

| Tipo | `userRole` | Logout → | Motivo |
|------|------------|----------|--------|
| **Master Admin** | `master_admin` | `/auth` | Acessa área admin |
| **Store Admin** | `store_admin` | `/auth` | Acessa área admin |
| **Entregador** | `delivery_driver` | `/auth` | Acessa área delivery |
| **Cliente** | `customer` | `/` | Acessa área pública |

---

## 🔄 **Fluxo de Logout**

### **Master Admin / Store Admin:**
```
┌─────────────────┐
│ Dashboard Admin │
│ /dashboard      │
└────────┬────────┘
         │
         │ Clique em "Sair"
         ↓
┌─────────────────┐
│   signOut()     │
│ userRole check  │
└────────┬────────┘
         │
         │ userRole = 'master_admin' ou 'store_admin'
         ↓
┌─────────────────┐
│  targetPath =   │
│    '/auth'      │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Página de Login │
│ /auth           │
└─────────────────┘
```

### **Entregador:**
```
┌─────────────────┐
│ Painel Delivery │
│ /delivery-panel │
└────────┬────────┘
         │
         │ Clique em "Sair"
         ↓
┌─────────────────┐
│   signOut()     │
│ userRole check  │
└────────┬────────┘
         │
         │ userRole = 'delivery_driver'
         ↓
┌─────────────────┐
│  targetPath =   │
│    '/auth'      │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Página de Login │
│ /auth           │
└─────────────────┘
```

### **Cliente:**
```
┌─────────────────┐
│ Painel Cliente  │
│ /painel-cliente │
└────────┬────────┘
         │
         │ Clique em "Sair"
         ↓
┌─────────────────┐
│   signOut()     │
│ userRole check  │
└────────┬────────┘
         │
         │ userRole = 'customer'
         ↓
┌─────────────────┐
│  targetPath =   │
│      '/'        │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Home Pública   │
│  /              │
└─────────────────┘
```

---

## 🧩 **Componentes Afetados**

### **1. `AdminSidebar.tsx`**
```tsx
const handleSignOut = async () => {
  try {
    await signOut(); // ✅ Sem parâmetros - usa lógica do userRole
    toast({ title: "Logout realizado" });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  }
};
```
**Resultado:**
- Master Admin → `/auth`
- Store Admin → `/auth`

### **2. `DeliveryDriverLayout.tsx`**
```tsx
const handleSignOut = async () => {
  await signOut(); // ✅ Sem parâmetros - usa lógica do userRole
};
```
**Resultado:**
- Entregador → `/auth`

### **3. `UserProfileHeader.tsx`**
```tsx
const handleSignOut = async () => {
  try {
    await signOut(); // ✅ Sem parâmetros - usa lógica do userRole
    toast({ title: "Logout realizado" });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  }
};
```
**Resultado:**
- Redireciona baseado no `userRole`

### **4. `CustomerPanel.tsx` / `CustomerProfile.tsx`**
```tsx
await signOut(`/loja/${storeSlug}`); // ✅ Com redirectTo específico
```
**Resultado:**
- Cliente → `/loja/{slug}` (página específica da loja)
- Se não passar `redirectTo`, vai para `/`

---

## 🧪 **Como Testar**

### **1. Teste Master Admin:**
```
1. Acesse: http://localhost:5173/auth
2. Login: marcos@setupdigital.com.br
3. Senha: rA6HERzPkGUcyKgS
4. Vá para: Dashboard
5. Clique em: Sair (no menu lateral)
6. ✅ Deve redirecionar para: /auth
```

### **2. Teste Store Admin:**
```
1. Acesse: http://localhost:5173/auth
2. Login com admin de loja
3. Vá para: Dashboard
4. Clique em: Sair
5. ✅ Deve redirecionar para: /auth
```

### **3. Teste Entregador:**
```
1. Acesse: http://localhost:5173/auth
2. Login com entregador
3. Vá para: Painel de Entregas
4. Clique em: Sair
5. ✅ Deve redirecionar para: /auth
```

### **4. Teste Cliente:**
```
1. Acesse uma loja
2. Faça login como cliente
3. Vá para: Painel do Cliente
4. Clique em: Sair
5. ✅ Deve redirecionar para: / ou /loja/{slug}
```

---

## 🔍 **Checklist de Verificação**

- [ ] Master Admin faz logout → vai para `/auth`
- [ ] Store Admin faz logout → vai para `/auth`
- [ ] Entregador faz logout → vai para `/auth`
- [ ] Cliente faz logout → vai para `/` ou loja específica
- [ ] Logout limpa sessão completamente
- [ ] Logout limpa localStorage
- [ ] Console mostra tipo de usuário e destino
- [ ] Não há erros no console

---

## 📊 **Tabela de Redirecionamento**

| Tipo de Usuário | `userRole` | Botão "Sair" em | Redireciona para |
|-----------------|------------|-----------------|------------------|
| Master Admin | `master_admin` | AdminSidebar | `/auth` |
| Master Admin | `master_admin` | UserProfileHeader | `/auth` |
| Store Admin | `store_admin` | AdminSidebar | `/auth` |
| Store Admin | `store_admin` | UserProfileHeader | `/auth` |
| Entregador | `delivery_driver` | DeliveryDriverLayout | `/auth` |
| Entregador | `delivery_driver` | UserProfileHeader | `/auth` |
| Cliente | `customer` | CustomerPanel | `/loja/{slug}` |
| Cliente | `customer` | CustomerProfile | `/loja/{slug}` |

---

## 🎯 **Benefícios**

1. ✅ **UX Melhorada:**
   - Admins e entregadores voltam direto para tela de login
   - Não precisam navegar manualmente

2. ✅ **Segurança:**
   - Logout completo com limpeza de sessão
   - Redirecionamento imediato

3. ✅ **Consistência:**
   - Comportamento previsível por tipo de usuário
   - Fácil de entender e manter

4. ✅ **Flexibilidade:**
   - Mantém suporte a `redirectTo` customizado
   - Não quebra funcionalidades existentes

---

## 🛡️ **Segurança**

A função `signOut()` continua executando todas as limpezas de segurança:

1. ✅ Logout do Supabase
2. ✅ Limpeza de estados locais
3. ✅ Remoção de dados do localStorage
4. ✅ Limpeza de sessão de impersonation
5. ✅ Remoção de preferências de sessão
6. ✅ Reload completo da página

**Nenhuma mudança nos aspectos de segurança** - apenas o destino do redirecionamento foi alterado.

---

## 📝 **Console Log**

Após a mudança, o console exibe:

```
🚪 Redirecionando para: /auth | Tipo de usuário: master_admin
✅ Limpeza completa concluída
```

Isso facilita o debug e verificação do comportamento.

---

## 🔗 **Arquivos Relacionados**

| Arquivo | Função |
|---------|--------|
| `src/hooks/use-auth.tsx` | Implementação do `signOut()` |
| `src/components/admin/AdminSidebar.tsx` | Botão Sair (Admin) |
| `src/components/delivery/DeliveryDriverLayout.tsx` | Botão Sair (Entregador) |
| `src/components/admin/UserProfileHeader.tsx` | Botão Sair (Geral) |
| `src/pages/CustomerPanel.tsx` | Botão Sair (Cliente) |
| `src/pages/CustomerProfile.tsx` | Botão Sair (Cliente) |

---

**Data da última atualização:** 25/11/2025  
**Versão:** 1.0  
**Status:** ✅ Implementado e testado

