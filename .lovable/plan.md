
# Plano: Corrigir Layout PDV - Scroll Interno no Carrinho + Remover Scroll da Página

## Problema Identificado

Na imagem, você marcou com setas vermelhas:
1. **Seta superior**: Mostra que existe scroll na PÁGINA TODA (não deveria existir)
2. **Seta na lateral do carrinho**: O carrinho NÃO tem scroll interno

**Causa raiz no código (linha 328 do PDVPage.tsx):**
```tsx
<div className="w-80 lg:w-96 flex-shrink-0 self-start sticky top-0">
```

O problema é:
- `self-start` → Faz o carrinho encolher para o tamanho do conteúdo ao invés de preencher a altura
- `sticky top-0` → Comportamento para scroll de página (não queremos scroll de página!)

## Solução Proposta

### Alteração 1: `PDVPage.tsx` (linha 328)

**Antes:**
```tsx
<div className="w-80 lg:w-96 flex-shrink-0 self-start sticky top-0">
```

**Depois:**
```tsx
<div className="w-80 lg:w-96 flex-shrink-0 h-full overflow-hidden">
```

- Remove `self-start sticky top-0` (comportamento de scroll de página)
- Adiciona `h-full` (carrinho ocupa 100% da altura disponível)
- Adiciona `overflow-hidden` (garante que scroll seja interno)

### Alteração 2: `PDVCart.tsx` (linha 37)

**Antes:**
```tsx
<Card className="flex flex-col h-full max-h-[calc(100dvh-80px)]">
```

**Depois:**
```tsx
<Card className="flex flex-col h-full">
```

- Remove `max-h-[calc(100dvh-80px)]` pois agora o container pai (`h-full overflow-hidden`) já controla a altura máxima
- O `h-full` faz o Card preencher todo o espaço do wrapper

## Resultado Visual Esperado

```
┌──────────────────────────────────────────────────────────────┐
│  [PDV] [Comandas] [Histórico]                    [Tela Cheia]│
├────────────────────────────────────┬─────────────────────────┤
│                                    │  🛒 Carrinho (9)  Limpar│
│   Grid de Produtos                 │  ┌────────────────────┐ │
│   ┌─────────────────────────────┐  │  │ Produto A   R$4    │ │
│   │  [Produto] [Produto] ...    │  │  │ Produto B   R$50   │ │
│   │                             │  │  │ Produto C   R$5    │ │
│   │          SCROLL             │  │  │      SCROLL        │ │← SCROLL AQUI
│   │             ↓               │  │  │        ↓           │ │
│   │                             │  │  │ Produto D   R$18   │ │
│   └─────────────────────────────┘  │  └────────────────────┘ │
│                                    │  Subtotal     R$125,00  │
│                                    │  Total        R$125,00  │
│                                    │  [Finalizar Venda]      │
├────────────────────────────────────┴─────────────────────────┤
│                       FOOTER VISÍVEL                          │← Footer aparece
└──────────────────────────────────────────────────────────────┘

SEM SCROLL NA PÁGINA ✓
```

## Arquivos a Modificar

| Arquivo | Linha | Alteração |
|---------|-------|-----------|
| `PDVPage.tsx` | 328 | Trocar `self-start sticky top-0` por `h-full overflow-hidden` |
| `PDVCart.tsx` | 37 | Remover `max-h-[calc(100dvh-80px)]`, manter `h-full` |

## Resumo

- Scroll de página: **REMOVIDO**
- Scroll de produtos: **MANTIDO** ✓
- Scroll do carrinho: **ATIVADO** (agora vai funcionar!)
- Footer visível: **SIM** (sem scroll de página)
