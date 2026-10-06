import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isCustomDomainHost } from '@/lib/storePath';

interface CustomDomainResult {
  storeSlug: string | null;
  isCustomDomain: boolean;
  isLoading: boolean;
}

const CACHE_KEY = 'mostralo_custom_domain_slug';
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry { host: string; slug: string | null; at: number }

function readCache(host: string): CacheEntry | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (entry.host !== host || Date.now() - entry.at > CACHE_TTL_MS) return null;
    return entry;
  } catch {
    return null;
  }
}

function writeCache(host: string, slug: string | null) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ host, slug, at: Date.now() }));
  } catch {
    // silencioso (Safari privado)
  }
}

export function useCustomDomain(): CustomDomainResult {
  const [result, setResult] = useState<CustomDomainResult>(() => {
    const host = window.location.hostname;
    if (!isCustomDomainHost(host)) return { storeSlug: null, isCustomDomain: false, isLoading: false };
    const cached = readCache(host);
    if (cached) return { storeSlug: cached.slug, isCustomDomain: true, isLoading: false };
    return { storeSlug: null, isCustomDomain: true, isLoading: true };
  });

  useEffect(() => {
    if (!result.isLoading) return;
    const hostname = window.location.hostname;
    let cancelled = false;

    (async () => {
      try {
        // RPC SECURITY DEFINER — visitante anônimo não lê a tabela stores
        const { data, error } = await supabase.rpc('get_store_slug_by_domain' as never, { p_domain: hostname } as never);
        const slug = !error && typeof data === 'string' && data ? data : null;
        if (!error) writeCache(hostname, slug);
        if (!cancelled) setResult({ storeSlug: slug, isCustomDomain: true, isLoading: false });
      } catch {
        if (!cancelled) setResult({ storeSlug: null, isCustomDomain: true, isLoading: false });
      }
    })();

    return () => { cancelled = true; };
  }, [result.isLoading]);

  return result;
}
