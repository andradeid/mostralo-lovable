import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { logOpenAIUsage } from "../_shared/openai-usage.ts";

const PROMPT_VERSION = "v1";
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
- "sistema" → quando o cliente seguiu um fluxo estruturado (link, carrinho, checkout)
- "manual_whatsapp" → quando o fechamento aconteceu diretamente na conversa sem sistema
- "indefinido" → quando não é possível afirmar

ATENDIMENTO PREDOMINANTE:
- "ia" → maioria das respostas foi do bot/IA
- "humano" → maioria das respostas foi de atendente humano
- "misto" → houve participação relevante de ambos

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
          description: "Tipo predominante de atendimento na conversa"
        },
        precisou_humano: {
          type: "boolean",
          description: "Se foi necessária intervenção humana"
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
  contactName: string
): Promise<any> {
  const userPrompt = `Analise esta conversa com o cliente "${contactName || 'Desconhecido'}":\n\n${formattedHistory}`;

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
      // Batch: buscar conversas sem análise
      const { data: convs } = await supabase
        .from('whatsapp_conversations')
        .select('id, remote_jid, phone_number, contact_name, last_message_at')
        .eq('store_id', storeId)
        .not('remote_jid', 'like', '%@g.us') // Ignorar grupos
        .order('last_message_at', { ascending: false })
        .limit(batchSize * 2); // Buscar mais para filtrar

      if (convs) {
        // Filtrar conversas já analisadas
        const convIds = convs.map(c => c.id);
        const { data: analyzed } = await supabase
          .from('whatsapp_conversation_analysis')
          .select('conversation_id')
          .in('conversation_id', convIds);

        const analyzedIds = new Set((analyzed || []).map(a => a.conversation_id));
        conversations = convs.filter(c => !analyzedIds.has(c.id)).slice(0, batchSize);
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
      try {
        // Buscar mensagens da conversa
        const { data: messages } = await supabase
          .from('whatsapp_chat_messages')
          .select('content, direction, is_from_bot, message_type, timestamp, sender_name')
          .eq('store_id', storeId)
          .eq('remote_jid', conv.remote_jid)
          .order('timestamp', { ascending: true })
          .limit(200);

        if (!messages || messages.length < 2) {
          console.log(`⏭️ Conversa ${conv.id}: poucas mensagens (${messages?.length || 0}), pulando`);
          continue;
        }

        const formattedHistory = formatMessages(messages);
        const lastMsg = messages[messages.length - 1];
        const lastMessageAt = lastMsg?.timestamp || conv.last_message_at;

        // Chamar OpenAI
        const { analysis, usage, model } = await analyzeConversation(
          store.openai_api_key,
          formattedHistory,
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
              retry_count: supabase.rpc ? undefined : 0 // will handle below
            })
            .eq('conversation_id', conv.id);

          if (updateError) {
            // Se não existe, inserir
            await supabase.from('whatsapp_conversation_analysis').insert(analysisData);
          } else {
            // Incrementar retry_count via SQL
            await supabase.rpc('increment_retry_count_noop', {}).catch(() => {});
            // Fallback: just update
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
          confidence: analysis.confidence_score
        });

        console.log(`✅ Analisada: ${conv.contact_name || conv.phone_number} | Intenção: ${analysis.houve_intencao_compra} | Fechamento: ${analysis.houve_fechamento} | Valor: R$ ${analysis.valor_estimado}`);

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
