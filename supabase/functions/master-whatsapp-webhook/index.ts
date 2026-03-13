import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MasterWhatsAppConfig {
  id: string;
  admin_user_id: string;
  instance_name: string;
  instance_status: string;
  sales_bot_enabled: boolean;
  sales_bot_approach: string;
  sales_bot_keywords: string[];
  recruitment_bot_enabled: boolean;
  recruitment_bot_approach: string;
  recruitment_bot_keywords: string[];
  support_bot_enabled: boolean;
  support_bot_keywords: string[];
  unified_openai_assistant_id: string | null;
  openai_api_key: string | null;
  openai_model: string | null;
  evolution_instance_id: string | null;
}

type BotType = 'sales' | 'recruitment' | 'support';

function normalizeText(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function detectBotType(messageText: string, config: MasterWhatsAppConfig): BotType {
  const normalizedMessage = normalizeText(messageText);
  
  if (config.recruitment_bot_enabled) {
    const match = config.recruitment_bot_keywords.some(kw => normalizedMessage.includes(normalizeText(kw)));
    if (match) return 'recruitment';
  }
  
  if (config.sales_bot_enabled) {
    const match = config.sales_bot_keywords.some(kw => normalizedMessage.includes(normalizeText(kw)));
    if (match) return 'sales';
  }
  
  if (config.support_bot_enabled) {
    const match = config.support_bot_keywords.some(kw => normalizedMessage.includes(normalizeText(kw)));
    if (match) return 'support';
  }
  
  if (config.support_bot_enabled) return 'support';
  return 'sales';
}

function getBotLabel(botType: BotType): string {
  switch (botType) {
    case 'sales': return '💰 Vendas';
    case 'recruitment': return '👥 Recrutamento';
    case 'support': return '❓ Suporte';
  }
}

function stripMarkdown(text: string): string {
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/_/g, '').replace(/~/g, '');
}

function isInstitutionalRestart(text: string): boolean {
  const normalized = normalizeText(stripMarkdown(text));
  return (
    normalized.includes('sou o assistente virtual do mostralo') &&
    (normalized.includes('vendas') || normalized.includes('planos')) &&
    (normalized.includes('suporte') || normalized.includes('como posso te ajudar'))
  );
}

// Enviar mensagem via UaZapi
async function sendViaUaZapi(apiUrl: string, token: string, phone: string, text: string): Promise<boolean> {
  try {
    const resp = await fetch(`${apiUrl}/send/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': token },
      body: JSON.stringify({ number: phone, text }),
    });
    const respText = await resp.text();
    console.log(`[master-webhook] 📤 UaZapi send: ${resp.status} - ${respText.substring(0, 100)}`);
    return resp.ok;
  } catch (e) {
    console.error('[master-webhook] ❌ Erro ao enviar via UaZapi:', e);
    return false;
  }
}

// Executar tool call do master-faq-agent
async function executeToolCall(supabaseUrl: string, toolName: string, toolArgs: any, config: any): Promise<string> {
  try {
    const resp = await fetch(`${supabaseUrl}/functions/v1/master-faq-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
      body: JSON.stringify({
        tool_name: toolName,
        tool_args: toolArgs,
        config_id: config.id,
      }),
    });
    
    if (resp.ok) {
      const data = await resp.json();
      return JSON.stringify(data.result || data);
    }
    
    const errText = await resp.text();
    return JSON.stringify({ error: `Tool ${toolName} failed: ${errText.substring(0, 100)}` });
  } catch (e) {
    return JSON.stringify({ error: `Tool ${toolName} error: ${(e as Error).message}` });
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const payload = await req.json();
    
    // Suportar formato UaZapi
    const eventType = payload.EventType || payload.event || payload.type;
    const instanceName = payload.instanceName || payload.instance?.instanceName;
    
    console.log(`[master-webhook] 📥 Evento: ${eventType} | Instância: ${instanceName}`);

    // Aceitar apenas mensagens recebidas
    if (eventType !== 'messages' && eventType !== 'messages.upsert') {
      return new Response(JSON.stringify({ success: true, ignored: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extrair dados (formato UaZapi)
    const msg = payload.message || payload.data?.message || {};
    const chat = payload.chat || {};
    
    const fromMe = msg.fromMe === true || msg.fromMe === 'true' || msg.key?.fromMe === true;
    const messageId = msg.messageid || msg.id || msg.key?.id || null;
    if (fromMe) {
      return new Response(JSON.stringify({ success: true, self_message: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extrair texto
    const messageText = msg.text || msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    if (!messageText) {
      return new Response(JSON.stringify({ success: true, no_text: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extrair número
    const remoteJid = msg.chatid || msg.sender_pn || msg.key?.remoteJid || '';
    const phoneNumber = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '').replace(/\D/g, '');
    const contactName = msg.senderName || msg.pushName || chat.name || 'Contato';

    // Ignorar grupos
    if (remoteJid.includes('@g.us') || msg.isGroup) {
      return new Response(JSON.stringify({ success: true, group: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[master-webhook] 📱 Mensagem de: ${phoneNumber} - ${contactName}: ${messageText.substring(0, 50)}`);
    console.log(`[master-webhook] 🧾 MSG_META id=${messageId || 'N/A'} | fromMe=${fromMe} | remoteJid=${remoteJid} | textLen=${messageText.length}`);

    // Buscar configuração
    const { data: config, error: configError } = await supabase
      .from('master_whatsapp_config')
      .select('*')
      .eq('instance_name', instanceName)
      .single();

    if (configError || !config) {
      console.error('[master-webhook] ❌ Config não encontrada para instância:', instanceName);
      return new Response(JSON.stringify({ success: false, error: 'Config not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se tem Assistant configurado
    if (!config.unified_openai_assistant_id || !config.openai_api_key) {
      console.log('[master-webhook] ⚠️ Assistente não configurado, ignorando mensagem');
      return new Response(JSON.stringify({ success: true, no_assistant: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar UaZapi config para envio
    const { data: uazapiConfig } = await supabase
      .from('uazapi_config')
      .select('api_url')
      .order('is_active', { ascending: false })
      .limit(1)
      .single();

    if (!uazapiConfig?.api_url || !config.evolution_instance_id) {
      console.error('[master-webhook] ❌ UaZapi config ou token não encontrado');
      return new Response(JSON.stringify({ success: false, error: 'UaZapi config missing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const uazapiUrl = uazapiConfig.api_url.replace(/\/$/, '');
    const instanceToken = config.evolution_instance_id;

    // Gerenciar sessão - buscar thread persistente
    let existingSession: any = null;
    const { data: sessionData, error: sessionError } = await supabase
      .from('master_whatsapp_sessions')
      .select('id, config_id, phone_number, active_bot_type, bot_paused, messages_count, metadata')
      .eq('config_id', config.id)
      .eq('phone_number', phoneNumber)
      .maybeSingle();

    if (sessionError) {
      console.warn('[master-webhook] ⚠️ Erro ao buscar sessão (tentando sem metadata):', sessionError.message);
      // Fallback: buscar sem metadata
      const { data: fallbackSession } = await supabase
        .from('master_whatsapp_sessions')
        .select('id, config_id, phone_number, active_bot_type, bot_paused, messages_count')
        .eq('config_id', config.id)
        .eq('phone_number', phoneNumber)
        .maybeSingle();
      if (fallbackSession) {
        existingSession = { ...fallbackSession, metadata: {} };
      }
    } else {
      existingSession = sessionData;
    }

    let botType: BotType;
    let isNewSession = false;
    let threadId: string | null = existingSession?.metadata?.openai_thread_id || null;
    const existingMetadata = ((existingSession?.metadata && typeof existingSession.metadata === 'object')
      ? existingSession.metadata
      : {}) as Record<string, unknown>;
    const lastIncomingMessageId = typeof existingMetadata.last_incoming_message_id === 'string'
      ? existingMetadata.last_incoming_message_id
      : null;

    if (messageId && lastIncomingMessageId === messageId) {
      console.log(`[master-webhook] ⏭️ Mensagem duplicada ignorada: ${messageId}`);
      return new Response(JSON.stringify({ success: true, duplicate: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[master-webhook] 🔍 Sessão existente: ${!!existingSession} | Thread salvo: ${threadId || 'nenhum'} | Bot pausado: ${existingSession?.bot_paused}`);

    if (existingSession && !existingSession.bot_paused) {
      botType = existingSession.active_bot_type as BotType;
      
      await supabase
        .from('master_whatsapp_sessions')
        .update({
          messages_count: (existingSession.messages_count || 0) + 1,
          last_message_at: new Date().toISOString()
        })
        .eq('id', existingSession.id);
    } else {
      botType = detectBotType(messageText, config as unknown as MasterWhatsAppConfig);
      isNewSession = true;
      threadId = null; // Reset thread for new session
      
      if (existingSession) {
        await supabase
          .from('master_whatsapp_sessions')
          .update({
            active_bot_type: botType,
            bot_paused: false,
            paused_at: null,
            paused_reason: null,
            messages_count: (existingSession.messages_count || 0) + 1,
            last_message_at: new Date().toISOString(),
            metadata: { openai_thread_id: null },
          })
          .eq('id', existingSession.id);
      } else {
        await supabase
          .from('master_whatsapp_sessions')
          .insert({
            config_id: config.id,
            phone_number: phoneNumber,
            contact_name: contactName,
            active_bot_type: botType,
            messages_count: 1,
            metadata: { openai_thread_id: null },
          });
      }
    }

    console.log(`[master-webhook] 🤖 Bot: ${getBotLabel(botType)} | Thread: ${threadId || 'nova'}`);

    // ========================================
    // ORQUESTRAÇÃO OpenAI Assistants API
    // ========================================
    const openaiHeaders = {
      'Authorization': `Bearer ${config.openai_api_key}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2',
    };

    // 1. Criar ou reutilizar thread
    if (!threadId) {
      const threadResp = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: openaiHeaders,
        body: JSON.stringify({}),
      });
      
      if (!threadResp.ok) {
        const err = await threadResp.text();
        console.error('[master-webhook] ❌ Erro ao criar thread:', err);
        return new Response(JSON.stringify({ success: false, error: 'Failed to create thread' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const thread = await threadResp.json();
      threadId = thread.id;
      console.log(`[master-webhook] 🆕 Thread criada: ${threadId}`);
    }

    // Para follow-ups, injetar dica de contexto na thread ANTES da mensagem do usuário
    if (isFollowUpMessage) {
      console.log(`[master-webhook] 📌 Injetando contexto de continuação na thread`);
      await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        method: 'POST',
        headers: openaiHeaders,
        body: JSON.stringify({
          role: 'user',
          content: '[SISTEMA INTERNO - NÃO EXIBIR AO CLIENTE]: Esta é uma continuação da conversa. O cliente já foi saudado. NÃO repita a saudação inicial, NÃO repita o menu de Vendas/Parcerias/Suporte. Responda DIRETAMENTE à próxima mensagem do cliente.',
          metadata: { type: 'system_hint' },
        }),
      });
    }

    const contextualMessage = contactName && contactName !== 'Contato'
      ? `[Cliente: ${contactName}] ${messageText}`
      : messageText;

    let messageResp = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: openaiHeaders,
      body: JSON.stringify({ role: 'user', content: contextualMessage }),
    });

    if (!messageResp.ok) {
      const addMsgError = await messageResp.text();
      console.warn(`[master-webhook] ⚠️ Falha ao adicionar mensagem na thread (${messageResp.status}): ${addMsgError.substring(0, 180)}`);

      const shouldRecreateThread = messageResp.status === 404 || addMsgError.toLowerCase().includes('no thread found');
      if (shouldRecreateThread) {
        const threadResp = await fetch('https://api.openai.com/v1/threads', {
          method: 'POST',
          headers: openaiHeaders,
          body: JSON.stringify({}),
        });

        if (threadResp.ok) {
          const recreatedThread = await threadResp.json();
          threadId = recreatedThread.id;
          console.log(`[master-webhook] ♻️ Thread recriada após falha: ${threadId}`);

          messageResp = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            method: 'POST',
            headers: openaiHeaders,
            body: JSON.stringify({ role: 'user', content: contextualMessage }),
          });
        }
      }

      if (!messageResp.ok) {
        await sendViaUaZapi(
          uazapiUrl,
          instanceToken,
          phoneNumber,
          'Desculpe, tive uma falha de contexto agora. Pode repetir sua última mensagem em seguida? 🙏'
        );
        return new Response(JSON.stringify({ success: false, error: 'Failed to append message to thread' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 3. Criar Run + polling
    const isFollowUpMessage = Boolean(
      existingSession &&
      !isNewSession &&
      (existingSession.messages_count || 0) >= 1
    );

    const followUpInstructions = 'Esta conversa já está em andamento. NÃO reinicie com apresentação institucional, NÃO repita o menu de Vendas/Parcerias/Suporte e responda diretamente a última mensagem do cliente usando o contexto da thread.';

    const runAssistant = async (additionalInstructions?: string) => {
      const runPayload: Record<string, unknown> = {
        assistant_id: config.unified_openai_assistant_id,
      };

      if (additionalInstructions) {
        runPayload.additional_instructions = additionalInstructions;
      }

      const runResp = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
        method: 'POST',
        headers: openaiHeaders,
        body: JSON.stringify(runPayload),
      });

      if (!runResp.ok) {
        const err = await runResp.text();
        throw new Error(`Failed to create run: ${err.substring(0, 180)}`);
      }

      let run = await runResp.json();
      console.log(`[master-webhook] 🏃 Run criado: ${run.id} | Status: ${run.status}`);

      const MAX_POLLS = 30;
      const POLL_INTERVAL = 2000;

      for (let i = 0; i < MAX_POLLS; i++) {
        if (run.status === 'completed') break;

        if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
          console.error(`[master-webhook] ❌ Run ${run.status}: ${run.last_error?.message || 'unknown'}`);
          return run;
        }

        if (run.status === 'requires_action') {
          const toolCalls = run.required_action?.submit_tool_outputs?.tool_calls || [];
          console.log(`[master-webhook] 🔧 ${toolCalls.length} tool calls necessárias`);

          const toolOutputs = [];
          for (const toolCall of toolCalls) {
            const toolName = toolCall.function.name;
            let toolArgs = {};
            try {
              toolArgs = JSON.parse(toolCall.function.arguments || '{}');
            } catch {
              toolArgs = {};
            }

            console.log(`[master-webhook] 🔧 Tool: ${toolName}`);
            const result = await executeToolCall(supabaseUrl, toolName, toolArgs, config);

            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: result,
            });
          }

          const submitResp = await fetch(
            `https://api.openai.com/v1/threads/${threadId}/runs/${run.id}/submit_tool_outputs`,
            {
              method: 'POST',
              headers: openaiHeaders,
              body: JSON.stringify({ tool_outputs: toolOutputs }),
            }
          );

          if (submitResp.ok) {
            run = await submitResp.json();
            continue;
          }
        }

        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));

        const pollResp = await fetch(
          `https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`,
          { method: 'GET', headers: openaiHeaders }
        );

        if (pollResp.ok) {
          run = await pollResp.json();
        }
      }

      return run;
    };

    const fetchLatestAssistantReply = async (): Promise<string> => {
      const msgsResp = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/messages?order=desc&limit=5`,
        { method: 'GET', headers: openaiHeaders }
      );

      if (!msgsResp.ok) return '';

      const msgsData = await msgsResp.json();
      const assistantMessages = (msgsData.data || []).filter((m: any) => m.role === 'assistant');
      if (assistantMessages.length === 0) return '';

      return assistantMessages[0].content
        ?.filter((c: any) => c.type === 'text')
        .map((c: any) => c.text?.value || '')
        .join('\n') || '';
    };

    try {
      const run = await runAssistant(isFollowUpMessage ? followUpInstructions : undefined);

      if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
        await sendViaUaZapi(
          uazapiUrl,
          instanceToken,
          phoneNumber,
          'Desculpe, tive um problema ao processar sua mensagem. Tente novamente! 🙏'
        );
      } else if (run.status === 'completed') {
        let replyText = await fetchLatestAssistantReply();

        if (isFollowUpMessage && replyText && isInstitutionalRestart(replyText)) {
          console.log('[master-webhook] 🔁 Resposta genérica detectada em follow-up, forçando resposta contextual');

          const forcedRun = await runAssistant(
            `A conversa já está em andamento e você acabou de repetir uma apresentação genérica. Responda APENAS à última mensagem do cliente (${messageText}) com objetividade, sem se apresentar novamente e sem repetir menu institucional.`
          );

          if (forcedRun.status === 'completed') {
            replyText = await fetchLatestAssistantReply();
          }
        }

        if (replyText) {
          console.log(`[master-webhook] 📤 Enviando resposta (${replyText.length} chars)`);
          await sendViaUaZapi(uazapiUrl, instanceToken, phoneNumber, replyText);
        }
      }
    } catch (runError) {
      console.error('[master-webhook] ❌ Erro ao executar run:', runError);
      await sendViaUaZapi(
        uazapiUrl,
        instanceToken,
        phoneNumber,
        'Desculpe, estou com dificuldade técnica. Tente novamente em alguns instantes! 🙏'
      );
      return new Response(JSON.stringify({ success: false, error: 'Failed to create run' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 6. Salvar thread + dedup metadata na sessão
    const sessionId = existingSession?.id;
    const nextMetadata = {
      ...(existingMetadata as Record<string, unknown>),
      openai_thread_id: threadId,
      ...(messageId ? { last_incoming_message_id: messageId } : {}),
    };

    if (sessionId && threadId) {
      await supabase
        .from('master_whatsapp_sessions')
        .update({ metadata: nextMetadata })
        .eq('id', sessionId);
    } else if (!existingSession && threadId) {
      await supabase
        .from('master_whatsapp_sessions')
        .update({ metadata: nextMetadata })
        .eq('config_id', config.id)
        .eq('phone_number', phoneNumber);
    }

    console.log(`[master-webhook] ✅ Webhook processado com sucesso`);

    return new Response(JSON.stringify({ 
      success: true, 
      botType,
      isNewSession,
      phoneNumber,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[master-webhook] ❌ Erro no webhook:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
