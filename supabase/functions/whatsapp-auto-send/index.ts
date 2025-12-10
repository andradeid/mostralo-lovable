import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normaliza telefone para formato WhatsApp (com DDI 55 Brasil)
function normalizePhoneForWhatsApp(phone: string): string {
  let normalized = phone.replace(/\D/g, '');
  
  if (normalized.startsWith('55') && normalized.length >= 12 && normalized.length <= 13) {
    return normalized;
  }
  
  if (normalized.length >= 10 && normalized.length <= 11) {
    return '55' + normalized;
  }
  
  return normalized;
}

// Substituir variáveis na mensagem
function replaceVariables(template: string, data: {
  customerName?: string;
  storeName?: string;
  storeSlug?: string;
  orderNumber?: string;
  orderTotal?: number;
  deliveryAddress?: string;
  deliveryType?: string;
  orderId?: string;
  storePhone?: string;
}): string {
  let message = template;
  
  const firstName = data.customerName?.split(' ')[0] || '';
  const storeLink = data.storeSlug ? `${Deno.env.get('PUBLIC_URL') || 'https://mostralo.com.br'}/loja/${data.storeSlug}` : '';
  const orderLink = data.orderId ? `${Deno.env.get('PUBLIC_URL') || 'https://mostralo.com.br'}/pedido/${data.orderId}` : '';
  const formattedTotal = data.orderTotal ? data.orderTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '';
  
  message = message.replace(/{nome}/g, data.customerName || '');
  message = message.replace(/{primeiro_nome}/g, firstName);
  message = message.replace(/{loja}/g, data.storeName || '');
  message = message.replace(/{link_loja}/g, storeLink);
  message = message.replace(/{numero_pedido}/g, data.orderNumber || '');
  message = message.replace(/{valor_total}/g, formattedTotal);
  message = message.replace(/{endereco_entrega}/g, data.deliveryAddress || '');
  message = message.replace(/{tipo_entrega}/g, data.deliveryType === 'delivery' ? 'Delivery' : 'Retirada no Balcão');
  message = message.replace(/{link_pedido}/g, orderLink);
  message = message.replace(/{whatsapp_loja}/g, data.storePhone || '');
  
  return message;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      storeId, 
      eventType, // 'greeting' | 'order_received' | 'order_confirmed' | 'order_ready' | 'order_in_transit' | 'order_completed' | 'order_cancelled'
      phoneNumber,
      customerName,
      orderId,
      isTest = false // Modo teste - ignora verificações de habilitação
    } = await req.json();

    console.log(`[whatsapp-auto-send] Event: ${eventType}, Store: ${storeId}, Phone: ${phoneNumber}, isTest: ${isTest}`);

    // Buscar configuração de mensagens automáticas
    const { data: autoConfig, error: configError } = await supabase
      .from('whatsapp_auto_messages')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (configError || !autoConfig) {
      console.log('[whatsapp-auto-send] Configuração não encontrada ou não habilitada');
      return new Response(JSON.stringify({ success: false, reason: 'config_not_found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se sistema está ativo (pular verificação se for teste)
    if (!isTest && !autoConfig.is_enabled) {
      console.log('[whatsapp-auto-send] Sistema de automação desativado');
      return new Response(JSON.stringify({ success: false, skipped: true, reason: 'automation_disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se evento específico está ativo
    const eventEnabledMap: Record<string, string> = {
      'greeting': 'greeting_enabled',
      'order_received': 'order_received_enabled',
      'order_confirmed': 'order_confirmed_enabled',
      'order_ready': 'order_ready_enabled',
      'order_in_transit': 'order_in_transit_enabled',
      'order_completed': 'order_completed_enabled',
      'order_cancelled': 'order_cancelled_enabled'
    };

    const eventMessageMap: Record<string, string> = {
      'greeting': 'greeting_message',
      'order_received': 'order_received_message',
      'order_confirmed': 'order_confirmed_message',
      'order_ready': 'order_ready_message',
      'order_in_transit': 'order_in_transit_message',
      'order_completed': 'order_completed_message',
      'order_cancelled': 'order_cancelled_message'
    };

    const enabledField = eventEnabledMap[eventType];
    const messageField = eventMessageMap[eventType];

    // Verificar se evento específico está ativo (pular verificação se for teste)
    if (!isTest && (!enabledField || !autoConfig[enabledField])) {
      console.log(`[whatsapp-auto-send] Evento ${eventType} não habilitado`);
      return new Response(JSON.stringify({ success: false, skipped: true, reason: 'event_disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar dados da loja
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('name, slug, phone')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      console.error('[whatsapp-auto-send] Loja não encontrada:', storeError);
      return new Response(JSON.stringify({ success: false, reason: 'store_not_found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar dados do pedido se necessário
    let orderData: any = null;
    if (orderId) {
      const { data: order } = await supabase
        .from('orders')
        .select('order_number, total, customer_address, delivery_type, customer_name, customer_phone')
        .eq('id', orderId)
        .single();
      
      orderData = order;
    }

    // Montar mensagem
    const messageTemplate = autoConfig[messageField];
    const finalMessage = replaceVariables(messageTemplate, {
      customerName: customerName || orderData?.customer_name,
      storeName: store.name,
      storeSlug: store.slug,
      orderNumber: orderData?.order_number,
      orderTotal: orderData?.total,
      deliveryAddress: orderData?.customer_address,
      deliveryType: orderData?.delivery_type,
      orderId: orderId,
      storePhone: store.phone
    });

    // Buscar configuração da Evolution API
    const { data: evolutionConfig, error: evolutionError } = await supabase
      .from('evolution_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (evolutionError || !evolutionConfig) {
      console.error('[whatsapp-auto-send] Evolution API não configurada');
      return new Response(JSON.stringify({ success: false, reason: 'evolution_not_configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar instância da loja
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', 'connected')
      .single();

    if (instanceError || !instance) {
      console.error('[whatsapp-auto-send] Instância WhatsApp não conectada');
      return new Response(JSON.stringify({ success: false, reason: 'instance_not_connected' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalizar telefone
    const targetPhone = phoneNumber || orderData?.customer_phone;
    if (!targetPhone) {
      console.error('[whatsapp-auto-send] Telefone não fornecido');
      return new Response(JSON.stringify({ success: false, reason: 'no_phone' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formattedPhone = normalizePhoneForWhatsApp(targetPhone);

    // Enviar via Evolution API
    const endpoint = `${evolutionConfig.api_url}/message/sendText/${instance.instance_name}`;
    const payload = {
      number: formattedPhone,
      text: finalMessage
    };

    console.log(`[whatsapp-auto-send] Enviando para: ${formattedPhone}`);

    const sendResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionConfig.api_key,
      },
      body: JSON.stringify(payload),
    });

    const sendData = await sendResponse.json();
    console.log('[whatsapp-auto-send] Evolution response:', sendData);

    // Registrar mensagem no log
    await supabase
      .from('whatsapp_messages')
      .insert({
        store_id: storeId,
        phone_number: formattedPhone,
        message_type: 'text',
        content: finalMessage,
        status: sendResponse.ok ? 'sent' : 'failed',
        evolution_message_id: sendData.key?.id || null,
        error_message: sendResponse.ok ? null : JSON.stringify(sendData),
        sent_at: sendResponse.ok ? new Date().toISOString() : null,
        failed_at: sendResponse.ok ? null : new Date().toISOString(),
      });

    if (!sendResponse.ok) {
      return new Response(JSON.stringify({ 
        success: false, 
        reason: 'send_failed',
        details: sendData 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      messageId: sendData.key?.id,
      eventType,
      phone: formattedPhone
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[whatsapp-auto-send] Erro:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
