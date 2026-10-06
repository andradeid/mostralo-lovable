// Cliente Supabase SOMENTE LEITURA para a vitrine pública.
// Em produção (Cloudflare Pages) as leituras passam pelo proxy com cache
// `/api/sb/*`. Se o proxy falhar (403, 404, 5xx, HTML do SPA ou erro de rede),
// a mesma requisição é refeita direto no Supabase — comportamento idêntico.
// Em localhost / preview do Lovable usa o cliente normal diretamente.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { supabase } from './client';

const SUPABASE_URL = 'https://noshwvwpjtnvndokbfjx.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2h3dndwanRudm5kb2tiZmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTY2NzYsImV4cCI6MjA3MTM3MjY3Nn0.RkppC11I7QW8n8Fdx5FOyjlX_yE1kOFGUlzb3xpphEA';

/** Ambientes sem a Pages Function (dev, preview do Lovable, apps nativos). */
function isProxyUnavailable(): boolean {
  if (typeof window === 'undefined') return true;
  const { hostname, protocol } = window.location;
  if (protocol !== 'http:' && protocol !== 'https:') return true;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.lovable.app') ||
    hostname.endsWith('.lovableproject.com') ||
    hostname.endsWith('.lovable.dev')
  );
}

/** fetch com fallback: proxy → Supabase direto. */
const fallbackFetch: typeof fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const proxyBase = `${window.location.origin}/api/sb`;
  const directUrl = url.startsWith(proxyBase) ? SUPABASE_URL + url.slice(proxyBase.length) : url;
  try {
    const res = await fetch(input, init);
    const ct = res.headers.get('content-type') ?? '';
    const ok = (res.ok || res.status === 416) && !ct.includes('text/html');
    // Erros 4xx do PostgREST (ex.: 400 de filtro) são legítimos — mas 403/404
    // podem vir do proxy (método/tabela fora da whitelist ou function ausente).
    if (ok || (res.status >= 400 && res.status < 500 && ![403, 404, 405].includes(res.status) && ct.includes('json'))) {
      return res;
    }
  } catch {
    // erro de rede → cai no fallback
  }
  return fetch(directUrl, init);
};

function createPublicClient() {
  if (isProxyUnavailable()) return supabase;
  return createClient<Database>(`${window.location.origin}/api/sb`, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'mostralo-public-ro' },
    global: { fetch: fallbackFetch },
  });
}

/** Use APENAS para leituras anônimas das tabelas públicas da vitrine. */
export const publicSupabase = createPublicClient();
