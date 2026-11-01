// Mensagens de erro das Edge Functions com instruções para o lojista.
// Código movido da WhatsAppInstancePage sem mudança de comportamento.
/**
 * Extrai a mensagem real de erro de uma Edge Function e adiciona instruções
 * claras para o usuário entender o que aconteceu e o que fazer.
 * O supabase-js devolve apenas "Edge Function returned a non-2xx status code",
 * então precisamos ler o corpo da resposta (FunctionsHttpError.context) para
 * mostrar ao usuário o motivo verdadeiro (401, 403, token inválido, etc.).
 */
export function withInstructions(message: string, instructions: string): string {
  return `${message}\n\n💡 ${instructions}`;
}

export async function extractFunctionError(
  error: any,
  data: any,
  fallback: string
): Promise<string> {
  if (data?.error) return withInstructions(String(data.error), 'Tente novamente em alguns instantes. Se o erro persistir, contate o suporte.');

  try {
    const ctx = error?.context;
    if (ctx && typeof ctx.json === 'function') {
      const body = await ctx.clone().json();
      if (body?.error) {
        const baseMsg = body.details
          ? `${body.error} (${JSON.stringify(body.details).slice(0, 200)})`
          : String(body.error);
        return withInstructions(baseMsg, 'Tente novamente. Se persistir, saia do sistema, faça login novamente e tente conectar.');
      }
    }
    if (ctx?.status === 401) {
      return withInstructions(
        'Sessão expirada (401).',
        'Sua sessão de login expirou por segurança. Saia do sistema, faça login novamente e clique em Conectar para gerar o QR Code.'
      );
    }
    if (ctx?.status === 403) {
      return withInstructions(
        'Sem permissão (403).',
        'Sua conta não tem permissão para gerenciar o WhatsApp desta loja. Verifique com o administrador se você tem acesso de gestor para esta loja.'
      );
    }
    if (ctx?.status === 500) {
      return withInstructions(
        'Erro interno do servidor (500).',
        'Houve uma falha temporária no provedor UaZapi ou no servidor. Aguarde 1 minuto e tente novamente. Se persistir, contate o suporte.'
      );
    }
  } catch {
    // corpo não era JSON — segue para o fallback
  }
  const raw = error?.message || fallback;
  if (raw.includes('non-2xx status code') || raw === fallback) {
    return withInstructions(
      raw,
      'Não foi possível conectar ao servidor do WhatsApp. Verifique sua internet, saia e entre novamente no sistema, e tente conectar. Se o erro continuar, contate o suporte.'
    );
  }
  return raw;
}
