// Carga da tela de produtos do painel: produtos paginados, categorias, contadores,
// categorias de adicionais e busca com debounce. Código movido da ProductsPage sem mudança.
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { organizeByCategory as groupByCategory } from '@/lib/products/productsList';
import type { AddonCategoryInfo, CategoryData, ProductData } from './productsPageTypes';

export const PAGE_SIZE = 100;

interface Params {
  user: unknown;
  validatedStoreId: string | null;
  storeAccessLoading: boolean;
  hasAccess: boolean;
}

export function useProductsCatalog({ user, validatedStoreId, storeAccessLoading, hasAccess }: Params) {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Paginação
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [activeProductsCount, setActiveProductsCount] = useState(0);
  const [allProducts, setAllProducts] = useState<ProductData[]>([]);
  const [allAddonCategories, setAllAddonCategories] = useState<AddonCategoryInfo[]>([]);

  const { toast } = useToast();

  // Cache de categorias para evitar re-fetch desnecessário
  const categoriesCacheRef = useRef<CategoryData[]>([]);

  const fetchCategoriesAndProducts = async (page: number = 0, append: boolean = false) => {
    if (!user || !validatedStoreId) return;

    if (page === 0) {
      setLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const storeId = validatedStoreId;
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Construir query de produtos com apenas colunas necessárias
      let productsQuery = supabase
        .from('products')
        .select('id, name, description, price, image_url, image_gallery, button_text, is_available, is_featured, show_in_menu, display_order, created_at, updated_at, store_id, category_id, is_on_offer, original_price, offer_price, track_stock, stock_quantity, stock_alert_threshold')
        .eq('store_id', storeId);

      if (debouncedSearch.trim()) {
        productsQuery = productsQuery.or(`name.ilike.%${debouncedSearch.trim()}%,description.ilike.%${debouncedSearch.trim()}%`);
      }

      // Na primeira página: executar todas as queries em PARALELO
      if (page === 0) {
        const [productsResult, categoriesResult, totalCountResult, activeCountResult, addonCatsResult] = await Promise.all([
          productsQuery.order('display_order', { ascending: true }).range(from, to),
          supabase
            .from('categories')
            .select('id, name, description, display_order, is_active, store_id')
            .eq('store_id', storeId)
            .eq('is_active', true)
            .order('display_order', { ascending: true }),
          supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('store_id', storeId),
          supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('store_id', storeId)
            .eq('is_available', true),
          supabase
            .from('addon_categories')
            .select('id, name')
            .eq('store_id', storeId)
            .eq('is_active', true)
            .order('name'),
        ]);

        // Cachear categorias de adicionais
        if (addonCatsResult.data) {
          setAllAddonCategories(addonCatsResult.data as AddonCategoryInfo[]);
        }

        if (productsResult.error) throw productsResult.error;
        if (categoriesResult.error) {
          console.error('Erro ao buscar categorias:', categoriesResult.error);
        }

        const newProducts = (productsResult.data || []) as ProductData[];

        // Buscar adicionais dos produtos carregados
        if (newProducts.length > 0) {
          const productIds = newProducts.map(p => p.id);
          const { data: paData } = await supabase
            .from('product_addons')
            .select('product_id, addon_id')
            .in('product_id', productIds);

          if (paData && paData.length > 0) {
            const addonIds = [...new Set(paData.map(pa => pa.addon_id))];
            const { data: addonsData } = await supabase
              .from('addons')
              .select('id, name, category_id')
              .in('id', addonIds);

            // Buscar nomes das categorias de adicionais
            const categoryIds = [...new Set((addonsData || []).map(a => a.category_id).filter(Boolean))] as string[];
            let addonCategoriesMap: Record<string, string> = {};
            if (categoryIds.length > 0) {
              const { data: acData } = await supabase
                .from('addon_categories')
                .select('id, name')
                .in('id', categoryIds);
              acData?.forEach(ac => { addonCategoriesMap[ac.id] = ac.name; });
            }

            // Mapear addon_id -> { category_name, category_id }
            const addonToCategoryName: Record<string, string> = {};
            const addonToCategoryId: Record<string, string> = {};
            addonsData?.forEach(a => {
              if (a.category_id && addonCategoriesMap[a.category_id]) {
                addonToCategoryName[a.id] = addonCategoriesMap[a.category_id];
                addonToCategoryId[a.id] = a.category_id;
              } else {
                addonToCategoryName[a.id] = a.name;
              }
            });

            // Atribuir nomes e IDs de categorias de adicionais a cada produto
            const productAddonNameMap: Record<string, Set<string>> = {};
            const productAddonIdMap: Record<string, Set<string>> = {};
            paData.forEach(pa => {
              if (!productAddonNameMap[pa.product_id]) productAddonNameMap[pa.product_id] = new Set();
              if (!productAddonIdMap[pa.product_id]) productAddonIdMap[pa.product_id] = new Set();
              const catName = addonToCategoryName[pa.addon_id];
              const catId = addonToCategoryId[pa.addon_id];
              if (catName) productAddonNameMap[pa.product_id].add(catName);
              if (catId) productAddonIdMap[pa.product_id].add(catId);
            });

            newProducts.forEach(p => {
              p.addon_category_names = productAddonNameMap[p.id] ? [...productAddonNameMap[p.id]] : [];
              p.addon_category_ids = productAddonIdMap[p.id] ? [...productAddonIdMap[p.id]] : [];
            });
          }
        }

        setAllProducts(newProducts);
        setCurrentPage(0);
        setHasMoreProducts(newProducts.length === PAGE_SIZE);
        setTotalProductsCount(totalCountResult.count || 0);
        setActiveProductsCount(activeCountResult.count || 0);

        // Cachear categorias
        const cats = (categoriesResult.data || []) as CategoryData[];
        categoriesCacheRef.current = cats;

        // Organizar produtos por categoria
        organizeByCategory(newProducts, cats, storeId);

      } else {
        // Páginas subsequentes: apenas buscar mais produtos
        const { data, error } = await productsQuery
          .order('display_order', { ascending: true })
          .range(from, to);

        if (error) throw error;

        const newProducts = (data || []) as ProductData[];

        // Buscar adicionais dos novos produtos
        if (newProducts.length > 0) {
          const productIds = newProducts.map(p => p.id);
          const { data: paData } = await supabase
            .from('product_addons')
            .select('product_id, addon_id')
            .in('product_id', productIds);

          if (paData && paData.length > 0) {
            const addonIds = [...new Set(paData.map(pa => pa.addon_id))];
            const { data: addonsData } = await supabase
              .from('addons')
              .select('id, name, category_id')
              .in('id', addonIds);

            const categoryIds = [...new Set((addonsData || []).map(a => a.category_id).filter(Boolean))] as string[];
            let addonCategoriesMap: Record<string, string> = {};
            if (categoryIds.length > 0) {
              const { data: acData } = await supabase
                .from('addon_categories')
                .select('id, name')
                .in('id', categoryIds);
              acData?.forEach(ac => { addonCategoriesMap[ac.id] = ac.name; });
            }

            const addonToCategoryName: Record<string, string> = {};
            addonsData?.forEach(a => {
              if (a.category_id && addonCategoriesMap[a.category_id]) {
                addonToCategoryName[a.id] = addonCategoriesMap[a.category_id];
              } else {
                addonToCategoryName[a.id] = a.name;
              }
            });

            const productAddonMap: Record<string, Set<string>> = {};
            paData.forEach(pa => {
              if (!productAddonMap[pa.product_id]) productAddonMap[pa.product_id] = new Set();
              const catName = addonToCategoryName[pa.addon_id];
              if (catName) productAddonMap[pa.product_id].add(catName);
            });

            newProducts.forEach(p => {
              p.addon_category_names = productAddonMap[p.id] ? [...productAddonMap[p.id]] : [];
            });
          }
        }

        const updatedProducts = append ? [...allProducts, ...newProducts] : newProducts;
        setAllProducts(updatedProducts);
        setCurrentPage(page);
        setHasMoreProducts(newProducts.length === PAGE_SIZE);

        // Reutilizar categorias do cache
        organizeByCategory(updatedProducts, categoriesCacheRef.current, storeId);
      }

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Função auxiliar para organizar produtos por categoria
  const organizeByCategory = (products: ProductData[], cats: CategoryData[], storeId: string) => {
    setCategories(groupByCategory(products, cats, storeId));
  };

  const loadMoreProducts = () => {
    if (!isLoadingMore && hasMoreProducts) {
      fetchCategoriesAndProducts(currentPage + 1, true);
    }
  };

  // Debounce da busca para evitar requisições a cada tecla
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 4000);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Recarregar produtos quando a busca (debounced) muda
  useEffect(() => {
    if (validatedStoreId && !storeAccessLoading && hasAccess) {
      setCurrentPage(0);
      setHasMoreProducts(true);
      setAllProducts([]);
      fetchCategoriesAndProducts(0, false);
    }
  }, [validatedStoreId, storeAccessLoading, hasAccess, debouncedSearch]);

  return {
    toast,
    categories,
    setCategories,
    loading,
    searchTerm,
    setSearchTerm,
    debouncedSearch,
    hasMoreProducts,
    isLoadingMore,
    totalProductsCount,
    activeProductsCount,
    allProducts,
    setAllProducts,
    allAddonCategories,
    fetchCategoriesAndProducts,
    loadMoreProducts,
  };
}

export type FetchCategoriesAndProducts = ReturnType<typeof useProductsCatalog>['fetchCategoriesAndProducts'];
