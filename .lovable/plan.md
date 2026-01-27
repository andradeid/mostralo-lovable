
# Plano: Modal de Pagamento Maior com Layout em Colunas + Scrollbar Visível no Carrinho

## Problemas Atuais

### Modal de Pagamento (Imagem 1)
- Modal muito pequeno (`max-w-md`)
- Lista de itens limitada a `max-h-40` (160px) - mostra apenas 2 itens
- Tudo em uma única coluna, difícil de conferir

### Card do Carrinho (Imagem 2)
- ScrollArea existe, mas scrollbar não aparece visível
- A linha vermelha indica onde deveria ter scrollbar

---

## Solução Proposta

### Parte 1: Modal de Pagamento Expandido com 2 Colunas

**Layout Desktop (lado a lado):**
```
┌──────────────────────────────────────────────────────────────────┐
│                       Finalizar Venda                             │
├─────────────────────────────────┬────────────────────────────────┤
│     COLUNA ESQUERDA             │     COLUNA DIREITA             │
│     (Itens da Venda)            │     (Pagamento)                │
│                                 │                                │
│  ┌─────────────────────────┐    │  Subtotal         R$ 152,00   │
│  │ [📷] Produto A   R$4,00 │    │  Desconto              [0]    │
│  │ [📷] Produto B  R$50,00 │    │  ─────────────────────────    │
│  │ [📷] Produto C   R$5,00 │    │  Total            R$ 152,00   │
│  │ [📷] Produto D   R$5,00 │    │                                │
│  │ [📷] Produto E   R$9,00 │    │  Forma de Pagamento            │
│  │ [📷] Produto F  R$18,00 │    │  [Dinheiro] [Crédito]          │
│  │ ...                     │ ←ScrollArea│  [Débito]   [PIX]      │
│  └─────────────────────────┘    │  [Outros]                      │
│                                 │                                │
│                                 │  [Confirmar R$ 152,00]         │
│                                 │  [Cancelar]                    │
└─────────────────────────────────┴────────────────────────────────┘
```

**Layout Mobile (coluna única com área de itens maior):**
- Lista de itens ocupa mais espaço (`max-h-60` ao invés de `max-h-40`)
- Scrollbar sempre visível

### Alterações Técnicas

**Arquivo: `src/components/pdv/PDVPaymentModal.tsx`**

1. **Aumentar tamanho do modal**:
   - Desktop: `max-w-4xl` ao invés de `max-w-md`
   - Mobile: manter Drawer mas com mais espaço para itens

2. **Layout em 2 colunas no desktop**:
   - Coluna esquerda: Lista de itens com ScrollArea grande
   - Coluna direita: Resumo financeiro + formas de pagamento + botões

3. **ScrollArea dos itens expandida**:
   - Desktop: `h-[400px]` para mostrar mais itens
   - Mobile: `max-h-60` (240px)

**Código da estrutura:**
```tsx
// Desktop: 2 colunas
<div className="grid grid-cols-2 gap-6">
  {/* Coluna Esquerda - Itens */}
  <div className="space-y-4">
    <Label>Itens da Venda ({items.length})</Label>
    <ScrollArea className="h-[400px] border rounded-lg">
      {/* Lista de itens */}
    </ScrollArea>
  </div>
  
  {/* Coluna Direita - Pagamento */}
  <div className="space-y-4">
    {/* Resumo */}
    {/* Formas de pagamento */}
    {/* Botões */}
  </div>
</div>
```

### Parte 2: Scrollbar Visível no Card do Carrinho

**Arquivo: `src/components/pdv/PDVCart.tsx`**

Adicionar classe customizada para forçar visibilidade da scrollbar:

```tsx
<ScrollArea className="h-full [&>div>div[style]]:!block">
```

Ou usar CSS inline para garantir que a scrollbar apareça:

```tsx
<ScrollArea 
  className="h-full"
  scrollbarProps={{ className: "opacity-100" }}
>
```

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `PDVPaymentModal.tsx` | Aumentar modal para `max-w-4xl` |
| `PDVPaymentModal.tsx` | Criar layout de 2 colunas (desktop) |
| `PDVPaymentModal.tsx` | Expandir área de itens para `h-[400px]` (desktop) / `max-h-60` (mobile) |
| `PDVPaymentModal.tsx` | Separar itens do resumo/pagamento |
| `PDVCart.tsx` | Adicionar classe para scrollbar sempre visível |

---

## Benefícios

1. **Conferência completa**: Operador vê todos os 8+ itens sem precisar rolar muito
2. **Layout organizado**: Itens de um lado, pagamento do outro
3. **Scrollbar visível**: Indica claramente que há mais conteúdo
4. **UX profissional**: Similar a sistemas de PDV tradicionais
