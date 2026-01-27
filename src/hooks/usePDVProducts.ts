import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useInfiniteScroll } from './useInfiniteScroll';
import { useDebouncedCallback } from './useDebouncedCallback';

export interface PDVProduct {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  is_available: boolean;
  category_id: string | null;
  categories?: {
    name: string;
  };
}

interface UsePDVProductsOptions {
  storeId: string | null;
  pageSize?: number;
  externalSearchTerm?: string;
}

interface UsePDVProductsReturn {
  products: PDVProduct[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  totalProducts: number;
  loadedCount: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (categoryId: string | null) => void;
  loadMoreRef: (node: HTMLDivElement | null) => void;
  isSearching: boolean;
}

const PAGE_SIZE = 50;

export function usePDVProducts({ storeId, pageSize = PAGE_SIZE, externalSearchTerm = '' }: UsePDVProductsOptions): UsePDVProductsReturn {
  const [products, setProducts] = useState<PDVProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  
  // Filtros
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Usa o termo externo se fornecido, senão usa o interno
  const searchTerm = externalSearchTerm || internalSearchTerm;
  
  // Refs para controle de paginação
  const currentPageRef = useRef(0);
  const isFetchingRef = useRef(false);

  // Debounce da busca (300ms)
  const debouncedSetSearch = useDebouncedCallback((term: string) => {
    setDebouncedSearchTerm(term);
    setIsSearching(false);
  }, 300);

  // Quando o usuário digita, marca como buscando e debounce
  const handleSearchChange = useCallback((term: string) => {
    setInternalSearchTerm(term);
    if (term !== debouncedSearchTerm) {
      setIsSearching(true);
    }
    debouncedSetSearch(term);
  }, [debouncedSetSearch, debouncedSearchTerm]);

  // Sincroniza termo externo com debounce
  useEffect(() => {
    if (externalSearchTerm !== undefined) {
      setIsSearching(true);
      debouncedSetSearch(externalSearchTerm);
    }
  }, [externalSearchTerm, debouncedSetSearch]);

  // Fetch total count
  const fetchTotalCount = useCallback(async () => {
    if (!storeId) return 0;

    let query = supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('is_available', true);

    if (debouncedSearchTerm) {
      query = query.ilike('name', `%${debouncedSearchTerm}%`);
    }

    if (selectedCategory) {
      query = query.eq('category_id', selectedCategory);
    }

    const { count } = await query;
    return count || 0;
  }, [storeId, debouncedSearchTerm, selectedCategory]);

  // Fetch products (paginado)
  const fetchProducts = useCallback(async (page: number, append: boolean = false) => {
    if (!storeId || isFetchingRef.current) return;

    isFetchingRef.current = true;
    
    if (page === 0) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          description,
          image_url,
          is_available,
          category_id,
          categories (name)
        `)
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

      const { data, error } = await query
        .order('name')
        .range(from, to);

      if (error) throw error;

      const newProducts = (data || []) as PDVProduct[];
      
      if (append && page > 0) {
        setProducts(prev => [...prev, ...newProducts]);
      } else {
        setProducts(newProducts);
      }

      // Verificar se há mais produtos
      setHasMore(newProducts.length === pageSize);
      currentPageRef.current = page;

      // Buscar total apenas na primeira página ou quando filtros mudam
      if (page === 0) {
        const total = await fetchTotalCount();
        setTotalProducts(total);
      }

    } catch (error) {
      console.error('[usePDVProducts] Erro ao buscar produtos:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [storeId, debouncedSearchTerm, selectedCategory, pageSize, fetchTotalCount]);

  // Load more para infinite scroll
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isFetchingRef.current) {
      fetchProducts(currentPageRef.current + 1, true);
    }
  }, [fetchProducts, isLoadingMore, hasMore]);

  // Hook de infinite scroll
  const loadMoreRef = useInfiniteScroll({
    hasMore,
    isLoading: isLoadingMore,
    onLoadMore: loadMore,
    rootMargin: '100px',
  });

  // Reset e refetch quando filtros mudam
  useEffect(() => {
    currentPageRef.current = 0;
    setHasMore(true);
    fetchProducts(0, false);
  }, [debouncedSearchTerm, selectedCategory, storeId]);

  return {
    products,
    isLoading,
    isLoadingMore,
    hasMore,
    totalProducts,
    loadedCount: products.length,
    searchTerm,
    setSearchTerm: handleSearchChange,
    selectedCategory,
    setSelectedCategory,
    loadMoreRef,
    isSearching,
  };
}
