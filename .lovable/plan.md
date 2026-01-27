
# Plano: Otimização do PDV com Busca Paginada

## Situação Atual

### Como o PDV funciona hoje:

```text
┌─────────────────────────────────────────────────────────────────┐
│  PDV ATUAL - CARREGA TODOS OS PRODUTOS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Ao abrir PDV:                                               │
│     → Busca TODOS os produtos da loja (sem limite)              │
│     → 10.000 produtos = 10.000 objetos na memória               │
│     → Tempo de carga: 5-15 segundos                             │
│                                                                 │
│  2. Ao digitar na busca:                                        │
│     → Filtra 10.000 produtos no navegador (client-side)         │
│     → A cada letra = novo loop em 10.000 itens                  │
│     → Causa lag/travamento em mobile                            │
│                                                                 │
│  3. Ao trocar categoria:                                        │
│     → Mesmo problema: filtro local em 10.000 itens              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Código problemático (PDVProductGrid.tsx):

```typescript
// PROBLEMA: Busca todos os produtos sem limite
const { data: products = [] } = useQuery({
  queryKey: ['pdv-products', storeId],
  queryFn: async () => {
    const { data } = await supabase
      .from('products')
      .select(`id, name, price, ...`)
      .eq('store_id', storeId)
      .eq('is_available', true)
      .order('name');  // SEM .range() ou .limit()
    return data;
  },
});

// PROBLEMA: Filtro client-side em todos os produtos
const filteredProducts = products.filter(product => {
  const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
  return matchesSearch && matchesCategory;
});
```

---

## Solução: PDV Leve com Busca Server-Side

### Arquitetura proposta:

```text
┌─────────────────────────────────────────────────────────────────┐
│  PDV OTIMIZADO - BUSCA PAGINADA + SERVER-SIDE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Ao abrir PDV:                                               │
│     → Carrega apenas 50 produtos iniciais                       │
│     → Tempo de carga: <1 segundo                                │
│     → Memória: 50 objetos                                       │
│                                                                 │
│  2. Ao rolar a lista (Infinite Scroll):                         │
│     → IntersectionObserver detecta final da lista               │
│     → Carrega próximos 50 produtos automaticamente              │
│     → Usa o hook useInfiniteScroll existente                    │
│                                                                 │
│  3. Ao digitar na busca (debounce 300ms):                       │
│     → Envia busca para o Supabase                               │
│     → Usa .ilike('name', '%termo%')                             │
│     → Retorna apenas produtos que correspondem                  │
│     → Mantém paginação na busca                                 │
│                                                                 │
│  4. Ao trocar categoria:                                        │
│     → Nova query com filtro server-side                         │
│     → Reseta paginação para 50 primeiros                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Componentes a Criar/Modificar

### 1. Hook: `usePDVProducts` (novo)

Hook dedicado para gerenciar produtos do PDV com paginação e busca server-side.

**Funcionalidades:**
- Carregamento inicial de 50 produtos
- Infinite scroll para carregar mais
- Busca server-side com debounce
- Filtro por categoria server-side
- Contador de total/carregados
- Reset automático ao mudar filtros

**Interface:**
```typescript
interface UsePDVProductsReturn {
  products: Product[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  totalProducts: number;
  loadedCount: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (categoryId: string | null) => void;
  loadMore: () => void;
  loadMoreRef: (node: HTMLDivElement | null) => void;
}
```

### 2. Modificar: `PDVProductGrid.tsx`

Refatorar para usar o novo hook:
- Remover useQuery local de produtos
- Usar `usePDVProducts` hook
- Adicionar elemento trigger para infinite scroll
- Adicionar indicador de "carregando mais..."
- Manter UI atual (grid, categorias, etc.)

### 3. Componente: `PDVProductsCounter` (novo)

Similar ao ProductsCounter da loja:
- Mostra "50 de 10.000 produtos"
- Barra de progresso sutil
- Esconde durante busca ativa

---

## Detalhes Técnicos

### Busca Server-Side com Debounce

```typescript
// Debounce de 300ms na busca
const debouncedSearch = useMemo(
  () => debounce((term: string) => {
    setDebouncedSearchTerm(term);
  }, 300),
  []
);

// Query com filtro server-side
const buildQuery = useCallback(() => {
  let query = supabase
    .from('products')
    .select('id, name, price, description, image_url, category_id, categories(name)')
    .eq('store_id', storeId)
    .eq('is_available', true);
  
  // Filtro de busca server-side
  if (debouncedSearchTerm) {
    query = query.ilike('name', `%${debouncedSearchTerm}%`);
  }
  
  // Filtro de categoria server-side
  if (selectedCategory) {
    query = query.eq('category_id', selectedCategory);
  }
  
  return query.order('name').range(from, to);
}, [storeId, debouncedSearchTerm, selectedCategory, from, to]);
```

### Infinite Scroll (reutilizando hook existente)

```typescript
// Usar o hook já existente
const loadMoreRef = useInfiniteScroll({
  hasMore,
  isLoading: isLoadingMore,
  onLoadMore: loadMore,
  rootMargin: '100px', // PDV menor que loja
});
```

### Reset ao mudar filtros

```typescript
// Resetar paginação quando busca ou categoria muda
useEffect(() => {
  currentPageRef.current = 0;
  setProducts([]);
  setHasMore(true);
  // Trigger nova busca
}, [debouncedSearchTerm, selectedCategory]);
```

---

## Comparação: Antes vs Depois

| Aspecto | Antes (Atual) | Depois (Otimizado) |
|---------|---------------|-------------------|
| Carga inicial | Todos os produtos | 50 produtos |
| Tempo de abertura | 5-15s (10k produtos) | <1s |
| Memória usada | ~10MB (10k objetos) | ~500KB (50 objetos) |
| Busca | Client-side (lenta) | Server-side (rápida) |
| Filtro categoria | Client-side | Server-side |
| Scroll | Todos renderizados | Carrega sob demanda |
| Mobile | Trava com muitos produtos | Fluido sempre |

---

## UX para Frente de Caixa

### Considerações especiais para PDV:
1. **Busca por código de barras**: Campo de busca aceita código/SKU
2. **Atalhos de teclado**: Enter adiciona produto rapidamente
3. **Produtos frequentes**: Cache local dos 20 mais vendidos
4. **Modo offline**: Não implementar agora, mas arquitetura permite

### UI mantida:
- Grid de produtos com imagens
- Scroll horizontal de categorias
- Modal de confirmação de adição
- Upsell após adicionar item

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/hooks/usePDVProducts.ts` | Hook com paginação, busca e filtros server-side |
| `src/components/pdv/PDVProductsCounter.tsx` | Contador "50 de 10.000" |

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/pdv/PDVProductGrid.tsx` | Usar novo hook, adicionar infinite scroll trigger |

---

## Benefícios Esperados

1. **Performance**: PDV abre em <1 segundo independente do catálogo
2. **Memória**: Usa 95% menos RAM no navegador
3. **Mobile**: Funciona perfeitamente em dispositivos mais simples
4. **Escalabilidade**: Suporta 100.000+ produtos sem impacto
5. **Busca rápida**: Resultados instantâneos via índice do banco
6. **Consistência**: Mesmo padrão usado na loja

---

## Estimativas

| Tarefa | Tempo |
|--------|-------|
| Hook usePDVProducts | 30 min |
| Componente PDVProductsCounter | 10 min |
| Refatorar PDVProductGrid | 25 min |
| Testes e ajustes | 15 min |
| **Total** | ~1.5 horas |
