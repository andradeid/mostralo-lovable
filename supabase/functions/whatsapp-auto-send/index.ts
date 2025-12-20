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

// ========== SAUDAÇÃO POR HORÁRIO (fallback se não receber contexto) ==========
function getGreetingByTime(timezone: string = 'America/Sao_Paulo'): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: timezone,
      hour: '2-digit',
      hour12: false
    });
    const hour = parseInt(formatter.format(now));
    
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  } catch {
    // Fallback para cálculo UTC-3
    const now = new Date();
    const brasiliaHour = new Date(now.getTime() - (3 * 60 * 60 * 1000)).getUTCHours();
    
    if (brasiliaHour >= 5 && brasiliaHour < 12) return 'Bom dia';
    if (brasiliaHour >= 12 && brasiliaHour < 18) return 'Boa tarde';
    return 'Boa noite';
  }
}

// ========== CLASSIFICAÇÃO DE CLIENTE ==========
interface CustomerClassification {
  type: 'new' | 'first_time' | 'frequent' | 'returning' | 'missed' | 'vip';
  daysSinceOrder: number | null;
  totalOrders: number;
  totalSpent: number;
}

function classifyCustomer(isKnownCustomer: boolean, customerData: any): CustomerClassification {
  // Visitante completamente novo (não está no banco)
  if (!isKnownCustomer) {
    return { type: 'new', daysSinceOrder: null, totalOrders: 0, totalSpent: 0 };
  }
  
  // Cliente existe mas sem histórico nesta loja específica
  if (!customerData) {
    return { type: 'first_time', daysSinceOrder: null, totalOrders: 0, totalSpent: 0 };
  }
  
  const { lastOrderAt, totalOrders, totalSpent } = customerData;
  const daysSinceOrder = lastOrderAt 
    ? Math.floor((Date.now() - new Date(lastOrderAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  // VIP: gastou mais de R$ 500 nesta loja
  if (totalSpent >= 500) {
    return { type: 'vip', daysSinceOrder, totalOrders, totalSpent };
  }
  
  // Frequente: pediu nos últimos 7 dias
  if (daysSinceOrder !== null && daysSinceOrder < 7) {
    return { type: 'frequent', daysSinceOrder, totalOrders, totalSpent };
  }
  
  // Retornando: 7-30 dias desde último pedido
  if (daysSinceOrder !== null && daysSinceOrder <= 30) {
    return { type: 'returning', daysSinceOrder, totalOrders, totalSpent };
  }
  
  // Ausente: mais de 30 dias sem pedir
  if (daysSinceOrder !== null && daysSinceOrder > 30) {
    return { type: 'missed', daysSinceOrder, totalOrders, totalSpent };
  }
  
  return { type: 'first_time', daysSinceOrder, totalOrders, totalSpent };
}

// ========== TEMPLATES DE SAUDAÇÃO POR TIPO ==========
function getSmartGreetingTemplate(
  classification: CustomerClassification, 
  greeting: string,
  storeName: string,
  isOpen: boolean = true,
  nextOpening: string | null = null
): string {
  // Link do cardápio adicionado em todas as saudações
  const menuLink = `\n\n📱 Confira nosso cardápio: {link_loja}`;
  
  // Se loja está fechada, usar template específico
  if (!isOpen) {
    const closedMessage = nextOpening 
      ? `⚠️ Estamos fechados no momento, mas abrimos ${nextOpening}!`
      : `⚠️ Estamos fechados no momento.`;
    
    switch (classification.type) {
      case 'vip':
        return `${greeting}, {primeiro_nome}! 🌟 Nosso cliente especial!\n\n${closedMessage}\n\nMas enquanto isso, que tal dar uma olhada no cardápio?${menuLink}`;
      case 'frequent':
      case 'returning':
        return `${greeting}, {primeiro_nome}! 😊\n\n${closedMessage}\n\nDá uma olhada no cardápio para quando abrirmos!${menuLink}`;
      case 'missed':
        return `${greeting}, {primeiro_nome}! Que bom ter você de volta! 💕\n\n${closedMessage}\n\nMas já confira o cardápio!${menuLink}`;
      default:
        return `${greeting}! 👋 Seja bem-vindo(a) à ${storeName}!\n\n${closedMessage}\n\nEnquanto isso, confira nosso cardápio!${menuLink}`;
    }
  }
  
  // Loja aberta - templates normais
  switch (classification.type) {
    case 'vip':
      return `${greeting}, {primeiro_nome}! 🌟 Nosso cliente especial! Que bom ter você de volta na ${storeName}! Como posso ajudar hoje?${menuLink}`;
    
    case 'frequent':
      return `${greeting}, {primeiro_nome}! 😊 Que bom ver você de novo! Como posso ajudar?${menuLink}`;
    
    case 'returning':
      return `${greeting}, {primeiro_nome}! Que bom ter você de volta! 😊 Faz ${classification.daysSinceOrder} dias que não nos vemos... Como posso ajudar?${menuLink}`;
    
    case 'missed':
      return `${greeting}, {primeiro_nome}! Que saudade! 💕 Já faz ${classification.daysSinceOrder} dias desde seu último pedido... Temos novidades te esperando! Como posso ajudar?${menuLink}`;
    
    case 'first_time':
      return `${greeting}, {primeiro_nome}! 👋 Seja bem-vindo(a) à ${storeName}! Primeira vez por aqui? Como posso ajudar?${menuLink}`;
    
    case 'new':
    default:
      return `${greeting}! 👋 Seja bem-vindo(a) à ${storeName}! Como posso ajudar?${menuLink}`;
  }
}

// Formatar itens do pedido para exibição
function formatOrderItems(items: any[]): string {
  if (!items || items.length === 0) return '';
  
  return items.map(item => {
    const subtotal = (item.subtotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    return `• ${item.quantity}x ${item.product_name} (R$ ${subtotal})`;
  }).join('\n');
}

// Formatar tempo estimado de entrega
function formatEstimatedTime(minutes: number | null): string {
  if (!minutes) return '';
  
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return hours === 1 ? '1 hora' : `${hours} horas`;
    }
    return `${hours}h${mins}min`;
  }
  return `${minutes} minutos`;
}

// Gerar link do Google Maps a partir de coordenadas
function buildGoogleMapsLink(lat: number | null, lng: number | null): string {
  if (!lat || !lng) return '';
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

// Substituir variáveis na mensagem
function replaceVariables(template: string, data: {
  customerName?: string;
  storeName?: string;
  storeSlug?: string;
  storeCustomDomain?: string | null;
  storeCustomDomainVerified?: boolean;
  orderNumber?: string;
  orderTotal?: number;
  deliveryAddress?: string;
  deliveryType?: string;
  orderId?: string;
  storePhone?: string;
  baseUrl?: string;
  // Novas variáveis
  greeting?: string;
  daysSinceOrder?: number | null;
  totalOrders?: number;
  totalSpent?: number;
  orderItems?: string;
  estimatedTime?: string;
  googleMapsLink?: string;
}): string {
  let message = template;
  
  const firstName = data.customerName?.split(' ')[0] || '';
  const formattedTotal = data.orderTotal ? data.orderTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '';
  const formattedTotalSpent = data.totalSpent ? data.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00';
  
  // Lógica de links dinâmicos
  let storeLink = '';
  let orderLink = '';
  
  if (data.storeCustomDomain && data.storeCustomDomainVerified) {
    storeLink = `https://${data.storeCustomDomain}`;
    orderLink = data.orderId ? `https://${data.storeCustomDomain}/pedido/${data.orderId}` : '';
  } else if (data.baseUrl) {
    storeLink = data.storeSlug ? `${data.baseUrl}/loja/${data.storeSlug}` : '';
    orderLink = data.orderId ? `${data.baseUrl}/pedido/${data.orderId}` : '';
  } else {
    const defaultUrl = Deno.env.get('PUBLIC_URL') || 'https://mostralo.com.br';
    storeLink = data.storeSlug ? `${defaultUrl}/loja/${data.storeSlug}` : '';
    orderLink = data.orderId ? `${defaultUrl}/pedido/${data.orderId}` : '';
  }
  
  // Variáveis existentes
  message = message.replace(/{nome}/g, data.customerName || '');
  message = message.replace(/{primeiro_nome}/g, firstName);
  message = message.replace(/{loja}/g, data.storeName || '');
  message = message.replace(/{link_loja}/g, storeLink);
  message = message.replace(/{numero_pedido}/g, data.orderNumber || '');
  message = message.replace(/{valor_total}/g, formattedTotal);
  message = message.replace(/{itens_pedido}/g, data.orderItems || '');
  message = message.replace(/{endereco_entrega}/g, data.deliveryAddress || '');
  message = message.replace(/{tipo_entrega}/g, data.deliveryType === 'delivery' ? 'Delivery' : 'Retirada no Balcão');
  message = message.replace(/{link_pedido}/g, orderLink);
  message = message.replace(/{whatsapp_loja}/g, data.storePhone || '');
  
  // Novas variáveis
  message = message.replace(/{saudacao}/g, data.greeting || getGreetingByTime());
  message = message.replace(/{dias_sem_pedir}/g, data.daysSinceOrder !== null && data.daysSinceOrder !== undefined ? String(data.daysSinceOrder) : '');
  message = message.replace(/{total_pedidos}/g, String(data.totalOrders || 0));
  message = message.replace(/{total_gasto}/g, formattedTotalSpent);
  message = message.replace(/{tempo_estimado}/g, data.estimatedTime || '');
  message = message.replace(/{link_maps}/g, data.googleMapsLink || '');
  
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
      eventType,
      phoneNumber,
      customerName,
      orderId,
      isTest = false,
      baseUrl,
      // NOVOS PARÂMETROS para saudação inteligente
      isKnownCustomer = false,
      customerData = null,
      // CONTEXTO DE HORÁRIO do webhook
      timeContext = null
    } = await req.json();

    console.log(`[whatsapp-auto-send] Event: ${eventType}, Store: ${storeId}, Phone: ${phoneNumber}, isTest: ${isTest}, isKnownCustomer: ${isKnownCustomer}`);

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
      .select('name, slug, phone, custom_domain, custom_domain_verified')
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
    let orderItemsFormatted = '';
    
    // Variável para guardar o link do Google Maps
    let googleMapsLink = '';
    
    if (orderId) {
      const { data: order } = await supabase
        .from('orders')
        .select('order_number, total, customer_address, delivery_type, customer_name, customer_phone, estimated_delivery_minutes, customer_id')
        .eq('id', orderId)
        .single();
      
      orderData = order;
      
      // Buscar coordenadas do cliente se tiver customer_id
      if (order?.customer_id) {
        const { data: customer } = await supabase
          .from('customers')
          .select('latitude, longitude')
          .eq('id', order.customer_id)
          .single();
        
        if (customer?.latitude && customer?.longitude) {
          googleMapsLink = buildGoogleMapsLink(customer.latitude, customer.longitude);
          console.log(`[whatsapp-auto-send] Link do mapa gerado: ${googleMapsLink}`);
        }
      }
      
      // Buscar itens do pedido
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_name, quantity, unit_price, subtotal')
        .eq('order_id', orderId);
      
      orderItemsFormatted = formatOrderItems(orderItems || []);
      console.log(`[whatsapp-auto-send] Itens do pedido: ${orderItems?.length || 0} itens`);
    }

    // ========== LÓGICA DE SAUDAÇÃO INTELIGENTE ==========
    // Usar saudação do timeContext (calculada pelo webhook com timezone correto) ou fallback
    const greeting = timeContext?.greeting || getGreetingByTime(timeContext?.timezone);
    const classification = classifyCustomer(isKnownCustomer, customerData);
    
    console.log(`[whatsapp-auto-send] Classificação: ${classification.type}, Dias sem pedir: ${classification.daysSinceOrder}, Saudação: ${greeting}, TimeContext: ${JSON.stringify(timeContext)}`);

    // Determinar mensagem final
    let finalMessage: string;
    
    if (eventType === 'greeting') {
      // Para saudações, usar template inteligente se não houver template customizado
      const customTemplate = autoConfig[messageField];
      
      if (customTemplate && customTemplate.trim() !== '') {
        // Lojista configurou template customizado - usar ele
        finalMessage = replaceVariables(customTemplate, {
          customerName: customerName || orderData?.customer_name,
          storeName: store.name,
          storeSlug: store.slug,
          storeCustomDomain: store.custom_domain,
          storeCustomDomainVerified: store.custom_domain_verified,
          orderNumber: orderData?.order_number,
          orderTotal: orderData?.total,
          deliveryAddress: orderData?.customer_address,
          deliveryType: orderData?.delivery_type,
          orderId: orderId,
          storePhone: store.phone,
          baseUrl: baseUrl,
          greeting: greeting,
          daysSinceOrder: classification.daysSinceOrder,
          totalOrders: classification.totalOrders,
          totalSpent: classification.totalSpent,
          orderItems: orderItemsFormatted,
          estimatedTime: formatEstimatedTime(orderData?.estimated_delivery_minutes),
          googleMapsLink: googleMapsLink
        });
      } else {
        // Usar template inteligente baseado no tipo de cliente E status da loja
        const isOpen = timeContext?.isOpen !== false; // Default true se não receber
        const nextOpening = timeContext?.nextOpening || null;
        
        const smartTemplate = getSmartGreetingTemplate(
          classification, 
          greeting, 
          store.name, 
          isOpen, 
          nextOpening
        );
        finalMessage = replaceVariables(smartTemplate, {
          customerName: customerName || orderData?.customer_name,
          storeName: store.name,
          storeSlug: store.slug,
          storeCustomDomain: store.custom_domain,
          storeCustomDomainVerified: store.custom_domain_verified,
          storePhone: store.phone,
          baseUrl: baseUrl,
          greeting: greeting,
          daysSinceOrder: classification.daysSinceOrder,
          totalOrders: classification.totalOrders,
          totalSpent: classification.totalSpent,
          orderItems: orderItemsFormatted,
          estimatedTime: formatEstimatedTime(orderData?.estimated_delivery_minutes),
          googleMapsLink: googleMapsLink
        });
      }
    } else {
      // Outros eventos - usar template configurado normalmente
      const messageTemplate = autoConfig[messageField];
      finalMessage = replaceVariables(messageTemplate, {
        customerName: customerName || orderData?.customer_name,
        storeName: store.name,
        storeSlug: store.slug,
        storeCustomDomain: store.custom_domain,
        storeCustomDomainVerified: store.custom_domain_verified,
        orderNumber: orderData?.order_number,
        orderTotal: orderData?.total,
        deliveryAddress: orderData?.customer_address,
        deliveryType: orderData?.delivery_type,
        orderId: orderId,
        storePhone: store.phone,
        baseUrl: baseUrl,
        greeting: greeting,
        daysSinceOrder: classification.daysSinceOrder,
        totalOrders: classification.totalOrders,
        totalSpent: classification.totalSpent,
        orderItems: orderItemsFormatted,
        estimatedTime: formatEstimatedTime(orderData?.estimated_delivery_minutes),
        googleMapsLink: googleMapsLink
      });
    }

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
      text: finalMessage,
      linkPreview: false  // Desabilitado para evitar preview com imagem errada
    };

    console.log(`[whatsapp-auto-send] Enviando para: ${formattedPhone}`);
    console.log(`[whatsapp-auto-send] Mensagem: ${finalMessage}`);

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
      phone: formattedPhone,
      customerType: classification.type,
      greeting: greeting
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
