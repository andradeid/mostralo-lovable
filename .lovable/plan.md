
# Plano: Carrinho PDV com Scrollbar Visível + Produtos com Foto na Finalização

## Problemas Identificados

### 1. Barra de rolagem não aparece no carrinho
Na imagem fornecida, o carrinho exibe 6 produtos mas não mostra a scrollbar. O problema é que o `ScrollArea` do Radix UI só mostra a scrollbar quando o mouse está sobre o componente (comportamento padrão).

**Solução:** Modificar o componente `ScrollArea` para exibir a scrollbar **sempre visível** quando há conteúdo a rolar.

### 2. Modal de finalização não mostra os produtos
O modal `PDVPaymentModal` (imagem 1) mostra apenas:
- Subtotal
- Desconto
- Total
- Forma de pagamento

**Não exibe** a lista de produtos para conferência antes de confirmar.

---

## Solução Proposta

### Parte 1: Scrollbar Sempre Visível

**Arquivo:** `src/components/ui/scroll-area.tsx`

Modificar o `ScrollBar` para ter a classe `opacity-100` sempre, removendo o comportamento de fade que oculta a barra.

```text
Antes:
<ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />

Depois:
<ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border/80" />

E no ScrollBar:
Adicionar classe para sempre mostrar: "data-[state=visible]:opacity-100 opacity-100"
```

### Parte 2: Lista de Produtos no Modal de Pagamento

**Arquivo:** `src/components/pdv/PDVPaymentModal.tsx`

Adicionar uma seção com os itens do carrinho **antes** do resumo financeiro:
- Exibir imagem em miniatura (se existir)
- Nome do produto
- Quantidade × Preço unitário = Total

**Fluxo de dados:**
1. O `PDVPaymentModal` atualmente recebe apenas `subtotal`
2. Precisa receber também `items: CartItem[]` do `usePDV`
3. Mas o `CartItem` não tem `image_url`!

**Solução para imagens:**
- Modificar `CartItem` em `usePDV.ts` para incluir `image_url?: string`
- Modificar `addToCart` para receber a URL da imagem
- Modificar `PDVProductGrid` para passar a imagem ao adicionar

---

## Alterações Técnicas Detalhadas

### Arquivo 1: `src/components/ui/scroll-area.tsx`

Forçar scrollbar sempre visível:

```tsx
<ScrollAreaPrimitive.ScrollAreaScrollbar
  orientation={orientation}
  className={cn(
    "flex touch-none select-none transition-colors",
    orientation === "vertical" &&
      "h-full w-2.5 border-l border-l-transparent p-[1px]",
    // Nova classe para manter sempre visível
    "opacity-100",
    className
  )}
>
  <ScrollAreaPrimitive.ScrollAreaThumb 
    className="relative flex-1 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50" 
  />
```

### Arquivo 2: `src/hooks/usePDV.ts`

Adicionar `image_url` ao tipo `CartItem`:

```tsx
export interface CartItem {
  id: string;
  product_id?: string;
  product_name: string;
  image_url?: string;  // NOVO
  unit_price: number;
  quantity: number;
  total_price: number;
  addons?: Record<string, any>;
  notes?: string;
}
```

### Arquivo 3: `src/components/pdv/PDVProductGrid.tsx`

Passar `image_url` ao adicionar produto:

```tsx
const handleConfirmAdd = (product: PDVProduct, quantity: number, notes: string) => {
  onAddProduct({
    product_id: product.id,
    product_name: product.name,
    image_url: product.image_url,  // NOVO
    unit_price: product.price,
    quantity,
    notes: notes || undefined,
  });
  // ...
};
```

### Arquivo 4: `src/components/pdv/PDVPaymentModal.tsx`

Adicionar props e lista de produtos:

```tsx
interface PDVPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtotal: number;
  items: CartItem[];  // NOVO
  onConfirm: (...) => void;
  isProcessing?: boolean;
}

// No conteúdo, antes do resumo financeiro:
<div className="space-y-2 max-h-40 overflow-auto">
  <Label>Itens da Venda</Label>
  {items.map((item) => (
    <div key={item.id} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
      {item.image_url ? (
        <img 
          src={item.image_url} 
          alt={item.product_name}
          className="w-12 h-12 object-cover rounded"
        />
      ) : (
        <div className="w-12 h-12 bg-muted-foreground/20 rounded flex items-center justify-center">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.product_name}</p>
        <p className="text-xs text-muted-foreground">
          {item.quantity}× {formatCurrency(item.unit_price)}
        </p>
      </div>
      <p className="font-bold text-sm">{formatCurrency(item.total_price)}</p>
    </div>
  ))}
</div>
```

### Arquivo 5: `src/pages/admin/PDVPage.tsx`

Passar `cart` para o modal:

```tsx
<PDVPaymentModal
  open={paymentModalOpen}
  onOpenChange={setPaymentModalOpen}
  subtotal={subtotal}
  items={cart}  // NOVO
  onConfirm={handleFinalize}
  isProcessing={isProcessing}
/>
```

---

## Visualização do Resultado

```text
┌─────────────────────────────────────┐
│          Finalizar Venda            │
├─────────────────────────────────────┤
│  Itens da Venda                     │
│  ┌─────────────────────────────────┐│
│  │ [📷] Produto A     2× R$5     R$10││
│  │ [📷] Produto B     1× R$50    R$50││
│  │ [📷] Produto C     3× R$10    R$30││  ← ScrollArea com scrollbar visível
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Subtotal              R$ 90,00  ││
│  │ Desconto                   [0]  ││
│  │ Total                 R$ 90,00  ││
│  └─────────────────────────────────┘│
│                                     │
│  [Dinheiro] [Crédito] [Débito]...   │
│                                     │
│  [        Confirmar R$ 90,00       ]│
│  [            Cancelar             ]│
└─────────────────────────────────────┘
```

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `scroll-area.tsx` | Adicionar classe `opacity-100` para scrollbar sempre visível |
| `usePDV.ts` | Adicionar `image_url` ao tipo `CartItem` |
| `PDVProductGrid.tsx` | Passar `image_url` no `handleConfirmAdd` e `handleUpsellAccept` |
| `PDVPaymentModal.tsx` | Adicionar prop `items` e exibir lista de produtos com fotos |
| `PDVPage.tsx` | Passar `cart` para `PDVPaymentModal` |

---

## Benefícios

1. **Conferência visual**: Operador vê todos os itens com fotos antes de confirmar
2. **Scrollbar visível**: Usuário sabe que pode rolar para ver mais itens
3. **Prevenção de erros**: Reduz chance de confirmar venda errada
4. **UX profissional**: Comportamento similar a sistemas de PDV tradicionais
