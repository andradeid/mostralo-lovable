import { useState, useCallback, useRef } from 'react';

const MEDIA_CACHE_NAME = 'mostralo-media-v1';

interface CacheProgress {
  total: number;
  loaded: number;
  percentage: number;
}

export const useMediaCache = () => {
  const [isCaching, setIsCaching] = useState(false);
  const [progress, setProgress] = useState<CacheProgress>({ total: 0, loaded: 0, percentage: 0 });
  const blobUrlsRef = useRef<Map<string, string>>(new Map());

  // Pré-carregar lista de URLs para o cache
  const preloadMedia = useCallback(async (urls: string[]) => {
    if (urls.length === 0) return;
    
    setIsCaching(true);
    setProgress({ total: urls.length, loaded: 0, percentage: 0 });
    
    let loaded = 0;
    
    try {
      const cache = await caches.open(MEDIA_CACHE_NAME);
      
      // Processar em paralelo com limite de concorrência
      const batchSize = 2;
      for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (url) => {
          try {
            // Verificar se já está no cache
            const cached = await cache.match(url);
            if (!cached) {
              console.log('[MediaCache] ⬇️ Baixando:', url.split('/').pop());
              const response = await fetch(url, { mode: 'cors' });
              if (response.ok) {
                await cache.put(url, response);
                console.log('[MediaCache] ✅ Cacheado:', url.split('/').pop());
              }
            } else {
              console.log('[MediaCache] 📦 Já em cache:', url.split('/').pop());
            }
          } catch (e) {
            console.warn('[MediaCache] ⚠️ Falha ao cachear:', url, e);
          }
          
          loaded++;
          setProgress({
            total: urls.length,
            loaded,
            percentage: Math.round((loaded / urls.length) * 100)
          });
        }));
      }
      
      console.log('[MediaCache] 🎉 Preload completo:', loaded, 'de', urls.length, 'mídias');
    } catch (e) {
      console.error('[MediaCache] Erro no preload:', e);
    } finally {
      setIsCaching(false);
    }
  }, []);

  // Obter URL do cache ou fazer download
  const getCachedUrl = useCallback(async (url: string): Promise<string> => {
    // Verificar se já temos um blob URL criado
    if (blobUrlsRef.current.has(url)) {
      return blobUrlsRef.current.get(url)!;
    }
    
    try {
      const cache = await caches.open(MEDIA_CACHE_NAME);
      const cached = await cache.match(url);
      
      if (cached) {
        // Criar blob URL para reprodução local (mais rápido)
        const blob = await cached.blob();
        const blobUrl = URL.createObjectURL(blob);
        blobUrlsRef.current.set(url, blobUrl);
        console.log('[MediaCache] 🚀 Usando cache local para:', url.split('/').pop());
        return blobUrl;
      }
    } catch (e) {
      console.warn('[MediaCache] Erro ao buscar do cache:', e);
    }
    
    // Fallback para URL original
    return url;
  }, []);

  // Limpar cache e blob URLs
  const clearCache = useCallback(async () => {
    // Revogar todos os blob URLs
    blobUrlsRef.current.forEach((blobUrl) => {
      URL.revokeObjectURL(blobUrl);
    });
    blobUrlsRef.current.clear();
    
    // Limpar cache
    await caches.delete(MEDIA_CACHE_NAME);
    console.log('[MediaCache] 🗑️ Cache limpo');
  }, []);

  // Cleanup blob URLs on unmount
  const cleanupBlobUrls = useCallback(() => {
    blobUrlsRef.current.forEach((blobUrl) => {
      URL.revokeObjectURL(blobUrl);
    });
    blobUrlsRef.current.clear();
  }, []);

  // Sincronizar cache - remove mídias antigas e adiciona novas
  const syncCache = useCallback(async (currentUrls: string[]) => {
    if (currentUrls.length === 0) return;
    
    try {
      const cache = await caches.open(MEDIA_CACHE_NAME);
      const cachedRequests = await cache.keys();
      
      // Encontrar URLs que estão no cache mas não estão mais no banco
      const urlsToRemove: string[] = [];
      for (const request of cachedRequests) {
        if (!currentUrls.includes(request.url)) {
          urlsToRemove.push(request.url);
          // Revogar blob URL se existir
          if (blobUrlsRef.current.has(request.url)) {
            URL.revokeObjectURL(blobUrlsRef.current.get(request.url)!);
            blobUrlsRef.current.delete(request.url);
          }
        }
      }
      
      // Remover mídias antigas do cache
      for (const url of urlsToRemove) {
        await cache.delete(url);
        console.log('[MediaCache] 🗑️ Removido do cache:', url.split('/').pop());
      }
      
      // Encontrar URLs que NÃO estão no cache (novas)
      const cachedUrls = cachedRequests.map(r => r.url);
      const urlsToCache = currentUrls.filter(url => !cachedUrls.includes(url));
      
      // Baixar novas mídias
      if (urlsToCache.length > 0) {
        console.log('[MediaCache] 📥 Novas mídias para cachear:', urlsToCache.length);
        await preloadMedia(urlsToCache);
      } else if (urlsToRemove.length === 0) {
        console.log('[MediaCache] ✅ Cache já sincronizado, nada a fazer');
      }
      
      console.log('[MediaCache] 🔄 Sync completo:', {
        removidos: urlsToRemove.length,
        novos: urlsToCache.length,
        total: currentUrls.length
      });
    } catch (e) {
      console.error('[MediaCache] Erro no sync:', e);
      // Fallback: fazer preload normal
      await preloadMedia(currentUrls);
    }
  }, [preloadMedia]);

  return { 
    preloadMedia,
    syncCache,
    getCachedUrl, 
    clearCache, 
    cleanupBlobUrls,
    isCaching, 
    progress 
  };
};
