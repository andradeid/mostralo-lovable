import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImageSearchResult {
  productIndex: number;
  productName: string;
  imageUrl: string | null;
  success: boolean;
  error?: string;
}

interface UseImageSearchReturn {
  isSearching: boolean;
  progress: {
    current: number;
    total: number;
    currentBatch: number;
    totalBatches: number;
    currentProduct: string;
    successCount: number;
    failCount: number;
  };
  searchImages: (products: { nome: string; laboratorio?: string }[], storeId: string) => Promise<ImageSearchResult[]>;
  cancelSearch: () => void;
  isConfigured: boolean;
  checkConfiguration: () => Promise<boolean>;
}

const BATCH_SIZE = 50;
const DELAY_BETWEEN_BATCHES = 500; // ms

export function useImageSearch(): UseImageSearchReturn {
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const cancelRef = useRef(false);
  
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    currentBatch: 0,
    totalBatches: 0,
    currentProduct: '',
    successCount: 0,
    failCount: 0,
  });

  const checkConfiguration = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('image_search_config' as any)
        .select('is_active, api_key, search_engine_id')
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setIsConfigured(false);
        return false;
      }

      const config = data as any;
      const configured = !!(config.api_key && config.search_engine_id);
      setIsConfigured(configured);
      return configured;
    } catch {
      setIsConfigured(false);
      return false;
    }
  }, []);

  const searchSingleImage = async (
    productName: string,
    laboratory: string | undefined,
    storeId: string
  ): Promise<{ imageUrl: string | null; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('search-product-image', {
        body: {
          productName,
          laboratory,
          storeId,
        },
      });

      if (error) {
        console.error('[useImageSearch] Edge function error:', error);
        return { imageUrl: null, error: error.message };
      }

      if (!data.success) {
        return { imageUrl: null, error: data.error };
      }

      return { imageUrl: data.imageUrl };
    } catch (err: any) {
      console.error('[useImageSearch] Request error:', err);
      return { imageUrl: null, error: err.message || 'Erro desconhecido' };
    }
  };

  const searchImages = useCallback(async (
    products: { nome: string; laboratorio?: string }[],
    storeId: string
  ): Promise<ImageSearchResult[]> => {
    if (products.length === 0) {
      return [];
    }

    setIsSearching(true);
    cancelRef.current = false;

    const results: ImageSearchResult[] = [];
    const totalBatches = Math.ceil(products.length / BATCH_SIZE);

    setProgress({
      current: 0,
      total: products.length,
      currentBatch: 0,
      totalBatches,
      currentProduct: '',
      successCount: 0,
      failCount: 0,
    });

    try {
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        if (cancelRef.current) {
          console.log('[useImageSearch] Busca cancelada pelo usuário');
          break;
        }

        const start = batchIndex * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, products.length);
        const batch = products.slice(start, end);

        setProgress(prev => ({
          ...prev,
          currentBatch: batchIndex + 1,
        }));

        // Process batch in parallel (max 5 concurrent requests)
        const batchPromises = batch.map(async (product, indexInBatch) => {
          if (cancelRef.current) {
            return null;
          }

          const globalIndex = start + indexInBatch;
          
          setProgress(prev => ({
            ...prev,
            current: globalIndex + 1,
            currentProduct: product.nome.substring(0, 40) + (product.nome.length > 40 ? '...' : ''),
          }));

          const result = await searchSingleImage(product.nome, product.laboratorio, storeId);
          
          const searchResult: ImageSearchResult = {
            productIndex: globalIndex,
            productName: product.nome,
            imageUrl: result.imageUrl,
            success: !!result.imageUrl,
            error: result.error,
          };

          setProgress(prev => ({
            ...prev,
            successCount: prev.successCount + (result.imageUrl ? 1 : 0),
            failCount: prev.failCount + (result.imageUrl ? 0 : 1),
          }));

          return searchResult;
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.filter((r): r is ImageSearchResult => r !== null));

        // Delay between batches to avoid rate limiting
        if (batchIndex < totalBatches - 1 && !cancelRef.current) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
      }

      if (!cancelRef.current) {
        toast({
          title: 'Busca de imagens concluída',
          description: `${results.filter(r => r.success).length} de ${products.length} imagens encontradas`,
        });
      }

      return results;
    } catch (error: any) {
      console.error('[useImageSearch] Error:', error);
      toast({
        title: 'Erro na busca de imagens',
        description: error.message || 'Ocorreu um erro durante a busca',
        variant: 'destructive',
      });
      return results;
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  const cancelSearch = useCallback(() => {
    cancelRef.current = true;
    toast({
      title: 'Busca cancelada',
      description: 'A busca de imagens foi interrompida',
    });
  }, [toast]);

  return {
    isSearching,
    progress,
    searchImages,
    cancelSearch,
    isConfigured,
    checkConfiguration,
  };
}
