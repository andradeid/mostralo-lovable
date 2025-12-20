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
      delivery_type,
      payment_method,
      notes,
      created_at
    } = data;

    // Determinar número de destino (prioridade: notification_phone > instance_phone > whatsapp > phone)
    let targetPhone = notification_phone || instance_phone || store_whatsapp || store_phone;
    
    if (!targetPhone) {
      console.log('[send-store-notification] Nenhum número de destino disponível');
      return new Response(JSON.stringify({ success: false, reason: 'no_phone' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Limpar número (remover caracteres não numéricos)
    targetPhone = targetPhone.replace(/\D/g, '');
    
    // Adicionar código do país se necessário
    const countryCode = (notification_country_code || '+55').replace('+', '');
    if (!targetPhone.startsWith(countryCode) && !targetPhone.startsWith('55')) {
      targetPhone = countryCode + targetPhone;
    }

    // Buscar instância WhatsApp da loja (se não veio do trigger)
    let instanceToUse = instance_name;
    let instanceConnected = instance_status === 'open' || instance_status === 'connected';

    if (!instanceToUse) {
      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('instance_name, status')
        .eq('store_id', store_id)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (instance) {
        instanceToUse = instance.instance_name;
        instanceConnected = instance.status === 'open' || instance.status === 'connected';
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

      if (masterConfig && (masterConfig.instance_status === 'open' || masterConfig.instance_status === 'connected')) {
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

    // Montar mensagem
    const message = `📦 *NOVO PEDIDO!*

🔢 *Pedido:* #${order_number || order_id?.slice(0, 8).toUpperCase()}
👤 *Cliente:* ${customer_name || 'N/A'}
📱 *Tel:* ${customer_phone || 'N/A'}
💰 *Total:* R$ ${typeof total === 'number' ? total.toFixed(2) : total || '0.00'}
${deliveryTypeText}
${delivery_type === 'delivery' ? `📍 *Endereço:* ${addressToShow}` : ''}
💳 *Pagamento:* ${paymentMethodText}
${notes ? `📝 *Obs:* ${notes}` : ''}

⏰ ${formattedDate}`;

    // Enviar mensagem via Evolution API
    const apiUrl = evolutionConfig.api_url.replace(/\/$/, '');
    const sendUrl = `${apiUrl}/message/sendText/${instanceToUse}`;

    console.log(`[send-store-notification] Enviando para ${targetPhone} via ${instanceToUse}`);

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
      console.error('[send-store-notification] Erro ao enviar:', result);
      return new Response(JSON.stringify({ success: false, error: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[send-store-notification] Mensagem enviada com sucesso para loja ${store_name}:`, result);

    return new Response(JSON.stringify({ success: true, result }), {
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
