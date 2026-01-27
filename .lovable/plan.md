
# Plano: Correção do Card do Carrinho PDV - Textos Completos e Scroll Funcional

## Problemas Identificados nas Imagens

1. **Valores truncados**: Os preços como "R$ 59,0" estão sendo cortados (deveria ser "R$ 59,00")
2. **Nomes longos cortados**: Produtos com nomes extensos ficam truncados
3. **Footer desaparece**: Ao adicionar muitos produtos, o botão "Finalizar Venda" some para baixo

## Solução Proposta

### Estrutura de Layout Corrigida

```text
┌─────────────────────────────────┐
│  HEADER (fixo)                  │  ← CardHeader com altura fixa
│  🛒 Carrinho [5]        Limpar  │
├─────────────────────────────────┤
│                                 │
│  ÁREA ROLÁVEL                   │  ← ScrollArea com altura calculada
│  ┌─────────────────────────────┐│
│  │ Item 1         R$ 50,00     ││
│  │ Item 2         R$ 19,00     ││  ← Barra de rolagem lateral visível
│  │ Item 3         R$ 59,00     ││
│  │ Item 4         R$ 23,00     ││
│  │ ...                         ││
│  └─────────────────────────────┘│
├─────────────────────────────────┤
│  FOOTER (fixo)                  │  ← CardFooter sempre visível
│  Subtotal            R$ 153,00  │
│  Total               R$ 153,00  │
│  [ Finalizar Venda ]            │
└─────────────────────────────────┘
```

### Alterações Técnicas

#### 1. PDVCart.tsx - Estrutura Flexbox Corrigida

**Mudanças principais:**
- Remover `truncate` do nome do produto para exibir texto completo
- Usar `break-words` para quebrar linhas em nomes longos
- Ajustar o layout dos preços para não serem cortados
- Definir altura fixa para Header e Footer
- Calcular altura da ScrollArea dinamicamente

**Código do nome do produto:**
```tsx
// Antes (trunca):
<p className="font-medium truncate text-base">{item.product_name}</p>

// Depois (quebra linha):
<p className="font-medium break-words leading-tight text-base">{item.product_name}</p>
```

**Código do preço (garantir espaço):**
```tsx
// Antes:
<p className="font-bold text-primary whitespace-nowrap text-base">
  {formatCurrency(item.total_price)}
</p>

// Depois (largura mínima para valores):
<p className="font-bold text-primary whitespace-nowrap text-base min-w-[80px] text-right">
  {formatCurrency(item.total_price)}
</p>
```

#### 2. Estrutura de Altura do Card

**Card principal:**
```tsx
<Card className="flex flex-col max-h-[calc(100vh-80px)]">
```

**CardHeader - altura automática, não encolhe:**
```tsx
<CardHeader className="pb-3 flex-shrink-0">
```

**CardContent - área flexível com overflow:**
```tsx
<CardContent className="flex-1 min-h-0 overflow-hidden px-3">
  <ScrollArea className="h-full">
    <div className="space-y-3 pr-3">
      {/* Itens do carrinho */}
    </div>
  </ScrollArea>
</CardContent>
```

**CardFooter - altura automática, não encolhe:**
```tsx
<CardFooter className="flex-shrink-0 flex-col gap-3 pt-3 border-t">
```

#### 3. Melhorias UX Adicionais

- **Padding no conteúdo**: Adicionar `pr-3` para não sobrepor a scrollbar
- **Espaço visual**: Garantir separação clara entre itens
- **Feedback visual**: Scrollbar mais visível com cor de contraste

### Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `PDVCart.tsx` | Trocar `truncate` por `break-words leading-tight` no nome do produto |
| `PDVCart.tsx` | Adicionar `min-w-[80px] text-right` nos valores para garantir espaço |
| `PDVCart.tsx` | Adicionar `flex-shrink-0` no CardHeader e CardFooter |
| `PDVCart.tsx` | Adicionar `min-h-0` no CardContent (fix flexbox) |
| `PDVCart.tsx` | Adicionar `pr-3` na lista de itens para não sobrepor scrollbar |

### Benefícios

1. **Textos completos**: Nomes de produtos e valores nunca serão cortados
2. **Scroll funcional**: Barra de rolagem lateral aparece quando necessário
3. **Footer fixo**: Botão "Finalizar Venda" sempre visível na tela
4. **Melhor UX**: Operador consegue ver todas as informações sem esforço
