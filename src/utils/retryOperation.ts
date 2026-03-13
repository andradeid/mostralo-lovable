/**
 * Utilitário de retry com backoff exponencial para operações críticas do Supabase.
 * Usar para operações fora do React Query (ex: impressão, chamadas diretas).
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = Math.min(baseDelay * 2 ** attempt, maxDelay);
        onRetry?.(attempt + 1, error);
        console.warn(
          `[Retry] Tentativa ${attempt + 1}/${maxRetries} falhou. Tentando novamente em ${delay}ms...`,
          error
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Wrapper para queries do Supabase com retry automático.
 * Verifica o campo `error` retornado pelo Supabase e lança exceção se presente.
 */
export async function retrySupabaseQuery<T>(
  queryFn: () => PromiseLike<{ data: T | null; error: any }>,
  maxRetries = 3
): Promise<T> {
  return retryOperation(
    async () => {
      const result = await queryFn();
      if (result.error) throw result.error;
      return result.data as T;
    },
    { maxRetries }
  );
}
