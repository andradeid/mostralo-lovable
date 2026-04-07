/**
 * Fetch resiliente com timeout e retry automático.
 * Projetado para chamadas de Edge Functions que podem sofrer
 * timeout do Supabase (522/504).
 */

const SUPABASE_EDGE_BASE = 'https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2h3dndwanRudm5kb2tiZmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTY2NzYsImV4cCI6MjA3MTM3MjY3Nn0.RkppC11I7QW8n8Fdx5FOyjlX_yE1kOFGUlzb3xpphEA';

interface ResilientFetchOptions {
  /** Timeout por tentativa em ms (default: 25000) */
  timeoutMs?: number;
  /** Número máximo de tentativas (default: 2) */
  maxRetries?: number;
  /** Delay entre retries em ms (default: 2000) */
  retryDelayMs?: number;
  /** Callback chamado antes de cada retry */
  onRetry?: (attempt: number, error: string) => void;
}

interface ResilientFetchResult<T = any> {
  data: T | null;
  error: string | null;
  status: number;
  timedOut: boolean;
}

export async function resilientEdgeFetch<T = any>(
  functionName: string,
  body: Record<string, unknown>,
  options: ResilientFetchOptions = {}
): Promise<ResilientFetchResult<T>> {
  const {
    timeoutMs = 25000,
    maxRetries = 2,
    retryDelayMs = 2000,
    onRetry,
  } = options;

  const url = `${SUPABASE_EDGE_BASE}/${functionName}`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);

      // Tentar ler o body JSON
      let data: any = null;
      try {
        data = await resp.json();
      } catch {
        // Response não é JSON (ex: HTML de erro 522)
      }

      if (resp.ok && data && !data.error) {
        return { data: data as T, error: null, status: resp.status, timedOut: false };
      }

      const errorMsg = data?.error || data?.details || `Erro ${resp.status}`;

      // Se for erro 5xx (servidor), tentar retry
      if (resp.status >= 500 && attempt < maxRetries) {
        console.warn(`[resilientEdgeFetch] Tentativa ${attempt} falhou (${resp.status}), retentando...`);
        onRetry?.(attempt, errorMsg);
        await new Promise(r => setTimeout(r, retryDelayMs));
        continue;
      }

      return { data: null, error: errorMsg, status: resp.status, timedOut: false };
    } catch (err: any) {
      clearTimeout(timer);

      const isTimeout = err?.name === 'AbortError';
      const errorMsg = isTimeout
        ? 'Servidor demorou para responder. Tentando novamente...'
        : (err?.message || 'Erro de rede');

      if (attempt < maxRetries) {
        console.warn(`[resilientEdgeFetch] Tentativa ${attempt} falhou (${isTimeout ? 'timeout' : 'network'}), retentando...`);
        onRetry?.(attempt, errorMsg);
        await new Promise(r => setTimeout(r, retryDelayMs));
        continue;
      }

      return {
        data: null,
        error: isTimeout
          ? 'Servidor indisponível no momento. Tente novamente em alguns segundos.'
          : errorMsg,
        status: 0,
        timedOut: isTimeout,
      };
    }
  }

  // Nunca deve chegar aqui
  return { data: null, error: 'Erro inesperado', status: 0, timedOut: false };
}
