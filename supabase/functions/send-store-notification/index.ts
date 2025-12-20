import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      store_name,
      notification_phone,
      notification_country_code,
      notification_phone_2,
      notification_country_code_2,
      new_order_message_template,
      instance_phone,
      instance_name,
      instance_status,
      store_whatsapp,
      store_phone,
      order_number,
      customer_name,
      customer_phone,
      customer_address,
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

    // Lista de números para enviar (pode ter até 2)
    const phoneNumbers: Array<{ phone: string; countryCode: string }> = [];

    // Adicionar número 1 se existir
    if (notification_phone) {
      phoneNumbers.push({
        phone: notification_phone,
        countryCode: notification_country_code || '+55'
      });
    }

    // Adicionar número 2 se existir
    if (notification_phone_2) {
      phoneNumbers.push({
        phone: notification_phone_2,
        countryCode: notification_country_code_2 || '+55'
      });
    }

    // Fallback para outros números da loja
    if (phoneNumbers.length === 0) {
      const fallbackPhone = instance_phone || store_whatsapp || store_phone;
      if (fallbackPhone) {
        phoneNumbers.push({
          phone: fallbackPhone,
          countryCode: '+55'
        });
      }
    }

    if (phoneNumbers.length === 0) {
      console.log('[send-store-notification] Nenhum número de destino disponível');
      return new Response(JSON.stringify({ success: false, reason: 'no_phone' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar instância WhatsApp da loja (se não veio do trigger)
    let instanceToUse = instance_name;
    let instanceConnected = instance_status === 'connected';

    if (!instanceToUse) {
      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('instance_name, status')
        .eq('store_id', store_id)
        .eq('status', 'connected')
        .limit(1)
        .single();

      if (instance) {
        instanceToUse = instance.instance_name;
        instanceConnected = true;
        console.log(`[send-store-notification] Usando instância da loja: ${instanceToUse}`);
      }
    }

    // Se não tem instância da loja, tentar usar a master
    if (!instanceToUse || !instanceConnected) {
      console.log('[send-store-notification] Loja sem instância ativa, usando master...');
      
      const { data: masterConfig } = await supabase
        .from('master_whatsapp_config')
        .select('instance_name, instance_status')
        .limit(1)
        .single();

      if (masterConfig && masterConfig.instance_status === 'connected') {
        instanceToUse = masterConfig.instance_name;
        instanceConnected = true;
        console.log('[send-store-notification] Usando instância master:', instanceToUse);
      }
    }

    if (!instanceToUse || !instanceConnected) {
      console.log('[send-store-notification] Nenhuma instância WhatsApp conectada');
      return new Response(JSON.stringify({ success: false, reason: 'no_instance' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar config da Evolution API
    const { data: evolutionConfig, error: evolutionError } = await supabase
      .from('evolution_config')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (evolutionError || !evolutionConfig) {
      console.error('[send-store-notification] Evolution config não encontrada');
      return new Response(JSON.stringify({ success: false, reason: 'no_evolution_config' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Formatar data/hora
    const orderDate = new Date(created_at);
    const formattedDate = orderDate.toLocaleString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Formatar tipo de entrega
    const deliveryTypeText = delivery_type === 'delivery' ? '🚗 Delivery' : '🏪 Retirada';

    // Formatar método de pagamento
    const paymentMethodMap: Record<string, string> = {
      'dinheiro': '💵 Dinheiro',
      'cash': '💵 Dinheiro',
      'pix': '📲 PIX',
      'cartao_credito': '💳 Cartão de Crédito',
      'credit_card': '💳 Cartão de Crédito',
      'cartao_debito': '💳 Cartão de Débito',
      'debit_card': '💳 Cartão de Débito',
      'online': '🌐 Pagamento Online'
    };
    const paymentMethodText = paymentMethodMap[payment_method] || payment_method || 'N/A';

    // Formatar endereço
    const addressToShow = delivery_type === 'delivery' 
      ? (delivery_address || customer_address || 'Não informado')
      : 'Retirada no local';

    // Gerar link de navegação (página Mostralo com escolha Google Maps/Waze)
    const generateNavigationLink = (): string => {
      // Se tem coordenadas, usar a página /navegar do Mostralo
      if (data.customer_latitude && data.customer_longitude) {
        const baseUrl = 'https://mostralo-lovable.lovable.app/navegar';
        const params = new URLSearchParams();
        params.set('lat', String(data.customer_latitude));
        params.set('lng', String(data.customer_longitude));
        
        // Adicionar slug da loja se disponível
        if (data.store_slug) {
          params.set('store', data.store_slug);
        }
        
        // Adicionar endereço se disponível
        if (addressToShow && addressToShow !== 'Não informado' && addressToShow !== 'Retirada no local') {
          params.set('address', addressToShow);
        }
        
        return `${baseUrl}?${params.toString()}`;
      }
      
      // Fallback: se não tem coordenadas mas tem endereço, usar Google Maps direto
      if (delivery_type === 'delivery' && addressToShow !== 'Não informado') {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressToShow)}`;
      }
      
      return '';
    };
    const googleMapsLink = generateNavigationLink();

    // Formatar valores monetários
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
${delivery_type === 'delivery' ? `📍 *Endereço:* ${addressToShow}` : ''}
💳 *Pagamento:* ${paymentMethodText}
${notes ? `📝 *Obs:* ${notes}` : ''}

⏰ ${formattedDate}`;

    // Usar template customizado ou mensagem padrão
    let message = defaultMessage;
    
    if (new_order_message_template && new_order_message_template.trim()) {
      // Substituir variáveis no template
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

    // Se for teste, adicionar indicador
    if (is_test) {
      message = `🧪 *MENSAGEM DE TESTE*\n\n${message}`;
    }

    // Enviar mensagem para cada número
    const apiUrl = evolutionConfig.api_url.replace(/\/$/, '');
    const sendUrl = `${apiUrl}/message/sendText/${instanceToUse}`;
    const results: any[] = [];

    for (const phoneData of phoneNumbers) {
      // Limpar número (remover caracteres não numéricos)
      let targetPhone = phoneData.phone.replace(/\D/g, '');
      
      // Adicionar código do país se necessário
      const countryCode = phoneData.countryCode.replace('+', '');
      if (!targetPhone.startsWith(countryCode) && !targetPhone.startsWith('55')) {
        targetPhone = countryCode + targetPhone;
      }

      console.log(`[send-store-notification] Enviando para ${targetPhone} via ${instanceToUse}`);

      try {
        const response = await fetch(sendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionConfig.api_key
          },
          body: JSON.stringify({
            number: targetPhone,
            text: message
          })
        });

        const result = await response.json();

        if (!response.ok) {
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

    // Verificar se pelo menos uma mensagem foi enviada com sucesso
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