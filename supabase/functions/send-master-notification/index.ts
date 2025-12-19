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
    const { type, data } = await req.json();
    
    console.log(`[send-master-notification] Recebido evento: ${type}`, data);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar configuração master
    const { data: config, error: configError } = await supabase
      .from('master_whatsapp_config')
      .select('*')
      .limit(1)
      .single();

    if (configError || !config) {
      console.log('[send-master-notification] Config não encontrada');
      return new Response(JSON.stringify({ success: false, reason: 'no_config' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se tem número configurado
    if (!config.notification_phone) {
      console.log('[send-master-notification] Número de notificação não configurado');
      return new Response(JSON.stringify({ success: false, reason: 'no_phone' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se instância está conectada (aceita 'open' ou 'connected')
    if (config.instance_status !== 'open' && config.instance_status !== 'connected') {
      console.log('[send-master-notification] Instância não conectada:', config.instance_status);
      return new Response(JSON.stringify({ success: false, reason: 'not_connected' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se o tipo de notificação está ativo e montar mensagem
    let message: string | null = null;
    let shouldSend = false;

    switch (type) {
      case 'new_lead':
        if (config.notify_new_lead) {
          shouldSend = true;
          message = `👤 *NOVO LEAD CADASTRADO*

📋 *Nome:* ${data.name || 'N/A'}
🏢 *Empresa:* ${data.company_name || 'N/A'}
📍 *Cidade:* ${data.city || 'N/A'}${data.state ? ` - ${data.state}` : ''}
📱 *Telefone:* ${data.phone || 'N/A'}
📧 *Email:* ${data.email || 'N/A'}
🍕 *Usa iFood:* ${data.uses_ifood ? 'Sim' : 'Não'}
${data.source ? `🔗 *Origem:* ${data.source}` : ''}

⏰ ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
        }
        break;

      case 'new_seller':
        if (config.notify_new_seller) {
          shouldSend = true;
          const tipoVendedor = data.salesperson_type === 'affiliate' ? 'Afiliado' : 'Parceiro PJ';
          message = `💼 *NOVO VENDEDOR CADASTRADO*

📋 *Nome:* ${data.full_name || 'N/A'}
📧 *Email:* ${data.email || 'N/A'}
📱 *Telefone:* ${data.phone || 'N/A'}
🏷️ *Tipo:* ${tipoVendedor}
🔗 *Código:* ${data.referral_code || 'N/A'}

⏰ ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
        }
        break;

      case 'new_store':
        if (config.notify_new_store) {
          shouldSend = true;
          message = `🏪 *NOVA LOJA ATIVADA*

📋 *Loja:* ${data.name || 'N/A'}
🔗 *Slug:* ${data.slug || 'N/A'}
📍 *Cidade:* ${data.city || 'N/A'}${data.state ? ` - ${data.state}` : ''}

⏰ ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
        }
        break;

      case 'payment_received':
        if (config.notify_payment_received) {
          shouldSend = true;
          message = `💳 *PAGAMENTO RECEBIDO*

🏪 *Loja:* ${data.store_name || 'N/A'}
💰 *Valor:* R$ ${data.payment_amount?.toFixed(2) || '0.00'}
📋 *Plano:* ${data.plan_name || 'N/A'}

⏰ ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
        }
        break;

      default:
        console.log(`[send-master-notification] Tipo desconhecido: ${type}`);
    }

    if (!shouldSend || !message) {
      console.log(`[send-master-notification] Notificação ${type} desativada ou sem mensagem`);
      return new Response(JSON.stringify({ success: false, reason: 'notification_disabled' }), {
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
      console.error('[send-master-notification] Evolution config não encontrada');
      return new Response(JSON.stringify({ success: false, reason: 'no_evolution_config' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Montar número completo
    const countryCode = (config.notification_country_code || '+55').replace('+', '');
    const fullNumber = countryCode + config.notification_phone;

    // Enviar mensagem via Evolution API
    const apiUrl = evolutionConfig.api_url.replace(/\/$/, '');
    const sendUrl = `${apiUrl}/message/sendText/${config.instance_name}`;

    console.log(`[send-master-notification] Enviando para ${fullNumber}`);

    const response = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionConfig.api_key
      },
      body: JSON.stringify({
        number: fullNumber,
        text: message
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[send-master-notification] Erro ao enviar:', result);
      return new Response(JSON.stringify({ success: false, error: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[send-master-notification] Mensagem enviada com sucesso:`, result);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[send-master-notification] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
