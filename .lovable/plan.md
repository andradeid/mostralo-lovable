
# Plano: Sistema de Filtros Avançados para Produtos do Admin

## Visão Geral

Adicionar uma barra de filtros abaixo da busca existente, permitindo ao administrador encontrar produtos rapidamente usando múltiplos critérios.

## Filtros Sugeridos

### 1. Filtro por Status de Disponibilidade
| Opção | Descrição |
|-------|-----------|
| Todos | Sem filtro |
| Disponíveis | `is_available = true` |
| Indisponíveis | `is_available = false` |
| Ocultos do cardápio | `show_in_menu = false` |

### 2. Filtro por Status de Estoque
| Opção | Descrição |
|-------|-----------|
| Todos | Sem filtro |
| Sem estoque | `stock_quantity = 0` e `track_stock = true` |
| Estoque baixo | `stock_quantity <= stock_alert_threshold` |
| Estoque normal | Acima do alerta |
| Sem controle | `track_stock = false` ou `null` |

### 3. Filtro por Faixa de Preço
- Slider duplo para definir preço mínimo e máximo
- Ou presets rápidos: "Até R$ 50", "R$ 50 - R$ 100", "Acima de R$ 100"

### 4. Filtro por Categoria (Multi-seleção)
- Chips clicáveis com as categorias
- Permite selecionar múltiplas categorias
- Badge mostrando quantidade selecionada

### 5. Filtro por Promoção
| Opção | Descrição |
|-------|-----------|
| Todos | Sem filtro |
| Em promoção | `is_on_offer = true` |
| Preço normal | `is_on_offer = false` |

### 6. Filtro por Imagem
| Opção | Descrição |
|-------|-----------|
| Todos | Sem filtro |
| Com imagem | `image_url IS NOT NULL` |
| Sem imagem | `image_url IS NULL` |

## Design da UI

```text
┌─────────────────────────────────────────────────────────────────┐
│  [🔍 Buscar produtos...                    ] [Ordenar: Manual ▼]│
├─────────────────────────────────────────────────────────────────┤
│  Filtros: [Status ▼] [Estoque ▼] [Preço ▼] [Promoção ▼]         │
│           [Categorias ▼] [Imagem ▼]         [✕ Limpar filtros]  │
├─────────────────────────────────────────────────────────────────┤
│  📊 Mostrando 45 de 1.234 produtos                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Filtros ativos: [Sem estoque ✕] [Em promoção ✕]             ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Componentes Mobile
- Filtros em popover/sheet em vez de dropdowns
- Botão "Filtros" com badge mostrando quantidade de filtros ativos
- Sheet deslizante com todos os filtros quando clicado

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/admin/products/ProductFilters.tsx` | Componente principal com todos os filtros |
| `src/components/admin/products/ProductFiltersSheet.tsx` | Versão mobile em sheet/drawer |
| `src/components/admin/products/ActiveFiltersBar.tsx` | Barra de filtros ativos com botão de remover |

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/admin/ProductsPage.tsx` | Adicionar estado dos filtros, integrar componentes, aplicar lógica de filtragem |

## Detalhes Técnicos

### Estado dos Filtros

```typescript
interface ProductFilters {
  status: 'all' | 'available' | 'unavailable' | 'hidden';
  stock: 'all' | 'out_of_stock' | 'low_stock' | 'normal' | 'no_tracking';
  priceRange: { min: number | null; max: number | null };
  categories: string[]; // IDs das categorias selecionadas
  promotion: 'all' | 'on_sale' | 'regular';
  hasImage: 'all' | 'with_image' | 'without_image';
}
```

### Lógica de Filtragem

```typescript
const applyFilters = (products: ProductData[], filters: ProductFilters) => {
  return products.filter(product => {
    // Status
    if (filters.status === 'available' && !product.is_available) return false;
    if (filters.status === 'unavailable' && product.is_available) return false;
    if (filters.status === 'hidden' && product.show_in_menu) return false;
    
    // Estoque
    if (filters.stock === 'out_of_stock') {
      if (!product.track_stock || product.stock_quantity !== 0) return false;
    }
    if (filters.stock === 'low_stock') {
      if (!product.track_stock) return false;
      if (product.stock_quantity > (product.stock_alert_threshold || 0)) return false;
    }
    // ... demais filtros
    
    return true;
  });
};
```

### Contador de Resultados

```typescript
const filteredCount = filteredProducts.length;
const totalCount = allProducts.length;
const hasActiveFilters = Object.values(filters).some(v => v !== 'all' && v !== null);

// Exibir: "Mostrando 45 de 1.234 produtos"
```

## UX/Comportamento

1. **Filtros persistem** durante a sessão (não salva após refresh)
2. **Combináveis**: todos os filtros funcionam juntos (AND)
3. **Busca + Filtros**: a busca por texto combina com os filtros
4. **Feedback visual**: 
   - Badge no botão "Filtros" mostra quantidade de filtros ativos
   - Barra de filtros ativos mostra chips removíveis
5. **Reset rápido**: botão "Limpar filtros" remove todos de uma vez
6. **Accordions respeitam filtros**: categorias vazias (após filtro) são ocultadas

## Estimativas

| Tarefa | Tempo |
|--------|-------|
| ProductFilters.tsx (desktop) | 30 min |
| ProductFiltersSheet.tsx (mobile) | 20 min |
| ActiveFiltersBar.tsx | 15 min |
| Integrar em ProductsPage.tsx | 25 min |
| Testes e ajustes | 15 min |
| **Total** | ~1.5 horas |

## Benefícios

1. **Produtividade**: Encontrar produtos específicos instantaneamente
2. **Gestão de estoque**: Identificar rapidamente produtos sem estoque ou em baixa
3. **Qualidade do catálogo**: Filtrar produtos sem imagem para completar cadastros
4. **Análise de preços**: Ver distribuição de preços por faixa
5. **Controle de promoções**: Gerenciar ofertas ativas facilmente
