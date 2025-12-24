# 🔐 Proteção de Autenticação para Adicionar ao Carrinho

## 📋 **Resumo**

Sistema completo de proteção que **exige autenticação do cliente** antes de permitir adicionar produtos ao carrinho. Sem estar logado, o cliente não consegue adicionar nenhum produto.

---

## ✅ **O que foi implementado**

### 1. **Verificação de Autenticação**

Antes de adicionar qualquer produto ao carrinho, o sistema verifica se o cliente está autenticado através do localStorage:

```typescript
const isCustomerLoggedIn = () => {
  if (!store?.id) return false;
  
  const savedProfile = localStorage.getItem(`customer_${store.id}`);
  if (savedProfile) {
    try {
      const profile = JSON.parse(savedProfile);
      return !!profile.name || !!profile.email;
    } catch (error) {
      return false;
    }
  }
  return false;
};
```

---

### 2. **Bloqueio no handleAddToCart**

```typescript
const handleAddToCart = () => {
  if (!product) return;

  // ✅ PRIMEIRA VERIFICAÇÃO: Cliente logado?
  if (!isCustomerLoggedIn()) {
    toast({
      title: "⚠️ Login necessário",
      description: "Para adicionar produtos ao carrinho, você precisa estar logado. Faça login ou crie uma conta.",
      variant: "destructive"
    });
    setShowAuthDialog(true); // Abre dialog de login
    return; // Bloqueia a adição
  }

  // Restante do código...
  addItem({...});
};
```

---

### 3. **Proteção em 2 Locais**

#### **A) ProductPage.tsx**
Página individual do produto (`/loja/{slug}/produto/{productSlug}`)

- ✅ Imports dos dialogs de autenticação
- ✅ Estados para controlar dialogs
- ✅ Função `isCustomerLoggedIn()`
- ✅ Verificação no `handleAddToCart()`
- ✅ Callback `handleAuthSuccess()`
- ✅ Componentes `CustomerAuthDialog` e `CustomerRegisterDialog` no JSX

#### **B) ProductDetail.tsx**
Modal de detalhes na página da loja (usado na Store.tsx)

- ✅ Nova prop `onAuthRequired?: () => void`
- ✅ Função `isCustomerLoggedIn()`
- ✅ Verificação no `handleAddToCart()`
- ✅ Callback para abrir dialog na página pai
- ✅ Store.tsx passa `onAuthRequired={() => setShowAuthDialog(true)}`

---

## 🔄 **Fluxo Completo**

### Cenário 1: Cliente NÃO autenticado

```
1. Cliente acessa /loja/ingabeachsports
2. Clica em um produto
3. Escolhe quantidade, variantes, adicionais
4. Clica em "Adicionar ao Carrinho"
5. ❌ Sistema detecta: não está logado
6. 🔔 Toast: "Login necessário"
7. 🔓 Dialog de autenticação abre automaticamente
8. Cliente escolhe:
   ├─ "Já tenho conta" → CustomerAuthDialog
   │  ├─ Digita email e senha
   │  ├─ Clica em "Entrar"
   │  └─ ✅ Login bem-sucedido
   └─ "Criar conta" → CustomerRegisterDialog
      ├─ Preenche nome, email, telefone
      ├─ Clica em "Criar conta"
      └─ ✅ Conta criada e logado
9. 🔔 Toast: "Login realizado! Bem-vindo, {nome}!"
10. ✅ Agora pode adicionar ao carrinho
```

### Cenário 2: Cliente JÁ autenticado

```
1. Cliente acessa /loja/ingabeachsports
2. Sistema carrega localStorage: customer_{storeId}
3. Cliente clica em um produto
4. Escolhe quantidade, variantes, adicionais
5. Clica em "Adicionar ao Carrinho"
6. ✅ Sistema detecta: está logado
7. ✅ Produto adicionado ao carrinho
8. 🔔 Toast: "Produto adicionado!"
9. Navega de volta para a loja
```

---

## 📊 **Diagrama de Fluxo**

```
┌─────────────────────────────────────┐
│  Cliente acessa página do produto  │
└─────────────┬───────────────────────┘
              │
              v
┌─────────────────────────────────────┐
│  Clica em "Adicionar ao Carrinho"  │
└─────────────┬───────────────────────┘
              │
              v
      ┌───────────────┐
      │ Está logado?  │
      └───────┬───────┘
              │
      ┌───────┴───────┐
      │               │
     SIM             NÃO
      │               │
      v               v
┌──────────┐  ┌─────────────────┐
│ Adiciona │  │ Toast: "Login   │
│ produto  │  │  necessário"    │
│ ao       │  └────────┬────────┘
│ carrinho │           │
└────┬─────┘           v
     │         ┌───────────────┐
     │         │ Abre dialog   │
     │         │ de login      │
     │         └───────┬───────┘
     │                 │
     │         ┌───────┴────────┐
     │         │                │
     │    ┌────v────┐    ┌─────v─────┐
     │    │  Login  │    │  Criar    │
     │    │         │    │  Conta    │
     │    └────┬────┘    └─────┬─────┘
     │         │                │
     │         └────────┬───────┘
     │                  │
     │                  v
     │          ┌───────────────┐
     │          │ Salva no      │
     │          │ localStorage  │
     │          └───────┬───────┘
     │                  │
     │                  v
     │          ┌───────────────┐
     │          │ Toast:        │
     │          │ "Bem-vindo!"  │
     │          └───────┬───────┘
     │                  │
     └──────────────────┘
              │
              v
      ┌───────────────┐
      │  Cliente pode │
      │  adicionar    │
      │  produtos     │
      └───────────────┘
```

---

## 🔧 **Código Implementado**

### **1. ProductPage.tsx**

#### Imports adicionados:

```typescript
import { CustomerAuthDialog } from '@/components/checkout/CustomerAuthDialog';
import { CustomerRegisterDialog } from '@/components/checkout/CustomerRegisterDialog';
```

#### Estados adicionados:

```typescript
const [showAuthDialog, setShowAuthDialog] = useState(false);
const [customerRegisterOpen, setCustomerRegisterOpen] = useState(false);
const [customerName, setCustomerName] = useState<string | null>(null);
```

#### Função de verificação:

```typescript
const isCustomerLoggedIn = () => {
  if (!store?.id) return false;
  
  const savedProfile = localStorage.getItem(`customer_${store.id}`);
  if (savedProfile) {
    try {
      const profile = JSON.parse(savedProfile);
      return !!profile.name || !!profile.email;
    } catch (error) {
      return false;
    }
  }
  return false;
};
```

#### Callback de sucesso:

```typescript
const handleAuthSuccess = (profile: any) => {
  setCustomerName(profile.name || null);
  setShowAuthDialog(false);
  setCustomerRegisterOpen(false);
  
  toast({
    title: "Login realizado!",
    description: `Bem-vindo, ${profile.name}! Agora você pode adicionar produtos ao carrinho.`,
  });
};
```

#### Verificação no handleAddToCart:

```typescript
const handleAddToCart = () => {
  if (!product) return;

  // ✅ Verificar se o cliente está logado
  if (!isCustomerLoggedIn()) {
    toast({
      title: "⚠️ Login necessário",
      description: "Para adicionar produtos ao carrinho, você precisa estar logado. Faça login ou crie uma conta.",
      variant: "destructive"
    });
    setShowAuthDialog(true);
    return;
  }

  // ... resto do código
};
```

#### Componentes no JSX:

```tsx
{/* Customer Auth Dialog */}
{store && storeSlug && (
  <CustomerAuthDialog
    open={showAuthDialog}
    onOpenChange={setShowAuthDialog}
    storeId={store.id}
    storeSlug={storeSlug}
    onAuthSuccess={handleAuthSuccess}
  />
)}

{/* Customer Register Dialog */}
{store && (
  <CustomerRegisterDialog
    open={customerRegisterOpen}
    onOpenChange={(open) => {
      setCustomerRegisterOpen(open);
      if (!open && store?.id) {
        const savedProfile = localStorage.getItem(`customer_${store.id}`);
        if (savedProfile) {
          try {
            const profile = JSON.parse(savedProfile);
            setCustomerName(profile.name || null);
          } catch (error) {
            console.error('Erro ao carregar perfil:', error);
          }
        }
      }
    }}
    storeId={store.id}
  />
)}
```

---

### **2. ProductDetail.tsx**

#### Nova prop:

```typescript
interface ProductDetailProps {
  // ... props existentes
  onAuthRequired?: () => void; // Callback para quando login for necessário
}
```

#### Atualização do component:

```typescript
const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  store,
  relatedProducts = [],
  isOpen,
  onClose,
  onProductSelect,
  storeStatus,
  onAuthRequired // ✅ Nova prop
}) => {
```

#### Função de verificação:

```typescript
const isCustomerLoggedIn = () => {
  if (!store?.id) return false;
  
  const savedProfile = localStorage.getItem(`customer_${store.id}`);
  if (savedProfile) {
    try {
      const profile = JSON.parse(savedProfile);
      return !!profile.name || !!profile.email;
    } catch (error) {
      return false;
    }
  }
  return false;
};
```

#### Verificação no handleAddToCart:

```typescript
const handleAddToCart = () => {
  if (!product) return;

  // ✅ Verificar se o cliente está logado
  if (!isCustomerLoggedIn()) {
    toast({
      title: "⚠️ Login necessário",
      description: "Para adicionar produtos ao carrinho, você precisa estar logado. Faça login ou crie uma conta.",
      variant: "destructive"
    });
    onClose(); // Fecha o modal
    if (onAuthRequired) {
      onAuthRequired(); // Abre o dialog de autenticação na página pai
    }
    return;
  }

  // ... resto do código
};
```

---

### **3. Store.tsx**

#### Atualização do ProductDetail:

```tsx
<ProductDetail
  product={selectedProduct}
  store={store}
  relatedProducts={selectedProduct ? getRelatedProducts(selectedProduct) : []}
  isOpen={showProductDetail}
  onClose={() => {
    setShowProductDetail(false);
    setSelectedProduct(null);
  }}
  onProductSelect={handleProductClick}
  storeStatus={storeStatus}
  onAuthRequired={() => setShowAuthDialog(true)} // ✅ Novo callback
/>
```

---

## 🔍 **Verificação no localStorage**

O sistema verifica a chave `customer_{storeId}` no localStorage:

```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "(11) 98765-4321"
}
```

**Critérios de autenticação:**
- ✅ Chave existe no localStorage
- ✅ JSON válido
- ✅ Possui `name` OU `email` preenchido

---

## 🧪 **Como Testar**

### Teste 1: Cliente NÃO autenticado

```
1. Abrir navegador em modo anônimo (CTRL + SHIFT + N)
2. Acessar: http://localhost:5173/loja/ingabeachsports
3. Clicar em qualquer produto
4. Escolher opções (variantes, adicionais)
5. Clicar em "Adicionar ao Carrinho"
6. ✅ Deve aparecer toast: "Login necessário"
7. ✅ Dialog de autenticação deve abrir
8. ✅ Produto NÃO deve ser adicionado ao carrinho
```

### Teste 2: Login via dialog

```
1. Seguir passos do Teste 1
2. No dialog, clicar em "Já tenho conta"
3. Digitar email e senha (ou criar conta)
4. Clicar em "Entrar"
5. ✅ Deve aparecer toast: "Login realizado! Bem-vindo, {nome}!"
6. ✅ Dialog deve fechar
7. Clicar novamente em "Adicionar ao Carrinho"
8. ✅ Produto deve ser adicionado com sucesso
9. ✅ Toast: "Produto adicionado!"
```

### Teste 3: Cliente JÁ autenticado

```
1. Com cliente logado (teste anterior)
2. Navegar para outro produto
3. Clicar em "Adicionar ao Carrinho"
4. ✅ Produto deve ser adicionado IMEDIATAMENTE
5. ✅ Sem pedir login novamente
6. ✅ Toast: "Produto adicionado!"
```

### Teste 4: ProductDetail modal (Store.tsx)

```
1. Cliente NÃO autenticado
2. Acessar: http://localhost:5173/loja/ingabeachsports
3. Clicar em um produto (abre modal)
4. No modal, clicar em "Adicionar ao Carrinho"
5. ✅ Deve aparecer toast: "Login necessário"
6. ✅ Modal do produto deve fechar
7. ✅ Dialog de autenticação deve abrir
8. Fazer login
9. Clicar novamente no produto
10. Clicar em "Adicionar ao Carrinho"
11. ✅ Produto deve ser adicionado com sucesso
```

### Teste 5: Limpar localStorage

```
1. Com cliente logado
2. Abrir DevTools (F12)
3. Ir em "Application" > "Local Storage"
4. Deletar chave: customer_{storeId}
5. Recarregar página (F5)
6. Tentar adicionar produto
7. ✅ Deve pedir login novamente
```

---

## 📝 **Mensagens ao Usuário**

### Toast de erro (não autenticado):

```
Título: ⚠️ Login necessário
Descrição: Para adicionar produtos ao carrinho, você precisa 
          estar logado. Faça login ou crie uma conta.
Tipo: destructive (vermelho)
```

### Toast de sucesso (login realizado):

```
Título: Login realizado!
Descrição: Bem-vindo, {nome}! Agora você pode adicionar 
          produtos ao carrinho.
Tipo: default (verde)
```

### Toast de sucesso (produto adicionado):

```
Título: Produto adicionado!
Descrição: {quantidade}x {nome do produto} adicionado ao carrinho.
Tipo: default (verde)
```

---

## 🔐 **Segurança**

### Armazenamento:

- ✅ Dados salvos no **localStorage** do navegador
- ✅ Chave única por loja: `customer_{storeId}`
- ✅ Dados em formato JSON
- ✅ Validação de JSON ao ler

### Limitações:

- ⚠️ localStorage pode ser manipulado pelo cliente
- ⚠️ Dados não são criptografados
- ⚠️ Autenticação de **cliente**, não de **admin**
- ℹ️ Para autenticação de admin, usar Supabase Auth (`use-auth.tsx`)

---

## ✅ **Checklist de Implementação**

### ProductPage.tsx
- [x] Imports dos dialogs
- [x] Estados para dialogs
- [x] Função `isCustomerLoggedIn()`
- [x] Callback `handleAuthSuccess()`
- [x] Verificação no `handleAddToCart()`
- [x] Componentes no JSX

### ProductDetail.tsx
- [x] Nova prop `onAuthRequired`
- [x] Função `isCustomerLoggedIn()`
- [x] Verificação no `handleAddToCart()`
- [x] Callback para página pai

### Store.tsx
- [x] Passar `onAuthRequired` para ProductDetail

### Geral
- [x] 0 erros de linting
- [x] Documentação completa
- [x] Testes manuais

---

## 🔗 **Arquivos Modificados**

### 1. **ProductPage.tsx**
- ✅ Adicionado imports dos dialogs
- ✅ Adicionado estados de autenticação
- ✅ Adicionado função `isCustomerLoggedIn()`
- ✅ Adicionado callback `handleAuthSuccess()`
- ✅ Modificado `handleAddToCart()` com verificação
- ✅ Adicionado componentes dos dialogs

### 2. **ProductDetail.tsx**
- ✅ Adicionado prop `onAuthRequired`
- ✅ Adicionado função `isCustomerLoggedIn()`
- ✅ Modificado `handleAddToCart()` com verificação
- ✅ Adicionado callback para página pai

### 3. **Store.tsx**
- ✅ Atualizado `ProductDetail` com prop `onAuthRequired`

---

## 📚 **Documentação Relacionada**

- Sistema de autenticação de clientes: `CustomerAuthDialog.tsx`
- Sistema de registro de clientes: `CustomerRegisterDialog.tsx`
- Contexto do carrinho: `CartContext.tsx`
- Hook de autenticação admin: `use-auth.tsx`

---

## 🎯 **Próximos Passos (Opcional)**

### Melhorias Futuras:

1. **Autenticação via Supabase**
   - Migrar de localStorage para Supabase Auth
   - Maior segurança
   - Sincronização entre dispositivos

2. **Persistência do carrinho**
   - Salvar carrinho no banco de dados
   - Recuperar carrinho ao fazer login

3. **Sessão com expiração**
   - Adicionar timestamp ao localStorage
   - Expirar sessão após X dias
   - Pedir re-autenticação

4. **Modo visitante**
   - Permitir adicionar ao carrinho sem login
   - Pedir login apenas no checkout
   - Opção configurável por loja

---

**Última atualização:** 24/11/2025  
**Versão:** 1.0  
**Status:** ✅ Implementação completa e testada

