import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper: enviar mensagem via UaZapi ou Evolution API
async function sendViaProvider(
  supabase: any,
  provider: string,
  instanceName: string,
  apiToken: string | null,
  targetNumber: string,
  text: string
): Promise<{ ok: boolean; data: any }> {
  if (provider === 'uazapi' && apiToken) {
    // Buscar URL da UaZapi
    const { data: uazapiConfig } = await supabase
      .from('uazapi_config')
      .select('api_url')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (uazapiConfig) {
      const apiUrl = uazapiConfig.api_url.replace(/\/$/, '');
      console.log(`[send-store-notification] Enviando via UaZapi para ${targetNumber}`);

      const response = await fetch(`${apiUrl}/send/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': apiToken,
        },
        body: JSON.stringify({ number: targetNumber, text }),
      });

      const result = await response.json();
      return { ok: response.ok, data: result };
    }
  }

  // Fallback: tentar UaZapi sem token específico (não deveria chegar aqui)
  console.error('[send-store-notification] Nenhum provedor UaZapi configurado para esta instância');
  return { ok: false, data: { error: 'Nenhum provedor WhatsApp configurado (UaZapi token ausente)' } };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data = await req.json();
    
    console.log('[send-store-notification] Recebido:', JSON.stringify(data, null, 2));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      store_id,
      order_id,
      order_number,
      customer_name,
      customer_phone,
      customer_address,
      customer_latitude,
      customer_longitude,
      delivery_address,
      total,
      subtotal,
      delivery_fee,
      delivery_type,
      payment_method,
      notes,
      created_at,
      is_test
    } = data;

    // Buscar dados da loja
    console.log('[send-store-notification] Buscando dados da loja:', store_id);
    
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select(`
        id,
        name,
        slug,
        notification_phone,
        notification_country_code,
        notification_phone_2,
        notification_country_code_2,
        new_order_message_template,
        notify_new_orders,
        whatsapp,
        phone,
        use_master_for_notifications
      `)
      .eq('id', store_id)
      .single();

    if (storeError || !storeData) {
      console.error('[send-store-notification] Loja não encontrada:', storeError);
      return new Response(JSON.stringify({ success: false, reason: 'store_not_found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[send-store-notification] Dados da loja:', JSON.stringify(storeData, null, 2));

    // Verificar se notificações estão ativas
    if (storeData.notify_new_orders === false) {
      console.log('[send-store-notification] Notificações desativadas para esta loja');
      return new Response(JSON.stringify({ success: false, reason: 'notifications_disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const store_name = storeData.name;
    const store_slug = storeData.slug;
    const notification_phone = storeData.notification_phone;
    const notification_country_code = storeData.notification_country_code;
    const notification_phone_2 = storeData.notification_phone_2;
    const notification_country_code_2 = storeData.notification_country_code_2;
    const new_order_message_template = storeData.new_order_message_template;
    const store_whatsapp = storeData.whatsapp;
    const store_phone = storeData.phone;

    // Buscar instância WhatsApp da loja (com provider e api_token)
    const { data: instanceData } = await supabase
      .from('whatsapp_instances')
      .select('instance_name, phone_number, status, provider, api_token')
      .eq('store_id', store_id)
      .eq('status', 'connected')
      .limit(1)
      .single();

    const instance_phone = instanceData?.phone_number;
    let instanceToUse = instanceData?.instance_name;
    let instanceConnected = instanceData?.status === 'connected';
    let instanceProvider = instanceData?.provider || 'evolution';
    let instanceApiToken = instanceData?.api_token || null;

    // Lista de números para enviar
    const phoneNumbers: Array<{ phone: string; countryCode: string }> = [];

    if (notification_phone) {
      phoneNumbers.push({ phone: notification_phone, countryCode: notification_country_code || '+55' });
    }
    if (notification_phone_2) {
      phoneNumbers.push({ phone: notification_phone_2, countryCode: notification_country_code_2 || '+55' });
    }

    // Fallback para outros números da loja
    if (phoneNumbers.length === 0) {
      const fallbackPhone = instance_phone || store_whatsapp || store_phone;
      if (fallbackPhone) {
        phoneNumbers.push({ phone: fallbackPhone, countryCode: '+55' });
      }
    }

    if (phoneNumbers.length === 0) {
      console.log('[send-store-notification] Nenhum número de destino disponível');
      return new Response(JSON.stringify({ success: false, reason: 'no_phone' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Se não tem instância da loja, tentar usar a master (se autorizado)
    if (!instanceToUse || !instanceConnected) {
      const allowMasterFallback = storeData.use_master_for_notifications === true;
      
      if (allowMasterFallback) {
        console.log('[send-store-notification] Loja sem instância ativa, usando master (autorizado)...');
        
        const { data: masterConfig } = await supabase
          .from('master_whatsapp_config')
          .select('instance_name, instance_status, evolution_instance_id')
          .limit(1)
          .single();

        if (masterConfig && masterConfig.instance_status === 'connected') {
          instanceToUse = masterConfig.instance_name;
          instanceConnected = true;
          // Master usa UaZapi - evolution_instance_id guarda o token
          if (masterConfig.evolution_instance_id) {
            instanceProvider = 'uazapi';
            instanceApiToken = masterConfig.evolution_instance_id;
          }
          console.log('[send-store-notification] Usando instância master:', instanceToUse, 'provider:', instanceProvider);
        }
      } else {
        console.log('[send-store-notification] Loja sem instância ativa e uso de master não autorizado');
      }
    }

    if (!instanceToUse || !instanceConnected) {
      console.log('[send-store-notification] Nenhuma instância WhatsApp conectada');
      return new Response(JSON.stringify({ success: false, reason: 'no_instance' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Formatar data/hora
    const orderDate = new Date(created_at);
    const formattedDate = orderDate.toLocaleString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const deliveryTypeText = delivery_type === 'delivery' ? '🚗 Delivery' : '🏪 Retirada';

    const paymentMethodMap: Record<string, string> = {
      'dinheiro': '💵 Dinheiro', 'cash': '💵 Dinheiro',
      'pix': '📲 PIX',
      'cartao_credito': '💳 Cartão de Crédito', 'credit_card': '💳 Cartão de Crédito',
      'cartao_debito': '💳 Cartão de Débito', 'debit_card': '💳 Cartão de Débito',
      'online': '🌐 Pagamento Online'
    };
    const paymentMethodText = paymentMethodMap[payment_method] || payment_method || 'N/A';

    const addressToShow = delivery_type === 'delivery' 
      ? (delivery_address || customer_address || 'Não informado')
      : 'Retirada no local';

    // Gerar link de navegação
    const generateNavigationLink = (): string => {
      if (customer_latitude && customer_longitude) {
        const baseUrl = 'https://mostralo.com.br/navegar';
        const params = new URLSearchParams();
        params.set('lat', String(customer_latitude));
        params.set('lng', String(customer_longitude));
        if (store_slug) params.set('store', store_slug);
        if (addressToShow && addressToShow !== 'Não informado' && addressToShow !== 'Retirada no local') {
          params.set('address', addressToShow);
        }
        return `${baseUrl}?${params.toString()}`;
      }
      if (delivery_type === 'delivery' && addressToShow !== 'Não informado') {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressToShow)}`;
      }
      return '';
    };
    const googleMapsLink = generateNavigationLink();

    const formatCurrency = (value: number | string | undefined | null): string => {
      if (value === undefined || value === null) return 'R$ 0,00';
      const num = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
      return `R$ ${num.toFixed(2).replace('.', ',')}`;
    };

    // Mensagem padrão
    const defaultMessage = `📦 *NOVO PEDIDO!*

🔢 *Pedido:* #${order_number || order_id?.slice(0, 8).toUpperCase()}
👤 *Cliente:* ${customer_name || 'N/A'}
📱 *Tel:* ${customer_phone || 'N/A'}
💰 *Total:* ${formatCurrency(total)}
${deliveryTypeText}
📍 *Endereço:* ${delivery_type === 'delivery' ? addressToShow : 'Retirada no local'}
💳 *Pagamento:* ${paymentMethodText}
📝 *Obs:* ${notes || 'Nenhuma'}
${delivery_type === 'delivery' && googleMapsLink ? `🗺️ *Navegação:* ${googleMapsLink}` : ''}

⏰ ${formattedDate}`;

    let message = defaultMessage;
    
    if (new_order_message_template && new_order_message_template.trim()) {
      message = new_order_message_template
        .replace(/{numero_pedido}/g, `#${order_number || order_id?.slice(0, 8).toUpperCase()}`)
        .replace(/{cliente_nome}/g, customer_name || 'N/A')
        .replace(/{cliente_telefone}/g, customer_phone || 'N/A')
        .replace(/{total}/g, formatCurrency(total))
        .replace(/{subtotal}/g, formatCurrency(subtotal))
        .replace(/{taxa_entrega}/g, formatCurrency(delivery_fee))
        .replace(/{tipo_entrega}/g, deliveryTypeText)
        .replace(/{endereco}/g, addressToShow)
        .replace(/{link_google_maps}/g, googleMapsLink || 'Link não disponível')
        .replace(/{forma_pagamento}/g, paymentMethodText)
        .replace(/{observacoes}/g, notes || 'Nenhuma')
        .replace(/{data_hora}/g, formattedDate)
        .replace(/{loja_nome}/g, store_name || 'Loja');
    }

    if (is_test) {
      message = `🧪 *MENSAGEM DE TESTE*\n\n${message}`;
    }

    // Enviar mensagem para cada número
    const results: any[] = [];

    for (const phoneData of phoneNumbers) {
      let targetPhone = phoneData.phone.replace(/\D/g, '');
      const countryCode = phoneData.countryCode.replace('+', '');
      if (!targetPhone.startsWith(countryCode) && !targetPhone.startsWith('55')) {
        targetPhone = countryCode + targetPhone;
      }

      console.log(`[send-store-notification] Enviando para ${targetPhone} via ${instanceProvider}/${instanceToUse}`);

      try {
        const { ok, data: result } = await sendViaProvider(
          supabase,
          instanceProvider,
          instanceToUse,
          instanceApiToken,
          targetPhone,
          message
        );

        if (!ok) {
          console.error(`[send-store-notification] Erro ao enviar para ${targetPhone}:`, result);
          results.push({ phone: targetPhone, success: false, error: result });
        } else {
          console.log(`[send-store-notification] Mensagem enviada com sucesso para ${targetPhone}`);
          results.push({ phone: targetPhone, success: true, result });
        }
      } catch (error) {
        console.error(`[send-store-notification] Erro ao enviar para ${targetPhone}:`, error);
        results.push({ phone: targetPhone, success: false, error: String(error) });
      }
    }

    const anySuccess = results.some(r => r.success);

    console.log(`[send-store-notification] Resultado final para loja ${store_name}:`, results);

    return new Response(JSON.stringify({ 
      success: anySuccess, 
      results,
      message: anySuccess ? 'Mensagem enviada com sucesso' : 'Falha ao enviar mensagens'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[send-store-notification] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
