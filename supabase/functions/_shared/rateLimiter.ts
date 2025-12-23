/**
 * Rate Limiter Compartilhado para Edge Functions
 * Usa store em memória para limitar requisições por IP/identificador
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Store global em memória (persiste durante a vida da instância)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Limpa entradas expiradas periodicamente
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Executa limpeza a cada 5 minutos
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

/**
 * Verifica se uma requisição deve ser permitida baseado em rate limiting
 * 
 * @param identifier - Identificador único (ex: IP, telefone, email)
 * @param maxRequests - Número máximo de requisições permitidas na janela
 * @param windowMs - Tamanho da janela em milissegundos (default: 60000 = 1 minuto)
 * @returns RateLimitResult com status e informações
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  
  let entry = rateLimitStore.get(key);
  
  // Se não existe entrada ou expirou, criar nova
  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + windowMs };
    rateLimitStore.set(key, entry);
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: entry.resetAt,
      retryAfterSeconds: 0
    };
  }
  
  // Se atingiu o limite
  if (entry.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterSeconds
    };
  }
  
  // Incrementar contador
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
    retryAfterSeconds: 0
  };
}

/**
 * Extrai o IP do cliente do request
 * Considera headers de proxy reverso
 */
export function getClientIP(req: Request): string {
  // Tentar headers comuns de proxy
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Pode conter múltiplos IPs separados por vírgula, pegar o primeiro
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }
  
  // Fallback para IP genérico se não encontrar
  return req.headers.get('cf-connecting-ip') || 'unknown';
}

/**
 * Retorna resposta de rate limit excedido com headers apropriados
 */
export function rateLimitExceededResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'Muitas tentativas. Tente novamente em alguns segundos.',
      retryAfterSeconds: result.retryAfterSeconds
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': result.retryAfterSeconds.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetAt).toISOString()
      }
    }
  );
}
