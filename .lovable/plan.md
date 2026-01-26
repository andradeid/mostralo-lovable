
# Plano: Paginação Inteligente na Loja

## Problema Atual
A página da loja (`Store.tsx`) carrega **todos os produtos** de uma vez na memória:
```typescript
supabase
  .from('products')
  .select('...')
  .eq('store_id', storeData.id)
  .eq('is_available', true)
  .order('display_order')
// Sem limit! Carrega tudo.
```

Para uma loja com 10.000 produtos, isso causa:
- Download de ~5-10MB de dados
- Tempo de carregamento de 10-30 segundos
- Consumo excessivo de memória do navegador
- Experiência ruim para o cliente

---

## Solução Proposta: Infinite Scroll com Paginação

Recomendo **Infinite Scroll** (carregar mais ao rolar) em vez de paginação tradicional com números. Motivos:

| Aspecto | Infinite Scroll | Paginação Numérica |
|---------|-----------------|-------------------|
| UX Mobile | Excelente (natural) | Ruim (cliques extras) |
| Descoberta de produtos | Fluida | Interrompida |
| Performance inicial | 50 produtos | 50 produtos |
| Implementação | Simples | Simples |

### Comportamento Esperado
1. Página carrega com os **primeiros 50 produtos**
2. Ao rolar até o final, carrega mais 50 automaticamente
3. Indicador visual mostrando "Carregando mais produtos..."
4. Contador mostrando "Exibindo X de Y produtos"
5. Funciona junto com filtros de categoria e busca

---

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────┐
│                    CARREGAMENTO INICIAL                         │
├─────────────────────────────────────────────────────────────────┤
│  1. Buscar contagem total de produtos                           │
│     SELECT count(*) FROM products WHERE store_id = X            │
│                                                                 │
│  2. Buscar primeiros 50 produtos                                │
│     SELECT * FROM products WHERE store_id = X                   │
│     ORDER BY display_order LIMIT 50 OFFSET 0                    │
│                                                                 │
│  3. Renderizar página com contador: "50 de 10.000 produtos"     │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INFINITE SCROLL                              │
├─────────────────────────────────────────────────────────────────┤
│  Ao rolar 80% da página:                                        │
│                                                                 │
│  1. Mostrar loader "Carregando mais..."                         │
│  2. Buscar próximos 50 produtos (OFFSET = 50, 100, 150...)      │
│  3. Buscar variantes dos novos produtos                         │
│  4. Adicionar ao array existente                                │
│  5. Atualizar contador: "100 de 10.000 produtos"                │
│                                                                 │
│  Parar quando: offset >= total de produtos                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Compatibilidade com Filtros

### Categoria Selecionada
Quando o usuário filtra por categoria, a paginação reinicia:
- Buscar contagem de produtos **da categoria**
- Carregar primeiros 50 da categoria
- Infinite scroll continua dentro da categoria

### Busca por Texto
Para busca, temos duas opções:

**Opção A (Recomendada)**: Busca no servidor
- Enviar termo de busca para o Supabase via `ilike`
- Paginação funciona igual

**Opção B**: Busca híbrida
- Se poucos produtos carregados (<200), filtrar localmente
- Se muitos, buscar no servidor

---

## Detalhes Técnicos

### Novos States no Store.tsx
```typescript
const [page, setPage] = useState(0);
const [totalProducts, setTotalProducts] = useState(0);
const [hasMore, setHasMore] = useState(true);
const [loadingMore, setLoadingMore] = useState(false);
const PRODUCTS_PER_PAGE = 50;
```

### Hook de Detecção de Scroll
Usar Intersection Observer para detectar quando o usuário chegou no final:
```typescript
const observerRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && hasMore && !loadingMore) {
        loadMoreProducts();
      }
    },
    { threshold: 0.1 }
  );
  
  if (observerRef.current) observer.observe(observerRef.current);
  return () => observer.disconnect();
}, [hasMore, loadingMore]);
```

### Query Modificada
```typescript
// Contagem total (rápida, sem dados)
const { count } = await supabase
  .from('products')
  .select('id', { count: 'exact', head: true })
  .eq('store_id', storeId)
  .eq('is_available', true);

// Produtos paginados
const { data } = await supabase
  .from('products')
  .select('id, name, ...')
  .eq('store_id', storeId)
  .eq('is_available', true)
  .order('display_order')
  .range(page * PRODUCTS_PER_PAGE, (page + 1) * PRODUCTS_PER_PAGE - 1);
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Store.tsx` | Adicionar paginação, estados, Intersection Observer |
| `src/components/store/LoadMoreIndicator.tsx` | Novo componente de loading |
| `src/components/store/ProductsCounter.tsx` | Contador "X de Y produtos" |

---

## Componente Visual: Contador de Produtos

Exibido acima da grade de produtos:
```text
┌─────────────────────────────────────────────────────────────────┐
│  📦 Exibindo 50 de 10.000 produtos                              │
│  ▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0.5%       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Componente Visual: Loader de Mais Produtos

Exibido no final da lista quando carregando:
```text
┌─────────────────────────────────────────────────────────────────┐
│  ⏳ Carregando mais produtos...                                 │
│  [===      ] (loader animado)                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Reset de Paginação

A paginação deve reiniciar quando:
- Usuário muda de categoria
- Usuário digita na busca
- Usuário limpa filtros

```typescript
useEffect(() => {
  setPage(0);
  setProducts([]);
  setHasMore(true);
  fetchProducts(0); // Recarregar primeira página
}, [selectedCategory, debouncedSearchTerm]);
```

---

## Ordem de Implementação

1. **Adicionar estados de paginação** no `Store.tsx`
2. **Modificar query inicial** para incluir limit/offset
3. **Criar função `loadMoreProducts`** para carregar próximas páginas
4. **Adicionar Intersection Observer** para detectar scroll
5. **Criar componente `LoadMoreIndicator`** para feedback visual
6. **Criar componente `ProductsCounter`** para mostrar progresso
7. **Ajustar lógica de filtros** para resetar paginação
8. **Testar** com diferentes quantidades de produtos

---

## Benefícios Esperados

| Métrica | Antes | Depois |
|---------|-------|--------|
| Dados iniciais | ~5-10MB | ~500KB |
| Tempo de carregamento | 10-30s | 1-3s |
| Produtos na memória | 10.000 | 50-200 |
| Experiência do usuário | Travando | Fluida |

---

## Considerações Extras

1. **Cache de produtos**: Produtos já carregados ficam em memória durante a sessão
2. **Debounce na busca**: Evitar requisições excessivas ao digitar
3. **Skeleton loading**: Mostrar placeholders enquanto carrega
4. **Retry automático**: Se falhar ao carregar mais, permitir tentar novamente
