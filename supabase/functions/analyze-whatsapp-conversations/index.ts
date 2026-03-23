import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { logOpenAIUsage } from "../_shared/openai-usage.ts";

const PROMPT_VERSION = "v2";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const SYSTEM_PROMPT = `Você é um analista comercial especializado em identificar intenções de compra e fechamentos em conversas de WhatsApp de lojas/empresas.

Analise a conversa e extraia informações comerciais usando a ferramenta fornecida.

CRITÉRIOS DE INTENÇÃO DE COMPRA:
- Cliente pediu um produto ou serviço específico
- Cliente perguntou preço com intenção clara de comprar
- Cliente solicitou disponibilidade de item
- Cliente demonstrou interesse direto em adquirir algo

CRITÉRIOS DE FECHAMENTO:
- Cliente confirmou pedido
- Cliente aceitou compra explicitamente
- Cliente informou endereço de entrega
- Cliente solicitou entrega
- Cliente confirmou pagamento ou separação de produto

CANAL DE FECHAMENTO:
- "sistema" → quando o cliente seguiu um fluxo estruturado (link de catálogo, carrinho, checkout automático)
- "manual_whatsapp" → quando o fechamento aconteceu diretamente na conversa sem sistema estruturado. Em lojas que não usam sistema de pedidos, esta é a classificação padrão para fechamentos.
- "indefinido" → quando não é possível afirmar com segurança

REGRAS OBRIGATÓRIAS PARA ATENDIMENTO PREDOMINANTE E PRECISOU_HUMANO:
⚠️ PRIORIZE SEMPRE os dados de CONVERSATION_METRICS fornecidos abaixo do histórico. Esses dados são FACTUAIS e calculados diretamente do banco de dados. NÃO infira o tipo de atendimento apenas pelo estilo de escrita ou formatação do texto.

CRITÉRIO PARA atendimento_predominante (usar CONVERSATION_METRICS):
- "humano" → quando human_message_percentage > 50%, OU quando had_cellphone_message=true e a finalização foi humana (last_outgoing_sender=humano)
- "ia" → quando bot_message_percentage > 80% e had_human_intervention=false
- "misto" → quando houve participação relevante de ambos (bot e humano > 20% cada)

CRITÉRIO PARA precisou_humano (usar CONVERSATION_METRICS):
- true → quando had_human_intervention=true, OU had_cellphone_message=true, OU human_messages_in_last_5_outgoing >= 1
- false → somente quando had_human_intervention=false E had_cellphone_message=false E total_human_messages=0

Use o histórico textual para entender intenção de compra, fechamento, valor estimado e contexto comercial.
Use as CONVERSATION_METRICS para decidir atendimento_predominante e precisou_humano.

Seja preciso. Se não houver evidência clara, marque como false/indefinido. O confidence_score deve refletir quão certa é sua análise (0-100).`;

const ANALYSIS_TOOL = {
  type: "function",
  function: {
    name: "registrar_analise_comercial",
    description: "Registra a análise comercial de uma conversa de WhatsApp",
    parameters: {
      type: "object",
      properties: {
        houve_intencao_compra: {
          type: "boolean",
          description: "Se o cliente demonstrou intenção de comprar algo"
        },
        houve_fechamento: {
          type: "boolean",
          description: "Se houve fechamento/venda confirmada na conversa"
        },
        valor_estimado: {
          type: "number",
          description: "Valor estimado da venda em reais. 0 se não identificado"
        },
        canal_fechamento: {
          type: "string",
          enum: ["sistema", "manual_whatsapp", "indefinido"],
          description: "Por qual canal o fechamento ocorreu"
        },
        atendimento_predominante: {
          type: "string",
          enum: ["ia", "humano", "misto"],
          description: "Tipo predominante de atendimento — DEVE ser baseado nas CONVERSATION_METRICS fornecidas, não no estilo textual"
        },
        precisou_humano: {
          type: "boolean",
          description: "Se houve intervenção humana — DEVE ser baseado nas CONVERSATION_METRICS fornecidas"
        },
        motivo_sem_fechamento: {
          type: "string",
          description: "Motivo pelo qual não houve fechamento (max 100 chars). Vazio se houve fechamento"
        },
        resumo_comercial: {
          type: "string",
          description: "Resumo comercial curto da conversa (max 200 chars)"
        },
        confidence_score: {
          type: "integer",
          description: "Confiança na análise de 0 a 100"
        },
        confidence_reason: {
          type: "string",
          description: "Justificativa para o score de confiança (max 150 chars)"
        }
      },
      required: [
        "houve_intencao_compra", "houve_fechamento", "valor_estimado",
        "canal_fechamento", "atendimento_predominante", "precisou_humano",
        "motivo_sem_fechamento", "resumo_comercial", "confidence_score", "confidence_reason"
      ],
      additionalProperties: false
    }
  }
};

// Calcular métricas reais da conversa a partir dos dados do banco
function calculateConversationMetrics(messages: any[]) {
  const totalMessages = messages.length;
  const incoming = messages.filter(m => m.direction === 'incoming');
  const outgoing = messages.filter(m => m.direction === 'outgoing');
  const botMessages = outgoing.filter(m => m.is_from_bot === true);
  const humanMessages = outgoing.filter(m => m.is_from_bot === false);

  const totalOutgoing = outgoing.length;
  const totalBotMessages = botMessages.length;
  const totalHumanMessages = humanMessages.length;
  const botPercentage = totalOutgoing > 0 ? Math.round((totalBotMessages / totalOutgoing) * 1000) / 10 : 0;
  const humanPercentage = totalOutgoing > 0 ? Math.round((totalHumanMessages / totalOutgoing) * 1000) / 10 : 0;

  const hadHumanIntervention = totalHumanMessages > 0;
  const hadCellphoneMessage = humanMessages.some(m =>
    m.message_source === 'cellphone' ||
    m.message_source === 'mobile' ||
    m.message_source === 'android' ||
    m.message_source === 'ios'
  ) || (hadHumanIntervention); // Se teve mensagem humana (não bot), considerar intervenção

  // Últimas mensagens de saída
  const lastOutgoing = outgoing.length > 0 ? outgoing[outgoing.length - 1] : null;
  const lastOutgoingSender = lastOutgoing
    ? (lastOutgoing.is_from_bot ? 'ia' : 'humano')
    : 'nenhum';

  // Padrão dos últimos 3 outgoing
  const last3Outgoing = outgoing.slice(-3).map(m => m.is_from_bot ? 'ia' : 'humano');
  const last3Pattern = last3Outgoing.join(' → ') || 'nenhum';

  // Últimos 5 outgoing
  const last5Outgoing = outgoing.slice(-5);
  const humanInLast5 = last5Outgoing.filter(m => m.is_from_bot === false).length;
  const botInLast5 = last5Outgoing.filter(m => m.is_from_bot === true).length;

  return {
    total_messages: totalMessages,
    total_incoming_messages: incoming.length,
    total_outgoing_messages: totalOutgoing,
    total_bot_messages: totalBotMessages,
    total_human_messages: totalHumanMessages,
    bot_message_percentage: botPercentage,
    human_message_percentage: humanPercentage,
    had_human_intervention: hadHumanIntervention,
    had_cellphone_message: hadCellphoneMessage,
    last_outgoing_sender: lastOutgoingSender,
    last_3_outgoing_sender_pattern: last3Pattern,
    human_messages_in_last_5_outgoing: humanInLast5,
    bot_messages_in_last_5_outgoing: botInLast5
  };
}

function formatMetricsBlock(metrics: ReturnType<typeof calculateConversationMetrics>): string {
  return `CONVERSATION_METRICS:
- total_messages: ${metrics.total_messages}
- total_incoming_messages: ${metrics.total_incoming_messages}
- total_outgoing_messages: ${metrics.total_outgoing_messages}
- total_bot_messages: ${metrics.total_bot_messages}
- total_human_messages: ${metrics.total_human_messages}
- bot_message_percentage: ${metrics.bot_message_percentage}%
- human_message_percentage: ${metrics.human_message_percentage}%
- had_human_intervention: ${metrics.had_human_intervention}
- had_cellphone_message: ${metrics.had_cellphone_message}
- last_outgoing_sender: ${metrics.last_outgoing_sender}
- last_3_outgoing_sender_pattern: ${metrics.last_3_outgoing_sender_pattern}
- human_messages_in_last_5_outgoing: ${metrics.human_messages_in_last_5_outgoing}
- bot_messages_in_last_5_outgoing: ${metrics.bot_messages_in_last_5_outgoing}`;
}

function formatMessages(messages: any[]): string {
  return messages.map(msg => {
    const time = new Date(msg.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    let sender = '[CLIENTE]';
    if (msg.direction === 'outgoing') {
      sender = msg.is_from_bot ? '[IA]' : '[ATENDENTE]';
    }
    const content = msg.content || `[${msg.message_type}]`;
    return `${time} ${sender}: ${content}`;
  }).join('\n');
}

async function analyzeConversation(
  openaiKey: string,
  formattedHistory: string,
  metricsBlock: string,
  contactName: string
): Promise<any> {
  const userPrompt = `Analise esta conversa com o cliente "${contactName || 'Desconhecido'}".

${metricsBlock}

HISTÓRICO DA CONVERSA:
${formattedHistory}`;

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      tools: [ANALYSIS_TOOL],
      tool_choice: { type: "function", function: { name: "registrar_analise_comercial" } },
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  
  if (!toolCall) {
    throw new Error('OpenAI não retornou tool call');
  }

  const analysis = JSON.parse(toolCall.function.arguments);
  const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };

  return { analysis, usage, model: data.model || 'gpt-4o-mini' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storeId, batchSize = 10, conversationId } = await req.json();

    if (!storeId) {
      return new Response(JSON.stringify({ error: 'storeId é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Buscar OpenAI key da loja
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('openai_api_key, name')
      .eq('id', storeId)
      .single();

    if (storeError || !store?.openai_api_key) {
      return new Response(JSON.stringify({ error: 'Loja não encontrada ou sem chave OpenAI configurada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let conversations: any[] = [];

    if (conversationId) {
      // Reprocessamento de conversa específica
      const { data: conv } = await supabase
        .from('whatsapp_conversations')
        .select('id, remote_jid, phone_number, contact_name, last_message_at')
        .eq('id', conversationId)
        .eq('store_id', storeId)
        .single();

      if (conv) conversations = [conv];
    } else {
      // Batch: buscar IDs já analisados para esta loja
      const { data: allAnalyzed } = await supabase
        .from('whatsapp_conversation_analysis')
        .select('conversation_id')
        .eq('store_id', storeId);

      const analyzedIds = new Set((allAnalyzed || []).map(a => a.conversation_id));

      // Buscar 3x o batchSize para compensar conversas puladas por poucas mensagens
      let offset = 0;
      const pageSize = 100;
      const fetchSize = batchSize * 3;
      
      while (conversations.length < fetchSize) {
        const { data: convs } = await supabase
          .from('whatsapp_conversations')
          .select('id, remote_jid, phone_number, contact_name, last_message_at')
          .eq('store_id', storeId)
          .not('remote_jid', 'like', '%@g.us')
          .order('last_message_at', { ascending: false })
          .range(offset, offset + pageSize - 1);

        if (!convs || convs.length === 0) break;

        for (const c of convs) {
          if (!analyzedIds.has(c.id)) {
            conversations.push(c);
            if (conversations.length >= fetchSize) break;
          }
        }
        offset += pageSize;
      }
    }

    if (conversations.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        processed: 0, 
        message: 'Nenhuma conversa para analisar' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const results: any[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const conv of conversations) {
      // Parar quando atingir o batchSize de análises bem-sucedidas
      if (successCount >= batchSize) break;

      try {
        // Buscar mensagens da conversa (incluindo message_source para métricas)
        const { data: messages } = await supabase
          .from('whatsapp_chat_messages')
          .select('content, direction, is_from_bot, message_type, timestamp, sender_name, message_source')
          .eq('store_id', storeId)
          .eq('remote_jid', conv.remote_jid)
          .order('timestamp', { ascending: true })
          .limit(200);

        if (!messages || messages.length < 2) {
          console.log(`⏭️ Conversa ${conv.id}: poucas mensagens (${messages?.length || 0}), marcando como pulada`);
          // Marcar como pulada para não buscar novamente
          await supabase
            .from('whatsapp_conversation_analysis')
            .upsert({
              conversation_id: conv.id,
              store_id: storeId,
              remote_jid: conv.remote_jid,
              phone_number: conv.phone_number,
              contact_name: conv.contact_name,
              analysis_status: 'skipped',
              analysis_error: `Poucas mensagens (${messages?.length || 0})`,
              total_messages_analyzed: messages?.length || 0,
              last_message_at: conv.last_message_at,
              analyzed_at: new Date().toISOString(),
              prompt_version: PROMPT_VERSION,
              houve_intencao_compra: false,
              houve_fechamento: false,
              valor_estimado: 0,
              canal_fechamento: 'indefinido',
              atendimento_predominante: 'indefinido',
              precisou_humano: false,
              confidence_score: 0,
              resumo_comercial: 'Conversa com poucas mensagens para análise',
            }, { onConflict: 'conversation_id' });
          continue;
        }

        // Calcular métricas reais da conversa
        const metrics = calculateConversationMetrics(messages);
        const metricsBlock = formatMetricsBlock(metrics);
        const formattedHistory = formatMessages(messages);
        const lastMsg = messages[messages.length - 1];
        const lastMessageAt = lastMsg?.timestamp || conv.last_message_at;

        console.log(`📊 Métricas ${conv.contact_name || conv.phone_number}: bot=${metrics.total_bot_messages} humano=${metrics.total_human_messages} (${metrics.human_message_percentage}%) celular=${metrics.had_cellphone_message} último=${metrics.last_outgoing_sender}`);

        // Chamar OpenAI com métricas incluídas
        const { analysis, usage, model } = await analyzeConversation(
          store.openai_api_key,
          formattedHistory,
          metricsBlock,
          conv.contact_name || conv.phone_number
        );

        // Dados para upsert
        const analysisData = {
          conversation_id: conv.id,
          store_id: storeId,
          remote_jid: conv.remote_jid,
          phone_number: conv.phone_number,
          contact_name: conv.contact_name,
          houve_intencao_compra: analysis.houve_intencao_compra,
          houve_fechamento: analysis.houve_fechamento,
          valor_estimado: analysis.valor_estimado || 0,
          canal_fechamento: analysis.canal_fechamento,
          atendimento_predominante: analysis.atendimento_predominante,
          precisou_humano: analysis.precisou_humano,
          motivo_sem_fechamento: analysis.motivo_sem_fechamento || null,
          resumo_comercial: analysis.resumo_comercial,
          confidence_score: analysis.confidence_score,
          confidence_reason: analysis.confidence_reason,
          analysis_status: 'success',
          analysis_error: null,
          prompt_version: PROMPT_VERSION,
          model_used: model,
          prompt_tokens: usage.prompt_tokens,
          completion_tokens: usage.completion_tokens,
          total_messages_analyzed: messages.length,
          last_message_at: lastMessageAt,
          analyzed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (conversationId) {
          // Reprocessamento: UPDATE existente + incrementar retry_count
          const { error: updateError } = await supabase
            .from('whatsapp_conversation_analysis')
            .update({
              ...analysisData,
              retry_count: supabase.rpc ? undefined : 0
            })
            .eq('conversation_id', conv.id);

          if (updateError) {
            await supabase.from('whatsapp_conversation_analysis').insert(analysisData);
          } else {
            await supabase
              .from('whatsapp_conversation_analysis')
              .update({ retry_count: supabase.sql`retry_count + 1` })
              .eq('conversation_id', conv.id)
              .catch(() => {});
          }
        } else {
          // Insert novo
          const { error: insertError } = await supabase
            .from('whatsapp_conversation_analysis')
            .insert(analysisData);

          if (insertError) {
            console.error(`❌ Erro ao salvar análise ${conv.id}:`, insertError.message);
            errorCount++;
            continue;
          }
        }

        // Registrar uso OpenAI
        await logOpenAIUsage(supabase, storeId, {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          usageType: 'text',
          model: model,
          messageType: 'commercial_analysis',
          metadata: { conversation_id: conv.id }
        });

        successCount++;
        results.push({
          conversationId: conv.id,
          contactName: conv.contact_name,
          intencao: analysis.houve_intencao_compra,
          fechamento: analysis.houve_fechamento,
          valor: analysis.valor_estimado,
          confidence: analysis.confidence_score,
          atendimento: analysis.atendimento_predominante,
          precisouHumano: analysis.precisou_humano
        });

        console.log(`✅ Analisada: ${conv.contact_name || conv.phone_number} | Atend: ${analysis.atendimento_predominante} | Humano: ${analysis.precisou_humano} | Intenção: ${analysis.houve_intencao_compra} | Fechamento: ${analysis.houve_fechamento} | Valor: R$ ${analysis.valor_estimado}`);

        // Delay entre chamadas
        if (conversations.indexOf(conv) < conversations.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (convError) {
        console.error(`❌ Erro ao analisar conversa ${conv.id}:`, convError);
        errorCount++;

        // Salvar erro
        await supabase.from('whatsapp_conversation_analysis').upsert({
          conversation_id: conv.id,
          store_id: storeId,
          remote_jid: conv.remote_jid,
          phone_number: conv.phone_number,
          contact_name: conv.contact_name,
          analysis_status: 'error',
          analysis_error: convError instanceof Error ? convError.message : 'Erro desconhecido',
          prompt_version: PROMPT_VERSION,
          analyzed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'conversation_id' });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: successCount,
      errors: errorCount,
      total: conversations.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro interno' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
