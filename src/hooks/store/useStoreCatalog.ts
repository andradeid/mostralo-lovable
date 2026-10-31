// Vitrine da loja: busca no servidor, aba "Destaques", produtos por categoria (no servidor),
// "carregar mais" (rolagem infinita) e a ordem dos produtos mostrados.
import { useEffect, useState, useMemo, useCallback, useRef, type MutableRefObject } from 'react';
import { publicSupabase } from '@/integrations/supabase/publicClient';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useToast } from '@/hooks/use-toast';
import { STORE_PRODUCT_COLUMNS, withVariantsAndAddons } from './storeProducts';
import { PRODUCTS_PER_PAGE, type StorePageProduct } from './storePageTypes';

interface Params {
  storeId: string | undefined;
  products: StorePageProduct[];
  setProducts: React.Dispatch<React.SetStateAction<StorePageProduct[]>>;
  loadingProducts: boolean;
  selectedCategory: string | null;
  setSelectedCategory: (c: string | null) => void;
  searchTerm: string;
  totalProducts: number;
  hasMore: boolean;
  setHasMore: (v: boolean) => void;
  currentPageRef: MutableRefObject<number>;
  categoryOrderMap: Record<string, number>;
}

export function useStoreCatalog({
  storeId, products, setProducts, loadingProducts, selectedCategory, setSelectedCategory,
  searchTerm, totalProducts, hasMore, setHasMore, currentPageRef, categoryOrderMap,
}: Params) {
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchResults, setSearchResults] = useState<StorePageProduct[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [categoryProducts, setCategoryProducts] = useState<StorePageProduct[] | null>(null);
  const [loadingCategoryProducts, setLoadingCategoryProducts] = useState(false);
  const [categoryTotal, setCategoryTotal] = useState(0);
  const [categoryHasMore, setCategoryHasMore] = useState(false);
  const categoryPageRef = useRef(0);
  const { toast } = useToast();

  // Debounce da busca para fazer server-side
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Busca server-side quando debouncedSearch muda
  useEffect(() => {
    if (!debouncedSearch.trim() || !storeId) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    const searchServerSide = async () => {
      try {
        const { data, error } = await publicSupabase
          .from('products')
          .select(STORE_PRODUCT_COLUMNS)
          .eq('store_id', storeId)
          .eq('is_available', true)
          .or(`name.ilike.%${debouncedSearch.trim()}%,description.ilike.%${debouncedSearch.trim()}%`)
          .order('display_order')
          .limit(100);

        if (cancelled) return;
        if (error) throw error;

        if (data && data.length > 0) {
          const productsWithVariants = await withVariantsAndAddons(data);
          if (cancelled) return;
          setSearchResults(productsWithVariants);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Erro na busca server-side:', error);
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    };

    searchServerSide();
    return () => { cancelled = true; };
  }, [debouncedSearch, storeId]);

  // Função para carregar mais produtos (infinite scroll)
  const loadMoreProducts = useCallback(async () => {
    if (!storeId || loadingMore) return;

    // Determinar se estamos em modo categoria ou geral
    const isInCategory = selectedCategory && selectedCategory !== 'featured' && searchResults === null;
    const currentHasMore = isInCategory ? categoryHasMore : hasMore;
    const currentTotal = isInCategory ? categoryTotal : totalProducts;

    if (!currentHasMore) return;

    setLoadingMore(true);
    const pageRef = isInCategory ? categoryPageRef : currentPageRef;
    const nextPage = pageRef.current + 1;
    const from = nextPage * PRODUCTS_PER_PAGE;
    const to = from + PRODUCTS_PER_PAGE - 1;

    try {
      let query = publicSupabase
        .from('products')
        .select(STORE_PRODUCT_COLUMNS)
        .eq('store_id', storeId)
        .eq('is_available', true)
        .order('display_order')
        .range(from, to);

      // Adicionar filtro de categoria se necessário
      if (isInCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data: newProducts, error } = await query;

      if (error) throw error;

      if (newProducts && newProducts.length > 0) {
        // Variantes e adicionais dos novos produtos
        const productsWithVariants = await withVariantsAndAddons(newProducts);

        // Adicionar ao array correto sem duplicatas
        if (isInCategory) {
          setCategoryProducts(prev => {
            if (!prev) return productsWithVariants;
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNew = productsWithVariants.filter(p => !existingIds.has(p.id));
            return [...prev, ...uniqueNew];
          });
        } else {
          setProducts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNew = productsWithVariants.filter(p => !existingIds.has(p.id));
            return [...prev, ...uniqueNew];
          });
        }

        pageRef.current = nextPage;

        // Verificar se ainda há mais produtos
        const totalLoaded = (nextPage + 1) * PRODUCTS_PER_PAGE;
        if (isInCategory) {
          setCategoryHasMore(totalLoaded < currentTotal);
        } else {
          setHasMore(totalLoaded < currentTotal);
        }
      } else {
        if (isInCategory) {
          setCategoryHasMore(false);
        } else {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar mais produtos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar mais produtos. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoadingMore(false);
    }
  }, [storeId, loadingMore, hasMore, categoryHasMore, totalProducts, categoryTotal, selectedCategory, searchResults, toast]);

  // Determinar hasMore e loading corretos baseado no contexto atual
  const effectiveHasMore = useMemo(() => {
    if (searchResults !== null) return false; // Busca não usa infinite scroll
    if (selectedCategory && selectedCategory !== 'featured') return categoryHasMore;
    return hasMore;
  }, [searchResults, selectedCategory, categoryHasMore, hasMore]);

  // Hook de infinite scroll
  const loadMoreRef = useInfiniteScroll({
    hasMore: effectiveHasMore,
    isLoading: loadingMore,
    onLoadMore: loadMoreProducts,
  });

  // Verificar se há produtos em destaque
  const hasFeaturedProducts = useMemo(() => {
    return products.some(p => p.is_featured === true);
  }, [products]);

  // Handler para seleção de categoria — seta loading e reset SINCRONICAMENTE
  const handleCategorySelect = useCallback((categoryId: string | null) => {
    setSelectedCategory(categoryId);
    if (categoryId && categoryId !== 'featured') {
      // Reset imediato para evitar flash de produtos locais
      setCategoryProducts(null);
      setCategoryTotal(0);
      setCategoryHasMore(false);
      categoryPageRef.current = 0;
      setLoadingCategoryProducts(true);
    } else {
      setCategoryProducts(null);
      setCategoryTotal(0);
      setCategoryHasMore(false);
      categoryPageRef.current = 0;
      setLoadingCategoryProducts(false);
    }
  }, []);

  // Definir aba inicial baseado em produtos em destaque
  useEffect(() => {
    // Só executa quando os produtos foram carregados pela primeira vez
    // e nenhuma categoria foi selecionada manualmente ainda
    if (products.length > 0 && selectedCategory === null && !loadingProducts) {
      if (hasFeaturedProducts) {
        setSelectedCategory('featured');
      }
    }
  }, [products.length, hasFeaturedProducts, loadingProducts]);

  // Se não houver destaques e estiver na aba featured, voltar para Todas
  useEffect(() => {
    if (!hasFeaturedProducts && selectedCategory === 'featured') {
      setSelectedCategory(null);
    }
  }, [hasFeaturedProducts, selectedCategory]);

  // Buscar produtos da categoria selecionada server-side
  useEffect(() => {
    if (!storeId || !selectedCategory || selectedCategory === 'featured' || searchResults !== null) {
      setCategoryProducts(null);
      setCategoryTotal(0);
      setCategoryHasMore(false);
      categoryPageRef.current = 0;
      return;
    }

    let cancelled = false;
    // loadingCategoryProducts já foi setado no handleCategorySelect
    categoryPageRef.current = 0;

    const fetchCategoryProducts = async () => {
      try {
        // Buscar contagem e produtos da categoria em paralelo
        const [countResult, productsResult] = await Promise.all([
          publicSupabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('store_id', storeId)
            .eq('is_available', true)
            .eq('category_id', selectedCategory),
          publicSupabase
            .from('products')
            .select(STORE_PRODUCT_COLUMNS)
            .eq('store_id', storeId)
            .eq('is_available', true)
            .eq('category_id', selectedCategory)
            .order('display_order')
            .range(0, PRODUCTS_PER_PAGE - 1)
        ]);

        if (cancelled) return;

        const total = countResult.count || 0;
        setCategoryTotal(total);
        setCategoryHasMore(PRODUCTS_PER_PAGE < total);

        if (productsResult.data && productsResult.data.length > 0) {
          const productsWithVariants = await withVariantsAndAddons(productsResult.data);
          if (cancelled) return;
          setCategoryProducts(productsWithVariants);
        } else {
          setCategoryProducts([]);
        }
      } catch (error) {
        console.error('Erro ao buscar produtos da categoria:', error);
        if (!cancelled) setCategoryProducts([]);
      } finally {
        if (!cancelled) setLoadingCategoryProducts(false);
      }
    };

    fetchCategoryProducts();
    return () => { cancelled = true; };
  }, [selectedCategory, storeId, searchResults]);

  const getProductsByCategory = (categoryId: string | null) => {
    // Se há busca ativa, usar resultados do server-side
    const sourceProducts = searchResults !== null ? searchResults : products;

    // Aba "Destaques" selecionada
    if (categoryId === 'featured') {
      const featuredProducts = sourceProducts.filter(p => p.is_featured === true);
      return featuredProducts.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }

    // Categoria específica selecionada - usar produtos buscados server-side
    if (categoryId && searchResults === null) {
      // Se categoryProducts é null, ainda está carregando (retorna vazio, loader será exibido)
      if (categoryProducts === null) {
        return [];
      }
      const copy = [...categoryProducts];
      return copy.sort((a, b) => {
        const prodOrderA = a.display_order ?? 0;
        const prodOrderB = b.display_order ?? 0;
        if (prodOrderA !== prodOrderB) return prodOrderA - prodOrderB;
        return a.name.localeCompare(b.name);
      });
    }

    // Filtrar de busca quando há searchResults + categoria
    if (categoryId && searchResults !== null) {
      const filtered = searchResults.filter(p => p.category_id === categoryId);
      return filtered.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }

    // "Todas" - usar produtos carregados normalmente
    const copy = [...sourceProducts];

    // Funções auxiliares para obter ordem
    const getCategoryOrder = (catId?: string) =>
      catId ? (categoryOrderMap[catId] ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;

    return copy.sort((a, b) => {
      const catOrderA = getCategoryOrder(a.category_id);
      const catOrderB = getCategoryOrder(b.category_id);

      if (catOrderA !== catOrderB) return catOrderA - catOrderB;

      const prodOrderA = a.display_order ?? 0;
      const prodOrderB = b.display_order ?? 0;

      if (prodOrderA !== prodOrderB) return prodOrderA - prodOrderB;

      return a.name.localeCompare(b.name);
    });
  };

  const getRelatedProducts = (currentProduct: StorePageProduct) => {
    return products
      .filter(p => p.id !== currentProduct.id && p.category_id === currentProduct.category_id)
      .slice(0, 4);
  };

  return {
    isSearching, searchResults, loadingMore, categoryProducts, loadingCategoryProducts, categoryTotal,
    effectiveHasMore, loadMoreRef, hasFeaturedProducts, handleCategorySelect,
    getProductsByCategory, getRelatedProducts,
  };
}
