
# Plano de Correção: Infinite Scroll não Funciona

## Problema Identificado

O infinite scroll foi implementado mas não está funcionando por **3 razões principais**:

### 1. Bug no Hook `useInfiniteScroll`
O `IntersectionObserver` é criado dentro de um `useEffect` que depende de `handleIntersection`. Quando o callback muda (devido às dependências `hasMore`, `isLoading`, `onLoadMore`), o observer é recriado, mas nesse momento o `observerRef.current` pode ser `null` porque o componente pode não ter re-renderizado ainda.

**Solução**: Usar um padrão diferente com `useCallback` para o ref, garantindo que o observer seja criado/atualizado quando o elemento realmente existe.

### 2. Condição Restritiva Demais
O trigger do infinite scroll só aparece quando:
- `!searchTerm` (sem busca)
- `!selectedCategory` (nenhuma categoria selecionada)

Isso significa que ao abrir a loja, se o usuário não fizer nada, o infinite scroll deveria funcionar. Mas a condição `!selectedCategory` pode estar causando problemas dependendo do estado inicial.

**Solução**: Manter o trigger sempre visível quando há mais produtos para carregar.

### 3. Elemento Trigger Muito Pequeno
O elemento trigger tem apenas `h-4` (16px), que pode não ser suficiente para o `IntersectionObserver` detectar, especialmente com `threshold: 0.1`.

**Solução**: Aumentar a altura do trigger ou usar `rootMargin` maior.

---

## Correções Propostas

### Arquivo: `src/hooks/useInfiniteScroll.ts`

```typescript
import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  rootMargin?: string;
}

export function useInfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 0.1,
  rootMargin = '200px', // Aumentar para detectar mais cedo
}: UseInfiniteScrollOptions) {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Usar refs para valores que mudam frequentemente
  const hasMoreRef = useRef(hasMore);
  const isLoadingRef = useRef(isLoading);
  const onLoadMoreRef = useRef(onLoadMore);
  
  // Atualizar refs quando props mudam
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);
  
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);
  
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  // Callback ref para garantir que o observer é criado quando o elemento existe
  const setRef = useCallback((node: HTMLDivElement | null) => {
    // Limpar observer anterior se existir
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    targetRef.current = node;
    
    if (!node) return;
    
    // Criar novo observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMoreRef.current && !isLoadingRef.current) {
          onLoadMoreRef.current();
        }
      },
      { threshold, rootMargin }
    );
    
    observerRef.current.observe(node);
  }, [threshold, rootMargin]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return setRef;
}
```

### Arquivo: `src/pages/Store.tsx`

Remover a condição restritiva e sempre mostrar o trigger quando há mais produtos:

```tsx
{/* Infinite scroll trigger - sempre visível quando há mais produtos */}
{hasMore && (
  <>
    <div ref={loadMoreRef} className="h-10" />
    <LoadMoreIndicator isLoading={loadingMore} hasMore={hasMore} />
  </>
)}
```

Aplicar em todos os layouts (grid, carousel, list).

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useInfiniteScroll.ts` | Corrigir hook para usar callback ref e refs para valores mutáveis |
| `src/pages/Store.tsx` | Remover condições restritivas e aumentar altura do trigger |

---

## Benefícios da Correção

1. **Observer sempre funciona**: Usando callback ref, garantimos que o observer é criado quando o elemento existe
2. **Valores sempre atualizados**: Usando refs para `hasMore`, `isLoading` e `onLoadMore`, evitamos stale closures
3. **Detecção antecipada**: Com `rootMargin: '200px'` e `h-10`, o carregamento começa antes do usuário chegar ao fim
4. **Funciona com filtros**: O infinite scroll continuará funcionando quando categoria ou busca estiver ativa
