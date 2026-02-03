import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  image_gallery: string[] | null;
  button_text: string | null;
  is_available: boolean;
  is_featured: boolean | null;
  show_in_menu: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  store_id: string;
  category_id: string | null;
  is_on_offer: boolean;
  original_price: number | null;
  offer_price: number | null;
  track_stock: boolean | null;
  stock_quantity: number | null;
  stock_alert_threshold: number | null;
  categories?: {
    name: string;
  };
}

export interface AdminCategory {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  store_id: string;
}

interface UseAdminProductsOptions {
  storeId: string | null;
  pageSize?: number;
}

interface ProductFilters {
  search: string;
  categoryId: string | null;
  availability: 'all' | 'available' | 'unavailable';
  stockStatus: 'all' | 'out_of_stock' | 'low_stock' | 'in_stock';
  priceRange: [number, number] | null;
  hasImage: 'all' | 'with_image' | 'without_image';
  featured: 'all' | 'featured' | 'not_featured';
  promotion: 'all' | 'on_sale' | 'regular';
}

const DEFAULT_PAGE_SIZE = 50;

export function useAdminProducts({ storeId, pageSize = DEFAULT_PAGE_SIZE }: UseAdminProductsOptions) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    categoryId: null,
    availability: 'all',
    stockStatus: 'all',
    priceRange: null,
    hasImage: 'all',
    featured: 'all',
    promotion: 'all',
  });

  const { toast } = useToast();

  // Buscar total de produtos com filtros aplicados
  const fetchTotalCount = useCallback(async () => {
    if (!storeId) return 0;

    let query = supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId);

    // Aplicar filtros
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters.availability === 'available') {
      query = query.eq('is_available', true);
    } else if (filters.availability === 'unavailable') {
      query = query.eq('is_available', false);
    }
    if (filters.promotion === 'on_sale') {
      query = query.eq('is_on_offer', true);
    } else if (filters.promotion === 'regular') {
      query = query.eq('is_on_offer', false);
    }
    if (filters.featured === 'featured') {
      query = query.eq('is_featured', true);
    } else if (filters.featured === 'not_featured') {
      query = query.or('is_featured.is.null,is_featured.eq.false');
    }

    const { count, error } = await query;
    if (error) {
      console.error('[useAdminProducts] Erro ao buscar total:', error);
      return 0;
    }
    return count || 0;
  }, [storeId, filters]);

  // Buscar categorias
  const fetchCategories = useCallback(async () => {
    if (!storeId) return;

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('[useAdminProducts] Erro ao buscar categorias:', error);
      return;
    }

    setCategories(data || []);
  }, [storeId]);

  // Buscar produtos paginados
  const fetchProducts = useCallback(async (page: number, append: boolean = false) => {
    if (!storeId) return;

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
          *,
          categories (name)
        `)
        .eq('store_id', storeId);

      // Aplicar filtros
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters.availability === 'available') {
        query = query.eq('is_available', true);
      } else if (filters.availability === 'unavailable') {
        query = query.eq('is_available', false);
      }
      if (filters.promotion === 'on_sale') {
        query = query.eq('is_on_offer', true);
      } else if (filters.promotion === 'regular') {
        query = query.eq('is_on_offer', false);
      }
      if (filters.featured === 'featured') {
        query = query.eq('is_featured', true);
      } else if (filters.featured === 'not_featured') {
        query = query.or('is_featured.is.null,is_featured.eq.false');
      }

      const { data, error } = await query
        .order('display_order', { ascending: true })
        .order('name', { ascending: true })
        .range(from, to);

      if (error) throw error;

      const newProducts = (data || []) as AdminProduct[];

      if (append && page > 0) {
        setProducts(prev => [...prev, ...newProducts]);
      } else {
        setProducts(newProducts);
      }

      setHasMore(newProducts.length === pageSize);
      setCurrentPage(page);

      // Buscar total apenas na primeira página
      if (page === 0) {
        const total = await fetchTotalCount();
        setTotalProducts(total);
      }

    } catch (error) {
      console.error('[useAdminProducts] Erro ao buscar produtos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar produtos.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [storeId, filters, pageSize, fetchTotalCount, toast]);

  // Carregar mais produtos
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchProducts(currentPage + 1, true);
    }
  }, [fetchProducts, isLoadingMore, hasMore, currentPage]);

  // Ir para página específica
  const goToPage = useCallback((page: number) => {
    fetchProducts(page, false);
  }, [fetchProducts]);

  // Atualizar filtros e resetar paginação
  const updateFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Resetar para primeira página quando filtros mudam
  useEffect(() => {
    setCurrentPage(0);
    setHasMore(true);
    fetchProducts(0, false);
  }, [filters.search, filters.categoryId, filters.availability, filters.stockStatus, 
      filters.hasImage, filters.featured, filters.promotion, storeId]);

  // Buscar categorias inicialmente
  useEffect(() => {
    if (storeId) {
      fetchCategories();
    }
  }, [storeId, fetchCategories]);

  // Filtros client-side para estoque e imagem (não podem ser feitos server-side facilmente)
  const filteredProducts = useMemo(() => {
    let result = products;

    // Filtro de estoque (client-side)
    if (filters.stockStatus !== 'all') {
      result = result.filter(p => {
        if (!p.track_stock) return filters.stockStatus === 'in_stock';
        if (filters.stockStatus === 'out_of_stock') return (p.stock_quantity || 0) === 0;
        if (filters.stockStatus === 'low_stock') {
          const threshold = p.stock_alert_threshold || 5;
          return (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= threshold;
        }
        if (filters.stockStatus === 'in_stock') {
          const threshold = p.stock_alert_threshold || 5;
          return (p.stock_quantity || 0) > threshold;
        }
        return true;
      });
    }

    // Filtro de imagem (client-side)
    if (filters.hasImage === 'with_image') {
      result = result.filter(p => p.image_url);
    } else if (filters.hasImage === 'without_image') {
      result = result.filter(p => !p.image_url);
    }

    // Filtro de preço (client-side)
    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      result = result.filter(p => {
        const price = p.is_on_offer && p.offer_price ? p.offer_price : p.price;
        return price >= min && price <= max;
      });
    }

    return result;
  }, [products, filters.stockStatus, filters.hasImage, filters.priceRange]);

  // Produtos agrupados por categoria
  const productsByCategory = useMemo(() => {
    const grouped: Record<string, AdminProduct[]> = {};
    
    // Inicializar categorias
    categories.forEach(cat => {
      grouped[cat.id] = [];
    });
    grouped['uncategorized'] = [];

    // Agrupar produtos
    filteredProducts.forEach(product => {
      const catId = product.category_id || 'uncategorized';
      if (!grouped[catId]) grouped[catId] = [];
      grouped[catId].push(product);
    });

    return grouped;
  }, [filteredProducts, categories]);

  // Refresh
  const refresh = useCallback(() => {
    setCurrentPage(0);
    setHasMore(true);
    fetchProducts(0, false);
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  return {
    products: filteredProducts,
    productsByCategory,
    categories,
    isLoading,
    isLoadingMore,
    hasMore,
    totalProducts,
    loadedCount: products.length,
    currentPage,
    pageSize,
    filters,
    updateFilters,
    loadMore,
    goToPage,
    refresh,
  };
}
