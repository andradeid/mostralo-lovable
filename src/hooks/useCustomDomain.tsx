import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isCustomDomainHost } from '@/lib/storePath';

export type CustomDomainHome = 'store' | 'booking';

interface CustomDomainResult {
  storeSlug: string | null;
  home: CustomDomainHome;
  isCustomDomain: boolean;
  isLoading: boolean;
}

const CACHE_KEY = 'mostralo_custom_domain_slug';
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry { host: string; slug: string | null; home?: CustomDomainHome; at: number }

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

function writeCache(host: string, slug: string | null, home: CustomDomainHome) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ host, slug, home, at: Date.now() }));
  } catch {
    // silencioso (Safari privado)
  }
}

export function useCustomDomain(): CustomDomainResult {
  const [result, setResult] = useState<CustomDomainResult>(() => {
    const host = window.location.hostname;
    if (!isCustomDomainHost(host)) return { storeSlug: null, home: 'store', isCustomDomain: false, isLoading: false };
    const cached = readCache(host);
    if (cached) return { storeSlug: cached.slug, home: cached.home === 'booking' ? 'booking' : 'store', isCustomDomain: true, isLoading: false };
    return { storeSlug: null, home: 'store', isCustomDomain: true, isLoading: true };
  });

  useEffect(() => {
    if (!result.isLoading) return;
    const hostname = window.location.hostname;
    let cancelled = false;

    (async () => {
      try {
        // RPC SECURITY DEFINER — visitante anônimo não lê a tabela stores
        const { data, error } = await supabase.rpc('get_custom_domain_store' as never, { p_domain: hostname } as never);
        // A RPC pode devolver objeto ou lista com uma linha
        const raw = data as unknown;
        const row = (Array.isArray(raw) ? raw[0] ?? null : raw ?? null) as { slug?: unknown; home?: unknown } | null;
        const slug = !error && row && typeof row.slug === 'string' && row.slug ? row.slug : null;
        const home: CustomDomainHome = row?.home === 'booking' ? 'booking' : 'store';
        if (!error) writeCache(hostname, slug, home);
        if (!cancelled) setResult({ storeSlug: slug, home, isCustomDomain: true, isLoading: false });
      } catch {
        if (!cancelled) setResult({ storeSlug: null, home: 'store', isCustomDomain: true, isLoading: false });
      }
    })();

    return () => { cancelled = true; };
  }, [result.isLoading]);

  return result;
}
