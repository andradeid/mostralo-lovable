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
  [key: string]: any;
}

type BotType = 'sales' | 'recruitment' | 'support';

// ========== Bot behavior helper ==========
interface BotBehavior {
  stop_bot_from_me: boolean;
  auto_reactivate_minutes: number;
  listening_from_me: boolean;
  delay_message: number;
  debounce_time: number;
  split_messages: boolean;
  time_per_char: number;
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

// ========== Converter Markdown para formato WhatsApp ==========
function markdownToWhatsApp(text: string): string {
  let result = text;
  result = result.replace(/\*\*(.+?)\*\*/g, '*$1*');
  result = result.replace(/__(.+?)__/g, '_$1_');
  return result;
}

function isInstitutionalRestart(text: string): boolean {
  const normalized = normalizeText(text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/_/g, '').replace(/~/g, ''));
  return (
    normalized.includes('sou o assistente virtual do mostralo') &&
    (normalized.includes('vendas') || normalized.includes('planos')) &&
    (normalized.includes('suporte') || normalized.includes('como posso te ajudar'))
  );
}

// ========== In-memory dedup for concurrent webhook calls ==========
const processingMessages = new Set<string>();

// ========== Cache em memória para configs (TTL 5 min) ==========
// Antes: SELECT em master_whatsapp_config + uazapi_config a cada evento útil.
// Agora: 1 query por instância a cada 5 min. Reduz drasticamente carga no pool.
const CONFIG_TTL_MS = 5 * 60 * 1000;
const masterConfigCache = new Map<string, { value: any; expiresAt: number }>();
const uazapiUrlCache: { value: string | null; expiresAt: number } = { value: null, expiresAt: 0 };

async function getMasterConfig(supabase: any, instanceName: string, fields = '*'): Promise<any | null> {
  const key = `${instanceName}|${fields}`;
  const cached = masterConfigCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const { data } = await supabase
    .from('master_whatsapp_config')
    .select(fields)
    .eq('instance_name', instanceName)
    .maybeSingle();

  masterConfigCache.set(key, { value: data || null, expiresAt: Date.now() + (data ? CONFIG_TTL_MS : 30_000) });
  return data || null;
}

async function getUazapiApiUrl(supabase: any): Promise<string | null> {
  if (uazapiUrlCache.value && uazapiUrlCache.expiresAt > Date.now()) return uazapiUrlCache.value;
  const { data } = await supabase
    .from('uazapi_config')
    .select('api_url')
    .order('is_active', { ascending: false })
    .limit(1)
    .maybeSingle();
  const url = data?.api_url || null;
  uazapiUrlCache.value = url;
  uazapiUrlCache.expiresAt = Date.now() + (url ? CONFIG_TTL_MS : 30_000);
  return url;
}

// ========== Marcar mensagem como lida ==========
async function markAsRead(apiUrl: string, token: string, messageId: string | null): Promise<void> {
  if (!messageId) return;
  try {
    const resp = await fetch(`${apiUrl}/message/markread`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': token },
      body: JSON.stringify({ id: [messageId] }),
    });
    console.log(`[master-webhook] 👁️ READ_RECEIPT | msgId=${messageId} | status=${resp.status}`);
  } catch (e) {
    console.warn('[master-webhook] ⚠️ Read receipt falhou:', (e as Error).message);
  }
}

// ========== Enviar presença (digitando) ==========
async function sendPresence(apiUrl: string, token: string, phone: string, delayMs: number, presence: string = 'composing'): Promise<void> {
  try {
    await fetch(`${apiUrl}/message/presence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': token },
      body: JSON.stringify({ number: phone, presence, delay: delayMs }),
    });
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
  const parts: string[] = [];
  const paragraphs = text.split(/\n{2,}/);
  
  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (trimmed) parts.push(trimmed);
  }
  
  if (parts.length <= 1 || text.length < 300) return [text];
  return parts;
}

function normalizeReactionPhone(value: string | null | undefined): string {
  return (value || '')
    .replace('@s.whatsapp.net', '')
    .replace('@c.us', '')
    .replace(/\D/g, '');
}

function extractReactionUpdates(payload: Record<string, any>) {
  const updates = Array.isArray(payload.data)
    ? payload.data
    : [payload.data || payload.message || payload].filter(Boolean);

  return updates
    .map((update) => {
      const reactionList = Array.isArray(update?.update?.reactions) ? update.update.reactions : [];
      const firstReaction = reactionList[0] || null;
      const targetMsgId = update?.key?.id || update?.messageid || update?.id || '';
      const remoteJid = update?.key?.remoteJid || update?.chatid || update?.sender_pn || update?.participant || '';
      const reactionPhone = normalizeReactionPhone(remoteJid);
      const reactionEmoji = firstReaction?.text || firstReaction?.reaction || update?.reaction?.text || '';
      const reactionFromMe = update?.key?.fromMe === true || update?.fromMe === true;

      if (!targetMsgId || !reactionPhone) return null;

      return {
        targetMsgId,
        reactionEmoji,
        reactionFromMe,
        reactionPhone,
      };
    })
    .filter(Boolean) as Array<{
      targetMsgId: string;
      reactionEmoji: string;
      reactionFromMe: boolean;
      reactionPhone: string;
    }>;
}

async function persistReactionUpdate(
  supabase: ReturnType<typeof createClient>,
  instanceName: string,
  targetMsgId: string,
  reactionEmoji: string,
  reactionPhone: string,
  reactionFromMe: boolean,
) {
  const { data: config } = await supabase
    .from('master_whatsapp_config')
    .select('id')
    .eq('instance_name', instanceName)
    .single();

  if (!config) {
    console.log(`[master-webhook] ⚠️ REACTION_UPDATE: config não encontrada para ${instanceName}`);
    return;
  }

  const { data: targetMsg } = await supabase
    .from('master_whatsapp_chat_messages')
    .select('id, reactions')
    .eq('config_id', config.id)
    .eq('evolution_message_id', targetMsgId)
    .maybeSingle();

  if (!targetMsg) {
    console.log(`[master-webhook] ⚠️ REACTION_UPDATE: Mensagem alvo ${targetMsgId} não encontrada`);
    return;
  }

  const existing = Array.isArray(targetMsg.reactions) ? targetMsg.reactions : [];
  const filtered = existing.filter((reaction: any) => !(reaction.from === reactionPhone || (reactionFromMe && reaction.from_me)));
  const nextReactions = reactionEmoji === ''
    ? filtered
    : [...filtered, { emoji: reactionEmoji, from: reactionPhone, from_me: reactionFromMe }];

  await supabase
    .from('master_whatsapp_chat_messages')
    .update({ reactions: nextReactions })
    .eq('id', targetMsg.id);

  console.log(`[master-webhook] 😀 REACTION_UPDATE_SAVED | ${reactionEmoji || 'removed'} on ${targetMsgId} | from=${reactionPhone} | fromMe=${reactionFromMe}`);
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

// ========== Eventos descartados sem tocar no banco ==========
// Reduz drasticamente boots/shutdowns e leituras desnecessárias.
const IGNORED_EVENT_TYPES = new Set([
  'presence', 'presence.update',
  'chats', 'chats.update', 'chats.upsert', 'chats.delete', 'chats.set',
  'connection', 'connection.update',
  'contacts', 'contacts.update', 'contacts.upsert',
  'groups', 'groups.update', 'groups.upsert',
  'labels', 'labels.association',
  'call', 'calls', 'calls.update',
  'qrcode', 'qr',
]);

// ========== Main handler ==========
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    const eventType = payload.EventType || payload.event || payload.type;
    const instanceName = payload.instanceName || payload.instance?.instanceName;

    // 🚪 PORTA DE ENTRADA: descartar eventos-lixo antes de qualquer query no banco.
    // Webhook deve ser pontual: receber → 200 OK em <50ms para tudo que não é útil.
    if (eventType && IGNORED_EVENT_TYPES.has(String(eventType).toLowerCase())) {
      return new Response(
        JSON.stringify({ success: true, ignored: true, reason: 'event_type_filtered' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[master-webhook] 📥 Evento: ${eventType} | Instância: ${instanceName}`);

    // ========== REACTION EVENT (top-level) ==========
    if (eventType === 'messages.reaction' || eventType === 'reaction') {
      const reactionData = payload.data || payload;
      const reactionMsg = reactionData.message || reactionData;
      const reactionKey = reactionMsg.reactionMessage?.key || reactionMsg.key || {};
      const targetMsgId = reactionKey.id || reactionMsg.reactionId || '';
      const reactionEmoji = reactionMsg.reactionMessage?.text || reactionMsg.text || '';
      const reactionFromMe = reactionMsg.fromMe || reactionKey.fromMe || false;
      const reactionPhone = (reactionMsg.chatid || reactionMsg.sender_pn || '').replace('@s.whatsapp.net', '').replace('@c.us', '').replace(/\D/g, '');

      if (targetMsgId && instanceName) {
        const { data: config } = await supabase.from('master_whatsapp_config').select('id').eq('instance_name', instanceName).single();
        if (config) {
          const { data: targetMsg } = await supabase
            .from('master_whatsapp_chat_messages')
            .select('id, reactions')
            .eq('config_id', config.id)
            .eq('evolution_message_id', targetMsgId)
            .maybeSingle();

          if (targetMsg) {
            const existing = (targetMsg.reactions as any[]) || [];
            if (reactionEmoji === '') {
              const filtered = existing.filter((r: any) => !(r.from === reactionPhone || (reactionFromMe && r.from_me)));
              await supabase.from('master_whatsapp_chat_messages').update({ reactions: filtered }).eq('id', targetMsg.id);
            } else {
              const filtered = existing.filter((r: any) => !(r.from === reactionPhone || (reactionFromMe && r.from_me)));
              await supabase.from('master_whatsapp_chat_messages').update({ reactions: [...filtered, { emoji: reactionEmoji, from: reactionPhone, from_me: reactionFromMe }] }).eq('id', targetMsg.id);
            }
            console.log(`[master-webhook] 😀 REACTION | ${reactionEmoji || 'removed'} on ${targetMsgId}`);
          }
        }
      }
      return new Response(JSON.stringify({ success: true, reaction: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ========== MESSAGES_UPDATE EVENT (reactions from client come here) ==========
    if (eventType === 'messages_update' || eventType === 'messages.update') {
      console.log(`[master-webhook] 🔄 messages_update payload keys: ${Object.keys(payload).join(', ')}`);
      const reactionUpdates = extractReactionUpdates(payload);

      if (reactionUpdates.length > 0 && instanceName) {
        for (const reactionUpdate of reactionUpdates) {
          console.log(`[master-webhook] 🔄 REACTION_UPDATE: emoji=${reactionUpdate.reactionEmoji} | targetId=${reactionUpdate.targetMsgId} | from=${reactionUpdate.reactionPhone} | fromMe=${reactionUpdate.reactionFromMe}`);
          await persistReactionUpdate(
            supabase,
            instanceName,
            reactionUpdate.targetMsgId,
            reactionUpdate.reactionEmoji,
            reactionUpdate.reactionPhone,
            reactionUpdate.reactionFromMe,
          );
        }
        return new Response(JSON.stringify({ success: true, reaction_update: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Fallback para formatos alternativos de reactionMessage
      const updateData = payload.data || payload.message || payload;
      const updateMsg = updateData.message || updateData;
      const reactionMessage = updateMsg.reactionMessage || updateMsg.reaction || updateMsg.content?.reactionMessage;
      if (reactionMessage && instanceName) {
        const reactionContent = reactionMessage || updateMsg.content || updateMsg;
        const reactionKey = reactionContent.key || {};
        const targetMsgId = reactionKey.id || reactionContent.reactionId || updateMsg.quotedMsgId || updateMsg.quoted_message_id || '';
        const reactionEmoji = reactionContent.text || reactionContent.emoji || '';
        const reactionFromMe = updateMsg.fromMe || reactionKey.fromMe || false;
        const reactionPhone = normalizeReactionPhone(updateMsg.chatid || updateMsg.sender_pn || updateMsg.participant || updateMsg.key?.remoteJid || '');

        if (targetMsgId && reactionPhone) {
          await persistReactionUpdate(supabase, instanceName, targetMsgId, reactionEmoji, reactionPhone, reactionFromMe);
          return new Response(JSON.stringify({ success: true, reaction_update: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }

      const rawState = payload.state || payload.event;
      console.log(`[master-webhook] 🔄 messages_update state=${rawState}, ignoring non-reaction update`);
      return new Response(JSON.stringify({ success: true, update_ignored: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (eventType !== 'messages' && eventType !== 'messages.upsert') {
      return new Response(JSON.stringify({ success: true, ignored: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const msg = payload.message || payload.data?.message || {};
    const chat = payload.chat || {};
    
    const fromMe = msg.fromMe === true || msg.fromMe === 'true' || msg.key?.fromMe === true;
    const messageId = msg.messageid || msg.id || msg.key?.id || null;

    // ========== Detect message type ==========
    const rawContent = msg.content;
    const messageContent = typeof rawContent === 'object' && rawContent !== null ? rawContent : {};
    const uaMsgType = (msg.messageType || msg.type || '').toLowerCase();

    // ========== EDITED MESSAGE ==========
    const editedReferenceId = typeof msg.edited === 'string' ? msg.edited.trim() : '';
    const isEditedEvent = !!editedReferenceId
      || uaMsgType === 'editedmessage'
      || uaMsgType === 'edited'
      || uaMsgType === 'protocolmessage'
      || !!messageContent.editedMessage
      || !!messageContent.protocolMessage?.editedMessage;

    if (isEditedEvent && instanceName) {
      const { data: config } = await supabase.from('master_whatsapp_config').select('id').eq('instance_name', instanceName).single();
      if (config) {
        const editedText = messageContent.editedMessage?.conversation
          || messageContent.editedMessage?.extendedTextMessage?.text
          || messageContent.protocolMessage?.editedMessage?.conversation
          || messageContent.protocolMessage?.editedMessage?.extendedTextMessage?.text
          || (typeof rawContent === 'string' ? rawContent : '')
          || msg.text || '';

        const previousMsgId = editedReferenceId
          || messageContent.editedMessage?.key?.id
          || messageContent.protocolMessage?.key?.id
          || messageContent.key?.id
          || msg.quoted_message_id || msg.quotedMsgId || '';

        if (previousMsgId) {
          const { data: targetMsg } = await supabase
            .from('master_whatsapp_chat_messages')
            .select('id, metadata, content')
            .eq('config_id', config.id)
            .eq('evolution_message_id', previousMsgId)
            .maybeSingle();

          if (targetMsg) {
            const prevMeta = (targetMsg.metadata && typeof targetMsg.metadata === 'object' && !Array.isArray(targetMsg.metadata))
              ? targetMsg.metadata as Record<string, unknown> : {};
            const originalContent = (prevMeta as any).original_content || targetMsg.content || '';
            const newMsgId = msg.messageid || msg.id || '';

            const updatePayload: Record<string, unknown> = {
              metadata: {
                ...prevMeta,
                edited: true,
                edited_at: new Date().toISOString(),
                original_content: originalContent,
              },
            };
            if (editedText) updatePayload.content = editedText;
            if (newMsgId) updatePayload.evolution_message_id = newMsgId;

            await supabase.from('master_whatsapp_chat_messages').update(updatePayload).eq('id', targetMsg.id);
            console.log(`[master-webhook] ✏️ EDIT applied: ${previousMsgId}`);
          }
        }
      }
      return new Response(JSON.stringify({ success: true, edited: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ========== REACTION inside messages event ==========
    if (uaMsgType === 'reactionmessage' || uaMsgType === 'reaction') {
      const reactionContent = msg.content || {};
      const targetMsgId = reactionContent.key?.id || reactionContent.id || msg.reactionId || msg.reaction_id || msg.quoted_message_id || msg.quotedMsgId || '';
      const reactionEmoji = reactionContent.text || msg.text || '';
      const reactionPhone = (msg.chatid || msg.sender_pn || '').replace('@s.whatsapp.net', '').replace('@c.us', '').replace(/\D/g, '');

      if (targetMsgId && instanceName) {
        const { data: config } = await supabase.from('master_whatsapp_config').select('id').eq('instance_name', instanceName).single();
        if (config) {
          const { data: targetMsg } = await supabase
            .from('master_whatsapp_chat_messages')
            .select('id, reactions')
            .eq('config_id', config.id)
            .eq('evolution_message_id', targetMsgId)
            .maybeSingle();

          if (targetMsg) {
            const existing = (targetMsg.reactions as any[]) || [];
            if (reactionEmoji === '') {
              const filtered = existing.filter((r: any) => !(r.from === reactionPhone || (fromMe && r.from_me)));
              await supabase.from('master_whatsapp_chat_messages').update({ reactions: filtered }).eq('id', targetMsg.id);
            } else {
              const filtered = existing.filter((r: any) => !(r.from === reactionPhone || (fromMe && r.from_me)));
              await supabase.from('master_whatsapp_chat_messages').update({ reactions: [...filtered, { emoji: reactionEmoji, from: reactionPhone, from_me: fromMe }] }).eq('id', targetMsg.id);
            }
            console.log(`[master-webhook] 😀 REACTION_INLINE | ${reactionEmoji || 'removed'} on ${targetMsgId}`);
          }
        }
      }
      return new Response(JSON.stringify({ success: true, reaction: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ========== Extract message content ==========
    const messageText = msg.text || msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    
    // Determine incoming type
    const incomingType = uaMsgType.includes('image') ? 'image' :
      uaMsgType.includes('audio') || uaMsgType.includes('ptt') ? 'audio' :
      uaMsgType.includes('video') ? 'video' :
      uaMsgType.includes('document') ? 'document' :
      uaMsgType.includes('sticker') ? 'sticker' :
      uaMsgType.includes('location') ? 'location' : 'text';

    // For non-text media without text, don't bail — handle it
    if (!messageText && incomingType === 'text') {
      return new Response(JSON.stringify({ success: true, no_text: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract phone number
    const remoteJid = msg.chatid || msg.sender_pn || msg.key?.remoteJid || '';
    const phoneNumber = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '').replace(/\D/g, '');
    const contactName = msg.senderName || msg.pushName || chat.name || 'Contato';

    if (remoteJid.includes('@g.us') || msg.isGroup) {
      return new Response(JSON.stringify({ success: true, group: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[master-webhook] 📱 Mensagem de: ${phoneNumber} - ${contactName}: ${(messageText || `[${incomingType}]`).substring(0, 50)}`);

    // ========== DEDUP LAYER 1: In-memory lock ==========
    const dedupKey = messageId || `${phoneNumber}_${messageText}_${Date.now()}`;
    if (messageId && processingMessages.has(messageId)) {
      console.log(`[master-webhook] ⏭️ DEDUP_MEMORY | Mensagem já em processamento: ${messageId}`);
      return new Response(JSON.stringify({ success: true, duplicate: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (messageId) processingMessages.add(messageId);
    if (messageId) setTimeout(() => processingMessages.delete(messageId), 60000);

    // Buscar configuração
    const { data: config, error: configError } = await supabase
      .from('master_whatsapp_config')
      .select('*')
      .eq('instance_name', instanceName)
      .single();

    if (configError || !config) {
      console.error('[master-webhook] ❌ Config não encontrada para instância:', instanceName);
      if (messageId) processingMessages.delete(messageId);
      return new Response(JSON.stringify({ success: false, error: 'Config not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ========== DEDUP LAYER 2: DB check by evolution_message_id ==========
    if (messageId) {
      const { data: existingMsg } = await supabase
        .from('master_whatsapp_chat_messages')
        .select('id')
        .eq('evolution_message_id', messageId)
        .maybeSingle();
      
      if (existingMsg) {
        console.log(`[master-webhook] ⏭️ DEDUP_DB | Mensagem já existe no banco: ${messageId}`);
        processingMessages.delete(messageId);
        return new Response(JSON.stringify({ success: true, duplicate: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== Media download & persist ==========
    let mediaUrl: string | null = null;
    let audioTranscription: string | null = null;
    const contentObj = typeof rawContent === 'object' ? rawContent : {};
    const contentUrl = contentObj?.URL || contentObj?.url || contentObj?.directPath || null;
    mediaUrl = msg.fileURL || contentUrl || null;
    const mediaFilename = contentObj?.fileName || null;
    const mediaMimetype = contentObj?.mimetype || null;

    const mediaTypes = ['audio', 'image', 'video', 'sticker', 'document'];
    if (mediaTypes.includes(incomingType) && messageId) {
      try {
        const { data: uazapiConfig } = await supabase.from('uazapi_config').select('api_url').limit(1).maybeSingle();
        const serverUrl = uazapiConfig?.api_url?.replace(/\/+$/, '');
        const instToken = config.evolution_instance_id;

        if (instToken && serverUrl) {
          const downloadBody: any = { id: messageId, return_link: true };
          if (incomingType === 'audio') { downloadBody.generate_mp3 = true; downloadBody.transcribe = true; }

          const downloadResp = await fetch(`${serverUrl}/message/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'token': instToken },
            body: JSON.stringify(downloadBody),
          });

          if (downloadResp.ok) {
            const downloadData = await downloadResp.json();
            const fileUrl = downloadData.fileURL || downloadData.url;
            if (fileUrl) {
              const fileResponse = await fetch(fileUrl);
              if (fileResponse.ok) {
                const fileBytes = new Uint8Array(await fileResponse.arrayBuffer());
                const extMap: Record<string, string> = { audio: 'mp3', image: 'jpg', video: 'mp4', sticker: 'webp', document: 'pdf' };
                const mimeMap: Record<string, string> = { audio: 'audio/mpeg', image: 'image/jpeg', video: 'video/mp4', sticker: 'image/webp', document: 'application/pdf' };
                const docFileName = mediaFilename || '';
                const docExt = docFileName.includes('.') ? docFileName.split('.').pop()!.toLowerCase() : null;
                const ext = (incomingType === 'document' && docExt) ? docExt : (extMap[incomingType] || 'bin');
                const mime = mediaMimetype || downloadData.mimetype || mimeMap[incomingType] || 'application/octet-stream';
                const storagePath = `master/${phoneNumber}/${Date.now()}_${messageId}.${ext}`;

                const { error: uploadError } = await supabase.storage
                  .from('whatsapp-chat-media')
                  .upload(storagePath, fileBytes, { contentType: (mime as string).split(';')[0].trim(), upsert: false });

                if (!uploadError) {
                  const { data: publicUrlData } = supabase.storage.from('whatsapp-chat-media').getPublicUrl(storagePath);
                  mediaUrl = publicUrlData.publicUrl;
                  console.log(`[master-webhook] ✅ Mídia persistida: ${mediaUrl?.substring(0, 80)}`);
                } else {
                  console.warn('[master-webhook] ⚠️ Upload erro:', uploadError.message);
                }
              } else { await fileResponse.text(); }
            }
            if (downloadData.transcription) {
              audioTranscription = downloadData.transcription;
              console.log(`[master-webhook] ✅ Transcrição UaZapi: "${audioTranscription?.slice(0, 100)}"`);
            }
          } else { await downloadResp.text(); }
        }

        // Whisper fallback for audio
        if (incomingType === 'audio' && !audioTranscription && mediaUrl) {
          const OPENAI_KEY = config.openai_api_key || Deno.env.get('OPENAI_API_KEY');
          if (OPENAI_KEY) {
            try {
              const audioResp = await fetch(mediaUrl);
              if (audioResp.ok) {
                const audioBytes = new Uint8Array(await audioResp.arrayBuffer());
                const formData = new FormData();
                formData.append('file', new Blob([audioBytes], { type: 'audio/mpeg' }), 'audio.mp3');
                formData.append('model', 'whisper-1');
                formData.append('language', 'pt');
                formData.append('response_format', 'text');
                const whisperResp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                  method: 'POST', headers: { 'Authorization': `Bearer ${OPENAI_KEY}` }, body: formData,
                });
                if (whisperResp.ok) {
                  audioTranscription = (await whisperResp.text()).trim();
                  console.log(`[master-webhook] ✅ Transcrição Whisper: "${audioTranscription?.slice(0, 100)}"`);
                } else { await whisperResp.text(); }
              } else { await audioResp.text(); }
            } catch (whisperErr) { console.error(`[master-webhook] ❌ Whisper:`, whisperErr); }
          }
        }
      } catch (dlErr) { console.error(`[master-webhook] ❌ Download mídia:`, dlErr); }
    }

    // ========== Quoted/reply context ==========
    let quotedMessageDbId: string | null = null;
    let quotedContentData: any = null;
    const contextInfo = typeof rawContent === 'object' ? rawContent?.contextInfo : null;

    if (contextInfo?.quotedMessage || msg.quoted) {
      const quotedMsg = contextInfo?.quotedMessage;
      let quotedText = '';
      if (typeof quotedMsg === 'string') quotedText = quotedMsg;
      else if (typeof quotedMsg === 'object' && quotedMsg) {
        quotedText = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || quotedMsg.imageMessage?.caption || quotedMsg.videoMessage?.caption || '';
      }
      if (!quotedText && msg.quoted && typeof msg.quoted === 'string') {
        if (!/^[0-9A-F]{20,}$/i.test(msg.quoted)) quotedText = msg.quoted;
      }
      let quotedType = 'text';
      if (quotedMsg?.imageMessage) quotedType = 'image';
      else if (quotedMsg?.videoMessage) quotedType = 'video';
      else if (quotedMsg?.audioMessage) quotedType = 'audio';
      else if (quotedMsg?.documentMessage) quotedType = 'document';
      quotedContentData = { content: quotedText || null, message_type: quotedType };

      if (contextInfo?.stanzaId) {
        const { data: quotedDbMsg } = await supabase
          .from('master_whatsapp_chat_messages')
          .select('id, sender_name, content')
          .eq('config_id', config.id)
          .eq('evolution_message_id', contextInfo.stanzaId)
          .maybeSingle();
        if (quotedDbMsg) {
          quotedMessageDbId = quotedDbMsg.id;
          if (quotedDbMsg.sender_name) quotedContentData.sender_name = quotedDbMsg.sender_name;
          if (!quotedContentData.content && quotedDbMsg.content) quotedContentData.content = quotedDbMsg.content;
        }
      }
    }

    // ========== Build display content ==========
    const messageMetadata: Record<string, any> = {};
    if (audioTranscription) messageMetadata.transcription = audioTranscription;

    let displayContent = messageText;
    if (incomingType === 'audio') displayContent = '🎵 Áudio';
    else if (incomingType === 'image') displayContent = messageText || '📷 Imagem';
    else if (incomingType === 'video') displayContent = messageText || '🎥 Vídeo';
    else if (incomingType === 'document') displayContent = messageText || `📄 ${mediaFilename || 'Documento'}`;
    else if (incomingType === 'sticker') displayContent = '🏷️ Figurinha';
    else if (incomingType === 'location') {
      const loc = typeof rawContent === 'object' ? rawContent : {};
      const lat = loc?.latitude || loc?.degreesLatitude;
      const lng = loc?.longitude || loc?.degreesLongitude;
      displayContent = lat && lng ? `📍 Localização: ${lat}, ${lng}` : (messageText || '📍 Localização enviada');
    }

    // ========== Persistir mensagem no chat master ==========
    const now = new Date().toISOString();
    try {
      const insertData: Record<string, unknown> = {
        config_id: config.id,
        remote_jid: remoteJid,
        phone_number: phoneNumber,
        direction: fromMe ? 'outgoing' : 'incoming',
        sender_name: fromMe ? 'Admin' : contactName,
        content: displayContent,
        message_type: incomingType,
        media_url: mediaUrl,
        media_filename: mediaFilename,
        media_mimetype: mediaMimetype,
        is_from_bot: false,
        is_read_by_admin: fromMe,
        timestamp: now,
        evolution_message_id: messageId,
        message_source: fromMe ? 'phone' : 'client',
        metadata: Object.keys(messageMetadata).length > 0 ? messageMetadata : null,
      };
      if (quotedMessageDbId) insertData.quoted_message_id = quotedMessageDbId;
      if (quotedContentData) insertData.quoted_content = quotedContentData;

      await supabase.from('master_whatsapp_chat_messages').insert(insertData);

      // Upsert conversa
      const convUpdate: Record<string, unknown> = {
        config_id: config.id,
        remote_jid: remoteJid,
        phone_number: phoneNumber,
        last_message: (displayContent || '').substring(0, 200),
        last_message_at: now,
        last_message_direction: fromMe ? 'outgoing' : 'incoming',
        last_message_source: fromMe ? 'phone' : 'client',
        status: 'active',
      };
      if (!fromMe && contactName && contactName !== 'Contato') {
        convUpdate.contact_name = contactName;
      }
      
      await supabase.from('master_whatsapp_conversations').upsert(convUpdate, { onConflict: 'config_id,remote_jid' });
      
      if (!fromMe) {
        const { data: existingConv } = await supabase
          .from('master_whatsapp_conversations')
          .select('id, unread_count')
          .eq('config_id', config.id)
          .eq('remote_jid', remoteJid)
          .single();
        if (existingConv) {
          await supabase.from('master_whatsapp_conversations')
            .update({ unread_count: (existingConv.unread_count || 0) + 1 })
            .eq('id', existingConv.id);
        }
      }
    } catch (e) {
      console.warn('[master-webhook] ⚠️ Erro ao persistir msg no chat:', (e as Error).message);
    }

    // ========== For media-only messages (no text for AI), skip bot processing ==========
    const textForAi = audioTranscription || messageText;
    if (!textForAi) {
      console.log(`[master-webhook] 📎 Mídia sem texto, persistida mas sem IA`);
      if (messageId) processingMessages.delete(messageId);
      return new Response(JSON.stringify({ success: true, media_only: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar sessão existente
    let existingSession: any = null;
    const { data: sessionRows, error: sessionError } = await supabase
      .from('master_whatsapp_sessions')
      .select('id, config_id, phone_number, active_bot_type, bot_paused, messages_count, metadata, last_message_at, paused_at')
      .eq('config_id', config.id)
      .eq('phone_number', phoneNumber)
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionError) {
      console.warn('[master-webhook] ⚠️ Erro ao buscar sessão:', sessionError.message);
    } else if (sessionRows && sessionRows.length > 0) {
      existingSession = sessionRows[0];
    }

    // Detectar tipo de bot
    let botType: BotType = existingSession?.active_bot_type as BotType || detectBotType(textForAi, config as unknown as MasterWhatsAppConfig);
    const behavior = getBotBehavior(config as unknown as MasterWhatsAppConfig, botType);

    // ========== fromMe handling ==========
    if (fromMe) {
      if (behavior.stop_bot_from_me && existingSession && !existingSession.bot_paused) {
        console.log(`[master-webhook] ⏸️ PAUSE_BOT | Atendente respondeu, pausando bot para ${phoneNumber}`);
        await supabase
          .from('master_whatsapp_sessions')
          .update({ 
            bot_paused: true, 
            paused_at: new Date().toISOString(),
            paused_reason: 'attendant_reply' 
          })
          .eq('id', existingSession.id);
      }
      
      if (!behavior.listening_from_me) {
        if (messageId) processingMessages.delete(messageId);
        return new Response(JSON.stringify({ success: true, self_message: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== Keyword finish ==========
    if (behavior.keyword_finish && normalizeText(textForAi) === normalizeText(behavior.keyword_finish)) {
      console.log(`[master-webhook] 🛑 KEYWORD_FINISH | "${textForAi}"`);
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
      if (messageId) processingMessages.delete(messageId);
      return new Response(JSON.stringify({ success: true, keyword_finish: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ========== Session expiry check ==========
    if (existingSession && !behavior.keep_open && existingSession.last_message_at) {
      const lastMsgTime = new Date(existingSession.last_message_at).getTime();
      const nowMs = Date.now();
      const expireMs = behavior.expire_minutes * 60 * 1000;
      if ((nowMs - lastMsgTime) > expireMs) {
        console.log(`[master-webhook] ⏰ SESSION_EXPIRED | Resetando sessão`);
        existingSession = null;
      }
    }

    // ========== Auto-reactivate check ==========
    if (existingSession?.bot_paused && behavior.auto_reactivate_minutes > 0 && existingSession.paused_at) {
      const pausedTime = new Date(existingSession.paused_at).getTime();
      const nowMs = Date.now();
      const reactivateMs = behavior.auto_reactivate_minutes * 60 * 1000;
      if ((nowMs - pausedTime) > reactivateMs) {
        console.log(`[master-webhook] 🔄 AUTO_REACTIVATE | Reativando bot`);
        await supabase
          .from('master_whatsapp_sessions')
          .update({ bot_paused: false, paused_at: null, paused_reason: null })
          .eq('id', existingSession.id);
        existingSession.bot_paused = false;
      }
    }

    // ========== Bot paused check ==========
    if (existingSession?.bot_paused) {
      console.log(`[master-webhook] ⏸️ BOT_PAUSED | Bot pausado para ${phoneNumber}`);
      if (messageId) processingMessages.delete(messageId);
      return new Response(JSON.stringify({ success: true, bot_paused: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se todos os bots estão desativados (modo manual)
    const allBotsDisabled = !config.sales_bot_enabled && !config.recruitment_bot_enabled && !config.support_bot_enabled;
    if (allBotsDisabled) {
      console.log('[master-webhook] 🔇 Todos os bots desativados - modo manual ativo');
      if (messageId) processingMessages.delete(messageId);
      return new Response(JSON.stringify({ success: true, manual_mode: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se tem Assistant configurado
    if (!config.unified_openai_assistant_id || !config.openai_api_key) {
      console.log('[master-webhook] ⚠️ Assistente não configurado');
      if (messageId) processingMessages.delete(messageId);
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
      if (messageId) processingMessages.delete(messageId);
      return new Response(JSON.stringify({ success: false, error: 'UaZapi config missing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const uazapiUrl = uazapiConfig.api_url.replace(/\/$/, '');
    const instanceToken = config.evolution_instance_id;

    // ========== DEDUP LAYER 3: Session-level lock via metadata ==========
    const existingMetadata = ((existingSession?.metadata && typeof existingSession.metadata === 'object')
      ? existingSession.metadata
      : {}) as Record<string, unknown>;

    const processingLockId = existingMetadata.bot_processing_message_id as string | null;
    if (processingLockId && messageId && processingLockId !== messageId) {
      const lockTime = existingMetadata.bot_processing_lock_at as string | null;
      if (lockTime && (Date.now() - new Date(lockTime).getTime()) < 90000) {
        console.log(`[master-webhook] ⏭️ DEDUP_LOCK | Outro processamento ativo: ${processingLockId}`);
        if (messageId) processingMessages.delete(messageId);
        return new Response(JSON.stringify({ success: true, locked: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (existingSession?.id && messageId) {
      await supabase.from('master_whatsapp_sessions').update({
        metadata: {
          ...existingMetadata,
          bot_processing_message_id: messageId,
          bot_processing_lock_at: new Date().toISOString(),
        }
      }).eq('id', existingSession.id);
    }

    // Marcar como lido + presença
    await Promise.all([
      markAsRead(uazapiUrl, instanceToken, messageId),
      sendPresence(uazapiUrl, instanceToken, phoneNumber, 60000, 'composing'),
    ]);

    // ========== Debounce ==========
    if (behavior.debounce_time > 0) {
      console.log(`[master-webhook] ⏳ DEBOUNCE | Aguardando ${behavior.debounce_time}s`);
      await new Promise(resolve => setTimeout(resolve, behavior.debounce_time * 1000));
    }

    // ========== Session management ==========
    let isNewSession = false;
    let threadId: string | null = existingMetadata.openai_thread_id as string || null;

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
      botType = detectBotType(textForAi, config as unknown as MasterWhatsAppConfig);
      isNewSession = true;
      threadId = null;
      
      await supabase
        .from('master_whatsapp_sessions')
        .upsert({
          config_id: config.id,
          phone_number: phoneNumber,
          contact_name: contactName,
          active_bot_type: botType,
          messages_count: 1,
          metadata: { openai_thread_id: null },
        }, { onConflict: 'config_id,phone_number' });
    }

    console.log(`[master-webhook] 🤖 Bot: ${getBotLabel(botType)} | Thread: ${threadId || 'nova'}`);

    const isFollowUpMessage = Boolean(existingSession && !isNewSession && (existingSession.messages_count || 0) >= 1);

    // ========== OpenAI Assistants API ==========
    const openaiHeaders = {
      'Authorization': `Bearer ${config.openai_api_key}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2',
    };

    if (!threadId) {
      const threadResp = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: openaiHeaders,
        body: JSON.stringify({}),
      });

      if (!threadResp.ok) {
        const err = await threadResp.text();
        console.error('[master-webhook] ❌ Erro ao criar thread:', err);
        if (messageId) processingMessages.delete(messageId);
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

    if (isFollowUpMessage) {
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

    // Use transcription for AI if available
    const aiText = audioTranscription ? `[Áudio transcrito]: ${audioTranscription}` : textForAi;
    const contextualMessage = contactName && contactName !== 'Contato'
      ? `[Cliente: ${contactName}] ${aiText}`
      : aiText;

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
        if (messageId) processingMessages.delete(messageId);
        return new Response(JSON.stringify({ success: false, error: 'Failed to append message' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    await messageResp.text();

    // Run + polling
    const followUpInstructions = 'Esta conversa já está em andamento. NÃO reinicie com apresentação institucional, NÃO repita menu. Responda diretamente.';

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
          const toolOutputs = [];
          for (const toolCall of toolCalls) {
            const toolName = toolCall.function.name;
            let toolArgs = {};
            try { toolArgs = JSON.parse(toolCall.function.arguments || '{}'); } catch { toolArgs = {}; }
            const result = await executeToolCall(supabaseUrl, toolName, toolArgs, config);
            toolOutputs.push({ tool_call_id: toolCall.id, output: result });
          }

          const submitResp = await fetch(
            `https://api.openai.com/v1/threads/${threadId}/runs/${run.id}/submit_tool_outputs`,
            { method: 'POST', headers: openaiHeaders, body: JSON.stringify({ tool_outputs: toolOutputs }) }
          );

          if (submitResp.ok) {
            run = await submitResp.json();
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
      const whatsappText = markdownToWhatsApp(text);
      
      if (behavior.delay_message > 0) {
        await new Promise(resolve => setTimeout(resolve, behavior.delay_message));
      }

      const messageParts = behavior.split_messages ? splitIntoMessages(whatsappText) : [whatsappText];
      console.log(`[master-webhook] 📨 SEND | parts=${messageParts.length} | split=${behavior.split_messages}`);

      const botLabel = getBotLabel(botType);
      const sentParts: string[] = [];

      for (let i = 0; i < messageParts.length; i++) {
        const part = messageParts[i];
        
        if (i > 0 && behavior.time_per_char > 0) {
          const typingDelay = Math.min(part.length * behavior.time_per_char, 8000);
          await sendPresence(uazapiUrl, instanceToken, phoneNumber, typingDelay);
          await new Promise(resolve => setTimeout(resolve, typingDelay));
        }
        
        await sendViaUaZapi(uazapiUrl, instanceToken, phoneNumber, part);
        sentParts.push(part);
      }

      for (const part of sentParts) {
        try {
          await supabase.from('master_whatsapp_chat_messages').insert({
            config_id: config.id,
            remote_jid: remoteJid,
            phone_number: phoneNumber,
            direction: 'outgoing',
            sender_name: botLabel,
            content: part,
            message_type: 'text',
            is_from_bot: true,
            is_read_by_admin: true,
            timestamp: new Date().toISOString(),
            message_source: 'bot',
          });
        } catch (e) {
          console.warn('[master-webhook] ⚠️ Erro ao persistir parte bot:', (e as Error).message);
        }
      }

      const lastPart = sentParts[sentParts.length - 1] || whatsappText;
      await supabase.from('master_whatsapp_conversations')
        .update({ 
          last_message: lastPart.substring(0, 200), 
          last_message_at: new Date().toISOString(), 
          last_message_direction: 'outgoing', 
          last_message_source: 'bot' 
        })
        .eq('config_id', config.id)
        .eq('remote_jid', remoteJid);
    };

    try {
      const run = await runAssistant(isFollowUpMessage ? followUpInstructions : undefined);
      console.log(`[master-webhook] 🧪 RUN_END | run=${run.id} | status=${run.status}`);

      if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
        await sendViaUaZapi(uazapiUrl, instanceToken, phoneNumber, 'Desculpe, tive um problema. Tente novamente! 🙏');
      } else if (run.status === 'completed') {
        let replyText = await fetchLatestAssistantReply();

        if (isFollowUpMessage && replyText && isInstitutionalRestart(replyText)) {
          console.log('[master-webhook] 🔁 Resposta genérica em follow-up, forçando contextual');
          const forcedRun = await runAssistant(
            `Responda APENAS à última mensagem (${textForAi}) com objetividade, sem apresentação.`
          );
          if (forcedRun.status === 'completed') {
            replyText = await fetchLatestAssistantReply();
          }
        }

        if (replyText) {
          await sendReplyWithBehavior(replyText);
        } else {
          console.warn('[master-webhook] ⚠️ Resposta vazia');
        }
      }
    } catch (runError) {
      console.error('[master-webhook] ❌ Erro no run:', runError);
      await sendViaUaZapi(uazapiUrl, instanceToken, phoneNumber, 'Desculpe, dificuldade técnica. Tente novamente! 🙏');
      if (messageId) processingMessages.delete(messageId);
      return new Response(JSON.stringify({ success: false, error: 'Run failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Salvar thread + limpar lock
    const sessionId = existingSession?.id;
    const nextMetadata = {
      ...existingMetadata,
      openai_thread_id: threadId,
      bot_processing_message_id: null,
      bot_processing_lock_at: null,
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

    if (messageId) processingMessages.delete(messageId);
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
