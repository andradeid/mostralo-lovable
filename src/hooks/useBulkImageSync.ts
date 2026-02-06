import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type SyncMode = 'all_without_image' | 'visible_without_image' | 'selected_category';

export interface BulkSyncProgress {
  current: number;
  total: number;
  currentBatch: number;
  totalBatches: number;
  currentProduct: string;
  successCount: number;
  failCount: number;
  skippedCount: number;
}

export interface BulkSyncOptions {
  mode: SyncMode;
  categoryId?: string;
  batchSize?: number;
  delayBetweenRequests?: number;
}

interface ProductToSync {
  id: string;
  name: string;
  category_id: string | null;
}

export function useBulkImageSync(storeId: string | null) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<BulkSyncProgress>({
    current: 0,
    total: 0,
    currentBatch: 0,
    totalBatches: 0,
    currentProduct: '',
    successCount: 0,
    failCount: 0,
    skippedCount: 0,
  });
  
  const cancelRef = useRef(false);
  const skipRef = useRef(false);
  const { toast } = useToast();

  const fetchProductsToSync = useCallback(async (options: BulkSyncOptions): Promise<ProductToSync[]> => {
    if (!storeId) return [];

    let query = supabase
      .from('products')
      .select('id, name, category_id')
      .eq('store_id', storeId)
      .or('image_url.is.null,image_url.eq.');

    if (options.mode === 'visible_without_image') {
      query = query.eq('is_available', true).eq('show_in_menu', true);
    } else if (options.mode === 'selected_category' && options.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }

    const { data, error } = await query.order('name');

    if (error) {
      console.error('[useBulkImageSync] Error fetching products:', error);
      return [];
    }

    return data || [];
  }, [storeId]);

  const searchImageForProduct = useCallback(async (productName: string): Promise<string | null> => {
    if (!storeId) return null;

    try {
      const { data, error } = await supabase.functions.invoke('search-product-image', {
        body: { productName, storeId },
      });

      if (error) {
        console.error('[useBulkImageSync] Edge function error:', error);
        return null;
      }

      if (data?.success && data?.imageUrl) {
        return data.imageUrl;
      }

      return null;
    } catch (err) {
      console.error('[useBulkImageSync] Exception:', err);
      return null;
    }
  }, [storeId]);

  const updateProductImage = useCallback(async (productId: string, imageUrl: string): Promise<boolean> => {
    const { error } = await supabase
      .from('products')
      .update({ image_url: imageUrl })
      .eq('id', productId);

    return !error;
  }, []);

  const startSync = useCallback(async (options: BulkSyncOptions) => {
    if (!storeId || isRunning) return;

    cancelRef.current = false;
    skipRef.current = false;
    setIsRunning(true);

    const batchSize = options.batchSize || 10;
    const delay = options.delayBetweenRequests || 1000;

    try {
      // Fetch products to sync
      const products = await fetchProductsToSync(options);

      if (products.length === 0) {
        toast({
          title: 'Nenhum produto encontrado',
          description: 'Não há produtos sem imagem para sincronizar com os filtros selecionados.',
        });
        setIsRunning(false);
        return;
      }

      const totalBatches = Math.ceil(products.length / batchSize);

      setProgress({
        current: 0,
        total: products.length,
        currentBatch: 1,
        totalBatches,
        currentProduct: '',
        successCount: 0,
        failCount: 0,
        skippedCount: 0,
      });

      let successCount = 0;
      let failCount = 0;
      let skippedCount = 0;

      for (let i = 0; i < products.length; i++) {
        // Check for cancellation
        if (cancelRef.current) {
          toast({
            title: 'Sincronização cancelada',
            description: `Processados: ${i}/${products.length}. Sucesso: ${successCount}, Falhas: ${failCount}`,
          });
          break;
        }

        // Check for skip
        if (skipRef.current) {
          skippedCount = products.length - i;
          toast({
            title: 'Sincronização pulada',
            description: `Processados: ${i}/${products.length}. Sucesso: ${successCount}, Falhas: ${failCount}, Pulados: ${skippedCount}`,
          });
          break;
        }

        const product = products[i];
        const currentBatch = Math.floor(i / batchSize) + 1;

        setProgress(prev => ({
          ...prev,
          current: i + 1,
          currentBatch,
          currentProduct: product.name,
        }));

        // Search for image
        const imageUrl = await searchImageForProduct(product.name);

        if (imageUrl) {
          const updated = await updateProductImage(product.id, imageUrl);
          if (updated) {
            successCount++;
          } else {
            failCount++;
          }
        } else {
          failCount++;
        }

        setProgress(prev => ({
          ...prev,
          successCount,
          failCount,
          skippedCount,
        }));

        // Delay between requests to avoid rate limiting
        if (i < products.length - 1 && !cancelRef.current && !skipRef.current) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      if (!cancelRef.current && !skipRef.current) {
        toast({
          title: 'Sincronização concluída!',
          description: `Total: ${products.length}. Sucesso: ${successCount}, Falhas: ${failCount}`,
        });
      }

    } catch (error) {
      console.error('[useBulkImageSync] Error:', error);
      toast({
        title: 'Erro na sincronização',
        description: 'Ocorreu um erro durante a sincronização de imagens.',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  }, [storeId, isRunning, fetchProductsToSync, searchImageForProduct, updateProductImage, toast]);

  const cancelSync = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const skipSync = useCallback(() => {
    skipRef.current = true;
  }, []);

  const getProductsCount = useCallback(async (options: BulkSyncOptions): Promise<number> => {
    const products = await fetchProductsToSync(options);
    return products.length;
  }, [fetchProductsToSync]);

  return {
    isRunning,
    progress,
    startSync,
    cancelSync,
    skipSync,
    getProductsCount,
  };
}
