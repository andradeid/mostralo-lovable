import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enviar mensagem via UaZapi (único provedor para instância master)
async function sendViaUaZapi(
  supabase: any,
  instanceToken: string,
  targetNumber: string,
  text: string
): Promise<{ ok: boolean; data: any }> {
  const { data: uazapiConfig } = await supabase
    .from('uazapi_config')
    .select('api_url')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (!uazapiConfig) {
    return { ok: false, data: { error: 'UaZapi não configurada' } };
  }

  const apiUrl = uazapiConfig.api_url.replace(/\/$/, '');
  console.log(`[send-master-notification] Enviando via UaZapi para ${targetNumber}`);

  const response = await fetch(`${apiUrl}/send/text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'token': instanceToken,
    },
    body: JSON.stringify({ number: targetNumber, text }),
  });

  const result = await response.json();
  return { ok: response.ok, data: result };
}

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

    // Verificar se instância está conectada
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
${data.source ? `🔗 *Origem:* ${data.source}` : ''}${data.salesperson_name ? `
🤝 *Indicado por:* ${data.salesperson_name}` : ''}

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
          const isAutoRegistration = data.source === 'self_registration';
          
          message = `🏪 *${isAutoRegistration ? 'NOVO LOJISTA CADASTRADO' : 'NOVA LOJA ATIVADA'}*

📋 *Loja:* ${data.name || 'N/A'}
🔗 *Slug:* ${data.slug || 'N/A'}
📍 *Cidade:* ${data.city || 'N/A'}${data.state ? ` - ${data.state}` : ''}${isAutoRegistration ? `

👤 *Proprietário:* ${data.owner_name || 'N/A'}
📧 *Email:* ${data.owner_email || 'N/A'}
📱 *Telefone:* ${data.owner_phone || 'N/A'}
📦 *Plano:* ${data.plan_name || 'N/A'}
🔔 *Origem:* Cadastro próprio` : ''}

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

      case 'instance_disconnected':
        if (config.notify_instance_disconnected) {
          shouldSend = true;
          message = `⚠️ *INSTÂNCIA DESCONECTOU*

🏪 *Loja:* ${data.store_name || 'N/A'}
📱 *Instância:* ${data.instance_name || 'N/A'}
🔌 *Motivo:* ${data.reason || 'Desconhecido'}

⏰ ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
        }
        break;

      case 'new_order':
        if (config.notify_new_order) {
          shouldSend = true;
          message = `📦 *NOVO PEDIDO*

🏪 *Loja:* ${data.store_name || 'N/A'}
🔢 *Pedido:* #${data.order_number || 'N/A'}
👤 *Cliente:* ${data.customer_name || 'N/A'}
💰 *Total:* R$ ${data.total?.toFixed(2) || '0.00'}

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

    // Montar número completo
    const countryCode = (config.notification_country_code || '+55').replace('+', '');
    const fullNumber = countryCode + config.notification_phone;

    // evolution_instance_id armazena o token UaZapi da instância master
    const instanceToken = config.evolution_instance_id || null;

    const { ok, data: result } = await sendWhatsAppMessage(
      supabase,
      config.instance_name,
      instanceToken,
      fullNumber,
      message
    );

    if (!ok) {
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
