

# Plano: Separar endereço de entrega do endereço cadastral

## Problema

Quando o cliente altera o endereço durante o checkout (via mapa), a Edge Function `customer-auth-v2` atualiza o campo `address` na tabela `customers`. Isso sobrescreve o endereço salvo do cliente permanentemente. Na próxima compra, o endereço "padrão" dele já é o novo, não o original.

## Solução

O endereço editado no checkout deve ser usado **apenas para o pedido** (campo `customer_address` na tabela `orders`), sem alterar o cadastro do cliente. O endereço do perfil só deve ser atualizado se o cliente for novo (primeira vez).

## Alterações

### 1. Edge Function `customer-auth-v2/index.ts`

Na função `identifyByPhone`, remover a linha que atualiza `address` para clientes existentes:

```
// ANTES (linha 181):
if (address && address.trim()) updates.address = address.trim();

// DEPOIS: remover essa linha
```

Manter a atribuição de `address` apenas no bloco de criação de cliente novo (linha 206), que já existe e está correto.

### 2. Frontend `CheckoutDialog.tsx`

Na chamada `identify-by-phone` (linha 560), **não enviar `address`** para clientes já identificados. O endereço de entrega já é salvo corretamente no campo `customer_address` do pedido (linha 638).

Remover:
```
address: deliveryType === 'delivery' ? customerAddress : undefined,
```

Da payload enviada para `customer-auth-v2`.

---

### Resumo do comportamento após a mudança

| Cenário | Endereço no cadastro (`customers.address`) | Endereço no pedido (`orders.customer_address`) |
|---------|---------------------------------------------|------------------------------------------------|
| Cliente novo | Salva o endereço informado | Salva o endereço informado |
| Cliente existente, mesmo endereço | Mantém o original | Salva no pedido |
| Cliente existente, muda endereço | **Mantém o original** (não sobrescreve) | Salva o novo endereço no pedido |

### Arquivos editados

| Arquivo | Ação |
|---------|------|
| `supabase/functions/customer-auth-v2/index.ts` | Remover update de `address` para clientes existentes |
| `src/components/checkout/CheckoutDialog.tsx` | Remover `address` da payload de identify-by-phone |

