# Correções: Comprovante e Aprovações

**Data:** 22/11/2025  
**Status:** ✅ Concluído

---

## 🐛 Problemas Identificados

### 1. Comprovante de Pagamento Não Mostrava Imagem
**Sintoma:** Ao enviar comprovante, a imagem não aparecia para visualização.

**Causa:** 
- Bucket `payment-proofs` configurado como **PRIVADO** (`public: false`)
- Método `getPublicUrl()` não funciona em buckets privados
- Precisaria usar URLs assinadas ou bucket público

### 2. Novos Assinantes Não Apareciam no Super Admin
**Sintoma:** Após cadastro, o super admin não via o novo assinante em `/dashboard/subscription-payments`

**Causa:**
- Query do Supabase sem especificar foreign keys explicitamente
- Relacionamentos ambíguos causavam falha silenciosa
- Query retornava vazio sem erro

---

## ✅ Soluções Implementadas

### 1. Mudança de Bucket (PaymentProof.tsx)

#### **Antes:**
```typescript
const { error: uploadError, data } = await supabase.storage
  .from('payment-proofs')  // PRIVADO ❌
  .upload(fileName, selectedFile);

const { data: urlData } = supabase.storage
  .from('payment-proofs')  // PRIVADO ❌
  .getPublicUrl(fileName);
```

#### **Depois:**
```typescript
const { error: uploadError, data } = await supabase.storage
  .from('subscription-receipts')  // PÚBLICO ✅
  .upload(fileName, selectedFile);

const { data: urlData } = supabase.storage
  .from('subscription-receipts')  // PÚBLICO ✅
  .getPublicUrl(fileName);
```

#### **Justificativa:**
- Bucket `subscription-receipts` já existe e é **PÚBLICO**
- Não quebra nada existente (bucket novo vs reutilização)
- URLs funcionam imediatamente sem configuração adicional
- Compatível com sistema de invoices existente

---

### 2. Correção de Query (SubscriptionPaymentsManagementPage.tsx)

#### **Antes:**
```typescript
const { data, error } = await supabase
  .from('payment_approvals')
  .select(`
    *,
    profiles!payment_approvals_user_id_fkey (full_name, email),
    stores (name),    // ❌ Ambíguo
    plans (name)      // ❌ Ambíguo
  `)
  .eq('status', 'pending');
```

#### **Depois:**
```typescript
const { data, error } = await supabase
  .from('payment_approvals')
  .select(`
    *,
    profiles!payment_approvals_user_id_fkey (full_name, email),
    stores!payment_approvals_store_id_fkey (name),    // ✅ Explícito
    plans!payment_approvals_plan_id_fkey (name)       // ✅ Explícito
  `)
  .eq('status', 'pending');
```

#### **Justificativa:**
- Foreign keys explícitas eliminam ambiguidade
- Supabase consegue resolver relacionamentos corretamente
- Adiciona logs de console para debug futuro
- Muda ordenação para `DESC` (mais recentes primeiro)

---

## 📊 Buckets Disponíveis

| Bucket | Público | Limite | Tipos Permitidos | Uso |
|--------|---------|--------|------------------|-----|
| `store-assets` | ✅ | - | Todos | Assets gerais da loja |
| `avatars` | ✅ | - | Todos | Avatares de usuários |
| `store-images` | ✅ | 50MB | Imagens | Fotos de produtos |
| `store-banners` | ✅ | - | Todos | Banners da loja |
| `payment-receipts` | ✅ | - | Todos | Recibos de pagamento |
| **`subscription-receipts`** | ✅ | - | Todos | **Comprovantes de assinatura** ⭐ |
| `promotion-banners` | ✅ | - | Todos | Banners de promoções |
| `payment-proofs` | ❌ | 5MB | Img/PDF | ⚠️ NÃO USAR (privado) |

---

## 🔄 Fluxo Completo Agora

### Upload de Comprovante:
```
1. Usuário seleciona arquivo (PaymentProof.tsx)
2. Upload para subscription-receipts ✅
3. Gera URL pública ✅
4. Salva URL em payment_approvals.payment_proof_url
5. Atualiza estado local (remove campo upload)
6. Redireciona para /dashboard/subscription
```

### Aprovação pelo Super Admin:
```
1. Super admin acessa /dashboard/subscription-payments
2. Query busca payment_approvals com status='pending' ✅
3. Exibe em "Novos Assinantes Pendentes" ✅
4. Mostra dados: usuário, empresa, plano, valor, data
5. Botão "Ver Comprovante" abre dialog com imagem ✅
6. Botões "Aprovar" e "Rejeitar" funcionam
```

---

## 📁 Arquivos Modificados

1. **`.mostralo/src/pages/PaymentProof.tsx`**
   - Linha 153: `from('payment-proofs')` → `from('subscription-receipts')`
   - Linha 163: `from('payment-proofs')` → `from('subscription-receipts')`

2. **`.mostralo/src/pages/admin/SubscriptionPaymentsManagementPage.tsx`**
   - Linha 132: `stores (name)` → `stores!payment_approvals_store_id_fkey (name)`
   - Linha 133: `plans (name)` → `plans!payment_approvals_plan_id_fkey (name)`
   - Linha 136: `.order('created_at', { ascending: true })` → `{ ascending: false }`
   - Adicionados logs de console (linhas 129, 138)

---

## ✅ Testes Realizados

### Teste 1: Upload de Comprovante
- [x] Arquivo selecionado
- [x] Upload bem-sucedido
- [x] URL gerada corretamente
- [x] Campo de upload desaparece após envio
- [x] Imagem aparece no preview

### Teste 2: Visualização no Super Admin
- [x] Novo assinante aparece na lista
- [x] Dados exibidos corretamente
- [x] Botão "Ver Comprovante" funciona
- [x] Imagem carrega no dialog
- [x] Botões de aprovação/rejeição ativos

---

## 🚀 Como Testar

### 1. Criar Nova Conta:
```
1. Acesse http://localhost:5173/signup
2. Preencha formulário completo
3. Envie comprovante de pagamento
4. Verifique se imagem aparece no preview
```

### 2. Verificar como Super Admin:
```
1. Acesse http://localhost:5173/dashboard/subscription-payments
2. Verifique seção "Novos Assinantes Pendentes"
3. Deve mostrar usuário recém-cadastrado
4. Clique em "Ver Comprovante"
5. Imagem deve carregar corretamente
```

---

## 📝 Notas Importantes

### ⚠️ Bucket payment-proofs
- **NÃO USAR** `payment-proofs` (é privado)
- Arquivos antigos lá não aparecerão
- Se necessário, migrar manualmente ou deixar histórico

### ✅ Bucket subscription-receipts
- **USAR SEMPRE** para comprovantes de assinatura
- Público, URLs funcionam diretamente
- Sem limite de tamanho configurado
- Aceita todos os tipos de arquivo

### 🔍 Debugging
- Console logs adicionados em `fetchPendingApprovals()`
- Verificar console do navegador se problemas
- Erros de query aparecem no console

---

## 🎯 Resultado Final

```diff
+ Comprovantes aparecem corretamente ✅
+ Novos assinantes visíveis no super admin ✅
+ URLs públicas funcionando ✅
+ Sem quebra de funcionalidades existentes ✅
+ Logs de debug adicionados ✅
```

---

**Status:** ✅ **FUNCIONANDO PERFEITAMENTE**

**Última Atualização:** 22/11/2025 às 01:30

