import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tipos
interface MasterWhatsAppConfig {
  id: string;
  admin_user_id: string;
  instance_name: string;
  instance_status: string;
  sales_bot_enabled: boolean;
  sales_bot_approach: 'basic' | 'intermediate' | 'aggressive';
  sales_bot_keywords: string[];
  sales_bot_evolution_id: string | null;
  recruitment_bot_enabled: boolean;
  recruitment_bot_approach: 'cold_lead' | 'moderate' | 'aggressive' | 'super_aggressive';
  recruitment_bot_keywords: string[];
  recruitment_bot_evolution_id: string | null;
  support_bot_enabled: boolean;
  support_bot_keywords: string[];
  support_bot_evolution_id: string | null;
}

type BotType = 'sales' | 'recruitment' | 'support';

// Normaliza texto para comparação
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .trim();
}

// Detecta o tipo de bot baseado nas keywords
function detectBotType(messageText: string, config: MasterWhatsAppConfig): BotType {
  const normalizedMessage = normalizeText(messageText);
  
  console.log('📝 Analisando mensagem:', normalizedMessage);
  
  // Verificar keywords de recrutamento primeiro (mais específicas)
  if (config.recruitment_bot_enabled) {
    const recruitmentMatch = config.recruitment_bot_keywords.some(kw => 
      normalizedMessage.includes(normalizeText(kw))
    );
    if (recruitmentMatch) {
      console.log('👥 Match: Recrutamento');
      return 'recruitment';
    }
  }
  
  // Verificar keywords de vendas
  if (config.sales_bot_enabled) {
    const salesMatch = config.sales_bot_keywords.some(kw => 
      normalizedMessage.includes(normalizeText(kw))
    );
    if (salesMatch) {
      console.log('💰 Match: Vendas');
      return 'sales';
    }
  }
  
  // Verificar keywords de suporte
  if (config.support_bot_enabled) {
    const supportMatch = config.support_bot_keywords.some(kw => 
      normalizedMessage.includes(normalizeText(kw))
    );
    if (supportMatch) {
      console.log('❓ Match: Suporte');
      return 'support';
    }
  }
  
  // Fallback para suporte se habilitado
  if (config.support_bot_enabled) {
    console.log('❓ Fallback: Suporte');
    return 'support';
  }
  
  // Se nenhum bot está habilitado ou não há match, usar vendas como padrão
  console.log('💰 Default: Vendas');
  return 'sales';
}

// Obtém o Evolution Bot ID correto
function getBotEvolutionId(botType: BotType, config: MasterWhatsAppConfig): string | null {
  switch (botType) {
    case 'sales':
      return config.sales_bot_evolution_id;
    case 'recruitment':
      return config.recruitment_bot_evolution_id;
    case 'support':
      return config.support_bot_evolution_id;
  }
}

// Labels amigáveis
function getBotLabel(botType: BotType): string {
  switch (botType) {
    case 'sales':
      return '💰 Vendas';
    case 'recruitment':
      return '👥 Recrutamento';
    case 'support':
      return '❓ Suporte';
  }
}

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const payload = await req.json();
    
    console.log('📥 Webhook Master WhatsApp recebido:', JSON.stringify(payload, null, 2));

    // Extrair evento
    const event = payload.event || payload.type;
    
    if (event !== 'messages.upsert') {
      console.log('ℹ️ Evento ignorado:', event);
      return new Response(JSON.stringify({ success: true, ignored: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extrair dados da mensagem
    const instanceName = payload.instance?.instanceName || payload.instanceName;
    const messageData = payload.data?.message || payload.message;
    
    if (!instanceName || !messageData) {
      console.log('⚠️ Dados incompletos:', { instanceName, messageData });
      return new Response(JSON.stringify({ success: true, incomplete: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Ignorar mensagens enviadas pelo próprio bot
    const isFromMe = messageData.key?.fromMe || false;
    if (isFromMe) {
      console.log('🤖 Mensagem do próprio bot - ignorando');
      return new Response(JSON.stringify({ success: true, self_message: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extrair texto da mensagem
    const messageText = messageData.message?.conversation || 
                       messageData.message?.extendedTextMessage?.text || 
                       '';
    
    if (!messageText) {
      console.log('⚠️ Mensagem sem texto');
      return new Response(JSON.stringify({ success: true, no_text: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extrair número do remetente
    const remoteJid = messageData.key?.remoteJid || '';
    const phoneNumber = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
    const contactName = messageData.pushName || 'Contato';

    console.log('📱 Mensagem de:', phoneNumber, '-', contactName);
    console.log('💬 Texto:', messageText);

    // Buscar configuração do master admin
    const { data: config, error: configError } = await supabase
      .from('master_whatsapp_config')
      .select('*')
      .eq('instance_name', instanceName)
      .single();

    if (configError || !config) {
      console.error('❌ Config não encontrada para instância:', instanceName);
      return new Response(JSON.stringify({ success: false, error: 'Config not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se já existe sessão ativa
    const { data: existingSession } = await supabase
      .from('master_whatsapp_sessions')
      .select('*')
      .eq('config_id', config.id)
      .eq('phone_number', phoneNumber)
      .single();

    let botType: BotType;
    let isNewSession = false;

    if (existingSession && !existingSession.bot_paused) {
      // Sessão existente - manter o mesmo bot
      botType = existingSession.active_bot_type as BotType;
      console.log('🔄 Sessão existente - Bot:', getBotLabel(botType));
      
      // Atualizar contador de mensagens
      await supabase
        .from('master_whatsapp_sessions')
        .update({
          messages_count: (existingSession.messages_count || 0) + 1,
          last_message_at: new Date().toISOString()
        })
        .eq('id', existingSession.id);
    } else {
      // Nova sessão ou sessão pausada - detectar bot
      botType = detectBotType(messageText, config as MasterWhatsAppConfig);
      isNewSession = true;
      console.log('🆕 Nova sessão - Bot detectado:', getBotLabel(botType));
      
      // Criar ou atualizar sessão
      if (existingSession) {
        await supabase
          .from('master_whatsapp_sessions')
          .update({
            active_bot_type: botType,
            bot_paused: false,
            paused_at: null,
            paused_reason: null,
            messages_count: (existingSession.messages_count || 0) + 1,
            last_message_at: new Date().toISOString()
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
            messages_count: 1
          });
      }
    }

    // Buscar configuração do Evolution API
    const { data: evolutionConfig } = await supabase
      .from('evolution_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!evolutionConfig) {
      console.error('❌ Evolution config não encontrada');
      return new Response(JSON.stringify({ success: false, error: 'Evolution config not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Se for nova sessão, enviar mensagem de contexto
    if (isNewSession) {
      const contextMessage = getContextMessage(botType);
      
      if (contextMessage) {
        const sendUrl = `${evolutionConfig.api_url}/message/sendText/${instanceName}`;
        
        try {
          await fetch(sendUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionConfig.api_key
            },
            body: JSON.stringify({
              number: phoneNumber,
              text: contextMessage
            })
          });
          
          console.log('📤 Mensagem de contexto enviada');
        } catch (sendError) {
          console.error('❌ Erro ao enviar mensagem:', sendError);
        }
      }
    }

    console.log('✅ Webhook processado com sucesso');

    return new Response(JSON.stringify({ 
      success: true, 
      botType,
      isNewSession,
      phoneNumber,
      contactName
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Mensagens de contexto por tipo de bot
function getContextMessage(botType: BotType): string | null {
  switch (botType) {
    case 'sales':
      return '🛒 Olá! Você está falando com nosso assistente de vendas. Como posso ajudar você a conhecer nossa plataforma?';
    case 'recruitment':
      return '👋 Olá! Você está falando com nosso assistente de recrutamento. Quer conhecer nossa oportunidade de renda extra?';
    case 'support':
      return '💬 Olá! Você está falando com nosso suporte. Em que posso ajudar?';
    default:
      return null;
  }
}
