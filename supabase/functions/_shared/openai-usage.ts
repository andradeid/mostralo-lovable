// Helper para tracking de uso da OpenAI
// Usado por todas as edge functions que fazem chamadas à OpenAI

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface UsageData {
  promptTokens: number;
  completionTokens: number;
  usageType: 'text' | 'image';
  model: string;
  messageType?: string;
  metadata?: Record<string, unknown>;
}

// Preços OpenAI em centavos USD por 1M tokens (atualizado Jan 2025)
const PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 250, output: 1000 },          // $2.50/$10.00 per 1M
  'gpt-4o-mini': { input: 15, output: 60 },        // $0.15/$0.60 per 1M
  'gpt-4-turbo': { input: 1000, output: 3000 },    // $10/$30 per 1M
  'gpt-4-turbo-preview': { input: 1000, output: 3000 },
  'gpt-3.5-turbo': { input: 50, output: 150 },     // $0.50/$1.50 per 1M
};

/**
 * Calcula o custo estimado em centavos USD
 */
export function calculateCost(data: UsageData): number {
  const price = PRICING[data.model] || PRICING['gpt-4o-mini'];
  
  // Converter para centavos: (tokens / 1M) * preço_por_1M * 100
  const inputCost = (data.promptTokens / 1_000_000) * price.input * 100;
  const outputCost = (data.completionTokens / 1_000_000) * price.output * 100;
  
  return Math.ceil(inputCost + outputCost);
}

/**
 * Estima o número de tokens de um texto
 * Aproximação: ~4 caracteres por token para português/inglês
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Registra uso da OpenAI no banco de dados
 * NUNCA falha a operação principal - erros são apenas logados
 */
export async function logOpenAIUsage(
  supabase: SupabaseClient,
  storeId: string,
  data: UsageData
): Promise<void> {
  try {
    const costCents = calculateCost(data);
    
    const { error } = await supabase.from('openai_usage_logs').insert({
      store_id: storeId,
      prompt_tokens: data.promptTokens,
      completion_tokens: data.completionTokens,
      usage_type: data.usageType,
      model: data.model,
      estimated_cost_cents: costCents,
      message_type: data.messageType || 'chat',
      metadata: data.metadata || null
    });

    if (error) {
      console.warn('⚠️ Falha ao registrar uso OpenAI:', error.message);
    } else {
      console.log(`📊 Uso registrado: ${data.promptTokens + data.completionTokens} tokens, ~$${(costCents / 100).toFixed(4)}`);
    }
  } catch (error) {
    // NUNCA falha a operação principal
    console.warn('⚠️ Erro ao registrar uso OpenAI:', error);
  }
}

/**
 * Calcula tokens de imagem para GPT-4o Vision
 * Baseado na documentação OpenAI: ~765 tokens para low detail, ~1105 para high detail
 */
export function calculateImageTokens(detail: 'low' | 'high' = 'high'): number {
  return detail === 'low' ? 765 : 1105;
}
