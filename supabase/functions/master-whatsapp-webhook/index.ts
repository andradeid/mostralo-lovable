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
  // Behavior configs per bot type
  [key: string]: any;
}

type BotType = 'sales' | 'recruitment' | 'support';

// ========== Bot behavior helper ==========
interface BotBehavior {
  stop_bot_from_me: boolean;
  auto_reactivate_minutes: number;
  listening_from_me: boolean;
  delay_message: number;       // ms
  debounce_time: number;       // seconds
  split_messages: boolean;
  time_per_char: number;       // ms
  expire_minutes: number;
  keep_open: boolean;
  keyword_finish: string;
  unknown_message: string;
}

function getBotBehavior(config: MasterWhatsAppConfig, botType: BotType): BotBehavior {
  const prefix = `${botType}_bot_`;
  return {
    stop_bot_from_me: config[`${prefix}stop_from_me`] ?? true,
    auto_reactivate_minutes: config[`${prefix}auto_reactivate_minutes`] ?? 5,
    listening_from_me: config[`${prefix}listening_from_me`] ?? false,
    delay_message: config[`${prefix}delay_message`] ?? 1500,
    debounce_time: config[`${prefix}debounce_time`] ?? 3,
    split_messages: config[`${prefix}split_messages`] ?? true,
    time_per_char: config[`${prefix}time_per_char`] ?? 50,
    expire_minutes: config[`${prefix}expire_minutes`] ?? 60,
    keep_open: config[`${prefix}keep_open`] ?? false,
    keyword_finish: config[`${prefix}keyword_finish`] ?? '#sair',
    unknown_message: config[`${prefix}unknown_message`] ?? 'Desculpe, não entendi. Pode reformular?',
  };
}

// ========== Debounce store (in-memory per isolate) ==========
const debounceTimers: Map<string, { timer: number; messages: string[] }> = new Map();

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

// ========== Marcar mensagem como lida ==========
async function markAsRead(apiUrl: string, token: string, messageId: string | null): Promise<void> {
  if (!messageId) {
    console.warn('[master-webhook] ⚠️ markAsRead: sem messageId, ignorando');
    return;
  }
  try {
    const resp = await fetch(`${apiUrl}/message/markread`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': token },
      body: JSON.stringify({ id: [messageId] }),
    });
    const body = await resp.text();
    console.log(`[master-webhook] 👁️ READ_RECEIPT | msgId=${messageId} | status=${resp.status} | body=${body.substring(0, 100)}`);
  } catch (e) {
    console.warn('[master-webhook] ⚠️ Read receipt falhou:', (e as Error).message);
  }
}

// ========== Enviar presença (digitando) ==========
async function sendPresence(apiUrl: string, token: string, phone: string, delayMs: number, presence: string = 'composing'): Promise<void> {
  try {
    const resp = await fetch(`${apiUrl}/message/presence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': token },
      body: JSON.stringify({ number: phone, presence, delay: delayMs }),
    });
    console.log(`[master-webhook] ⌨️ PRESENCE | ${presence} | ${phone} | delay=${delayMs}ms | status=${resp.status}`);
  } catch (e) {
    console.warn('[master-webhook] ⚠️ Presença falhou:', (e as Error).message);
  }
}

// ========== Enviar mensagem via UaZapi ==========
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

// ========== Split messages helper ==========
function splitIntoMessages(text: string): string[] {
  // Split by double newline (paragraphs) or numbered lists
  const parts: string[] = [];
  const paragraphs = text.split(/\n{2,}/);
  
  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (trimmed) parts.push(trimmed);
  }
  
  // If only 1 part or text is short, don't split
  if (parts.length <= 1 || text.length < 300) return [text];
  
  return parts;
}

// ========== Executar tool call ==========
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

// ========== Main handler ==========
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const payload = await req.json();
    
    const eventType = payload.EventType || payload.event || payload.type;
    const instanceName = payload.instanceName || payload.instance?.instanceName;
    
    console.log(`[master-webhook] 📥 Evento: ${eventType} | Instância: ${instanceName}`);

    if (eventType !== 'messages' && eventType !== 'messages.upsert') {
      return new Response(JSON.stringify({ success: true, ignored: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const msg = payload.message || payload.data?.message || {};
    const chat = payload.chat || {};
    
    const fromMe = msg.fromMe === true || msg.fromMe === 'true' || msg.key?.fromMe === true;
    const messageId = msg.messageid || msg.id || msg.key?.id || null;

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

    // Buscar sessão existente
    let existingSession: any = null;
    const { data: sessionData, error: sessionError } = await supabase
      .from('master_whatsapp_sessions')
      .select('id, config_id, phone_number, active_bot_type, bot_paused, messages_count, metadata, last_message_at, paused_at')
      .eq('config_id', config.id)
      .eq('phone_number', phoneNumber)
      .maybeSingle();

    if (sessionError) {
      console.warn('[master-webhook] ⚠️ Erro ao buscar sessão:', sessionError.message);
      const { data: fallbackSession } = await supabase
        .from('master_whatsapp_sessions')
        .select('id, config_id, phone_number, active_bot_type, bot_paused, messages_count, last_message_at, paused_at')
        .eq('config_id', config.id)
        .eq('phone_number', phoneNumber)
        .maybeSingle();
      if (fallbackSession) {
        existingSession = { ...fallbackSession, metadata: {} };
      }
    } else {
      existingSession = sessionData;
    }

    // Detectar tipo de bot
    let botType: BotType = existingSession?.active_bot_type as BotType || detectBotType(messageText, config as unknown as MasterWhatsAppConfig);
    const behavior = getBotBehavior(config as unknown as MasterWhatsAppConfig, botType);

    console.log(`[master-webhook] ⚙️ BEHAVIOR | delay=${behavior.delay_message}ms | debounce=${behavior.debounce_time}s | split=${behavior.split_messages} | timePerChar=${behavior.time_per_char}ms | expire=${behavior.expire_minutes}min | stopFromMe=${behavior.stop_bot_from_me} | keywordFinish=${behavior.keyword_finish}`);

    // ========== fromMe handling ==========
    if (fromMe) {
      // Se stop_bot_from_me está ativo, pausar o bot para este contato
      if (behavior.stop_bot_from_me && existingSession && !existingSession.bot_paused) {
        console.log(`[master-webhook] ⏸️ PAUSE_BOT | Atendente respondeu manualmente, pausando bot para ${phoneNumber}`);
        await supabase
          .from('master_whatsapp_sessions')
          .update({ 
            bot_paused: true, 
            paused_at: new Date().toISOString(),
            paused_reason: 'attendant_reply' 
          })
          .eq('id', existingSession.id);
      }
      
      // Se listening_from_me está desativado, ignorar mensagens próprias
      if (!behavior.listening_from_me) {
        return new Response(JSON.stringify({ success: true, self_message: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== Keyword finish ==========
    if (behavior.keyword_finish && normalizeText(messageText) === normalizeText(behavior.keyword_finish)) {
      console.log(`[master-webhook] 🛑 KEYWORD_FINISH | Cliente enviou "${messageText}", encerrando sessão`);
      if (existingSession) {
        await supabase
          .from('master_whatsapp_sessions')
          .update({ 
            bot_paused: true, 
            paused_at: new Date().toISOString(),
            paused_reason: 'keyword_finish',
            metadata: { ...(existingSession.metadata || {}), openai_thread_id: null },
          })
          .eq('id', existingSession.id);
      }
      return new Response(JSON.stringify({ success: true, keyword_finish: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ========== Session expiry check ==========
    if (existingSession && !behavior.keep_open && existingSession.last_message_at) {
      const lastMsgTime = new Date(existingSession.last_message_at).getTime();
      const now = Date.now();
      const expireMs = behavior.expire_minutes * 60 * 1000;
      if ((now - lastMsgTime) > expireMs) {
        console.log(`[master-webhook] ⏰ SESSION_EXPIRED | Última msg há ${Math.round((now - lastMsgTime) / 60000)} min (limite: ${behavior.expire_minutes}min). Resetando sessão.`);
        existingSession = null; // Tratar como nova sessão
      }
    }

    // ========== Auto-reactivate check ==========
    if (existingSession?.bot_paused && behavior.auto_reactivate_minutes > 0 && existingSession.paused_at) {
      const pausedTime = new Date(existingSession.paused_at).getTime();
      const now = Date.now();
      const reactivateMs = behavior.auto_reactivate_minutes * 60 * 1000;
      if ((now - pausedTime) > reactivateMs) {
        console.log(`[master-webhook] 🔄 AUTO_REACTIVATE | Bot pausado há ${Math.round((now - pausedTime) / 60000)} min (limite: ${behavior.auto_reactivate_minutes}min). Reativando.`);
        await supabase
          .from('master_whatsapp_sessions')
          .update({ bot_paused: false, paused_at: null, paused_reason: null })
          .eq('id', existingSession.id);
        existingSession.bot_paused = false;
      }
    }

    // ========== Bot paused check ==========
    if (existingSession?.bot_paused) {
      console.log(`[master-webhook] ⏸️ BOT_PAUSED | Bot pausado para ${phoneNumber}, ignorando mensagem`);
      return new Response(JSON.stringify({ success: true, bot_paused: true }), {
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

    // Buscar UaZapi config
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

    // ========== Marcar como lido + presença digitando IMEDIATAMENTE ==========
    await Promise.all([
      markAsRead(uazapiUrl, instanceToken, phoneNumber),
      sendPresence(uazapiUrl, instanceToken, phoneNumber, 60000, 'composing'),
    ]);

    // ========== Debounce logic ==========
    // Edge Functions são stateless, então usamos um delay simples
    // em vez de acumular mensagens (que exigiria um sistema externo)
    if (behavior.debounce_time > 0) {
      console.log(`[master-webhook] ⏳ DEBOUNCE | Aguardando ${behavior.debounce_time}s para acumular mensagens`);
      await new Promise(resolve => setTimeout(resolve, behavior.debounce_time * 1000));
    }

    // ========== Dedup check ==========
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

    // ========== Session management ==========
    let isNewSession = false;
    let threadId: string | null = existingMetadata.openai_thread_id as string || null;

    console.log(`[master-webhook] 🔍 Sessão existente: ${!!existingSession} | Thread salvo: ${threadId || 'nenhum'}`);

    if (existingSession) {
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
      threadId = null;
      
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

    console.log(`[master-webhook] 🤖 Bot: ${getBotLabel(botType)} | Thread: ${threadId || 'nova'}`);

    const isFollowUpMessage = Boolean(existingSession && !isNewSession && (existingSession.messages_count || 0) >= 1);
    console.log(`[master-webhook] 🧠 CONTEXT_CHECK | isFollowUp=${isFollowUpMessage} | isNewSession=${isNewSession}`);
    // Presença já foi enviada no início (markAsRead + composing)
    // ========== OpenAI Assistants API ==========
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
    } else {
      console.log(`[master-webhook] ♻️ Reutilizando thread: ${threadId}`);
    }

    // Context hint for follow-ups
    if (isFollowUpMessage) {
      console.log('[master-webhook] 📌 CONTEXT_HINT: injetando dica de continuação');
      await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        method: 'POST',
        headers: openaiHeaders,
        body: JSON.stringify({
          role: 'user',
          content: '[SISTEMA INTERNO - NÃO EXIBIR AO CLIENTE]: Esta é uma continuação da conversa. NÃO repita a saudação inicial ou menu. Responda DIRETAMENTE.',
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
      console.warn(`[master-webhook] ⚠️ Falha ao adicionar msg (${messageResp.status}): ${addMsgError.substring(0, 180)}`);

      if (messageResp.status === 404 || addMsgError.toLowerCase().includes('no thread found')) {
        const threadResp = await fetch('https://api.openai.com/v1/threads', {
          method: 'POST',
          headers: openaiHeaders,
          body: JSON.stringify({}),
        });

        if (threadResp.ok) {
          const recreatedThread = await threadResp.json();
          threadId = recreatedThread.id;
          console.log(`[master-webhook] ♻️ Thread recriada: ${threadId}`);
          messageResp = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            method: 'POST',
            headers: openaiHeaders,
            body: JSON.stringify({ role: 'user', content: contextualMessage }),
          });
        }
      }

      if (!messageResp.ok) {
        await sendViaUaZapi(uazapiUrl, instanceToken, phoneNumber, 'Desculpe, tive uma falha. Pode repetir? 🙏');
        return new Response(JSON.stringify({ success: false, error: 'Failed to append message' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    await messageResp.text();
    console.log(`[master-webhook] ✅ USER_MESSAGE anexada na thread ${threadId}`);

    // 3. Criar Run + polling
    const followUpInstructions = 'Esta conversa já está em andamento. NÃO reinicie com apresentação institucional, NÃO repita menu. Responda diretamente.';

    const runAssistant = async (additionalInstructions?: string) => {
      const runPayload: Record<string, unknown> = {
        assistant_id: config.unified_openai_assistant_id,
      };
      if (additionalInstructions) {
        runPayload.additional_instructions = additionalInstructions;
      }

      console.log(`[master-webhook] 🚀 RUN_START | thread=${threadId}`);

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
      console.log(`[master-webhook] 🏃 Run: ${run.id} | Status: ${run.status}`);

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
          console.log(`[master-webhook] 🔧 TOOLS_REQUIRED | total=${toolCalls.length}`);

          const toolOutputs = [];
          for (const toolCall of toolCalls) {
            const toolName = toolCall.function.name;
            let toolArgs = {};
            try { toolArgs = JSON.parse(toolCall.function.arguments || '{}'); } catch { toolArgs = {}; }
            console.log(`[master-webhook] 🔧 TOOL_CALL | ${toolName}`);
            const result = await executeToolCall(supabaseUrl, toolName, toolArgs, config);
            console.log(`[master-webhook] ✅ TOOL_RESULT | ${toolName} | chars=${result.length}`);
            toolOutputs.push({ tool_call_id: toolCall.id, output: result });
          }

          const submitResp = await fetch(
            `https://api.openai.com/v1/threads/${threadId}/runs/${run.id}/submit_tool_outputs`,
            { method: 'POST', headers: openaiHeaders, body: JSON.stringify({ tool_outputs: toolOutputs }) }
          );

          if (submitResp.ok) {
            run = await submitResp.json();
            console.log(`[master-webhook] ✅ TOOLS_SUBMITTED | status=${run.status}`);
            continue;
          }

          const submitErr = await submitResp.text();
          console.error(`[master-webhook] ❌ submit_tool_outputs falhou: ${submitErr.substring(0, 180)}`);
        }

        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));

        const pollResp = await fetch(
          `https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`,
          { method: 'GET', headers: openaiHeaders }
        );

        if (pollResp.ok) {
          run = await pollResp.json();
          if (i % 3 === 0 || run.status === 'completed') {
            console.log(`[master-webhook] ⏱️ RUN_POLL | ${i + 1}/${MAX_POLLS} | status=${run.status}`);
          }
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

    // ========== Send reply with behavior configs ==========
    const sendReplyWithBehavior = async (text: string) => {
      // Apply delay_message (base delay before responding)
      if (behavior.delay_message > 0) {
        console.log(`[master-webhook] ⏱️ DELAY | Aguardando ${behavior.delay_message}ms antes de responder`);
        await new Promise(resolve => setTimeout(resolve, behavior.delay_message));
      }

      // Split messages if enabled
      const messageParts = behavior.split_messages ? splitIntoMessages(text) : [text];
      console.log(`[master-webhook] 📨 SEND | parts=${messageParts.length} | split=${behavior.split_messages}`);

      for (let i = 0; i < messageParts.length; i++) {
        const part = messageParts[i];
        
        // Apply time_per_char delay (simulates typing speed) for subsequent parts
        if (i > 0 && behavior.time_per_char > 0) {
          const typingDelay = part.length * behavior.time_per_char;
          const cappedDelay = Math.min(typingDelay, 8000); // Max 8s per part
          console.log(`[master-webhook] ⌨️ TYPING_DELAY | part ${i + 1}/${messageParts.length} | ${cappedDelay}ms (${part.length} chars × ${behavior.time_per_char}ms)`);
          
          // Send presence before each part
          await sendPresence(uazapiUrl, instanceToken, phoneNumber, cappedDelay);
          await new Promise(resolve => setTimeout(resolve, cappedDelay));
        }
        
        await sendViaUaZapi(uazapiUrl, instanceToken, phoneNumber, part);
      }
    };

    try {
      const run = await runAssistant(isFollowUpMessage ? followUpInstructions : undefined);
      console.log(`[master-webhook] 🧪 RUN_END | run=${run.id} | status=${run.status}`);

      if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
        await sendViaUaZapi(uazapiUrl, instanceToken, phoneNumber, 'Desculpe, tive um problema. Tente novamente! 🙏');
      } else if (run.status === 'completed') {
        let replyText = await fetchLatestAssistantReply();
        console.log(`[master-webhook] 📝 REPLY_FETCH | chars=${replyText.length}`);

        if (isFollowUpMessage && replyText && isInstitutionalRestart(replyText)) {
          console.log('[master-webhook] 🔁 Resposta genérica em follow-up, forçando contextual');
          const forcedRun = await runAssistant(
            `Responda APENAS à última mensagem (${messageText}) com objetividade, sem apresentação.`
          );
          if (forcedRun.status === 'completed') {
            replyText = await fetchLatestAssistantReply();
            console.log(`[master-webhook] 📝 REPLY_FORCED | chars=${replyText.length}`);
          }
        }

        if (replyText) {
          await sendReplyWithBehavior(replyText);
        } else {
          console.warn('[master-webhook] ⚠️ Resposta vazia, nada enviado');
        }
      }
    } catch (runError) {
      console.error('[master-webhook] ❌ Erro no run:', runError);
      await sendViaUaZapi(uazapiUrl, instanceToken, phoneNumber, 'Desculpe, dificuldade técnica. Tente novamente! 🙏');
      return new Response(JSON.stringify({ success: false, error: 'Run failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 6. Salvar thread + dedup
    const sessionId = existingSession?.id;
    const nextMetadata = {
      ...existingMetadata,
      openai_thread_id: threadId,
      ...(messageId ? { last_incoming_message_id: messageId } : {}),
    };

    if (sessionId && threadId) {
      await supabase
        .from('master_whatsapp_sessions')
        .update({ metadata: nextMetadata })
        .eq('id', sessionId);
      console.log(`[master-webhook] 💾 SESSION_SAVED | session=${sessionId} | thread=${threadId}`);
    } else if (!existingSession && threadId) {
      await supabase
        .from('master_whatsapp_sessions')
        .update({ metadata: nextMetadata })
        .eq('config_id', config.id)
        .eq('phone_number', phoneNumber);
      console.log(`[master-webhook] 💾 SESSION_SAVED_FALLBACK | thread=${threadId}`);
    }

    console.log(`[master-webhook] ✅ Processado com sucesso`);

    return new Response(JSON.stringify({ 
      success: true, botType, isNewSession, phoneNumber,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[master-webhook] ❌ Erro:', error);
    return new Response(JSON.stringify({ 
      success: false, error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
