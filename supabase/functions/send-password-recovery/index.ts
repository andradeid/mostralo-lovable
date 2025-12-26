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
    const { phone, customerId } = await req.json();
    
    console.log(`[send-password-recovery] Solicitação para phone: ${phone?.substring(0, 4)}***`);

    if (!phone) {
      return new Response(JSON.stringify({ success: false, error: 'Telefone é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar cliente pelo telefone
    const normalizedPhone = phone.replace(/\D/g, '');
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name, phone, table_password')
      .eq('phone', normalizedPhone)
      .is('deleted_at', null)
      .single();

    if (customerError || !customer) {
      console.log('[send-password-recovery] Cliente não encontrado');
      return new Response(JSON.stringify({ success: false, error: 'Cliente não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!customer.table_password) {
      console.log('[send-password-recovery] Cliente sem senha cadastrada');
      return new Response(JSON.stringify({ success: false, error: 'Cliente sem senha cadastrada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar configuração master do WhatsApp
    const { data: config, error: configError } = await supabase
      .from('master_whatsapp_config')
      .select('*')
      .limit(1)
      .single();

    if (configError || !config) {
      console.log('[send-password-recovery] Config master não encontrada');
      return new Response(JSON.stringify({ success: false, error: 'Configuração de WhatsApp não disponível' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se instância está conectada
    if (config.instance_status !== 'open' && config.instance_status !== 'connected') {
      console.log('[send-password-recovery] Instância não conectada:', config.instance_status);
      return new Response(JSON.stringify({ success: false, error: 'WhatsApp não está disponível no momento' }), {
        status: 503,
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
      console.error('[send-password-recovery] Evolution config não encontrada');
      return new Response(JSON.stringify({ success: false, error: 'Configuração de envio não disponível' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Montar mensagem de recuperação
    const customerFirstName = customer.name?.split(' ')[0] || 'Cliente';
    const message = `Olá ${customerFirstName}! 👋

Você solicitou recuperação de senha no *Mostralo*.

🔐 *Sua senha é:* ${customer.table_password}

Use ela em qualquer loja do sistema!

🔒 _Mostralo - Sistema de Lojas_`;

    // Montar número completo do cliente
    const customerNumber = '55' + normalizedPhone;

    // Enviar mensagem via Evolution API
    const apiUrl = evolutionConfig.api_url.replace(/\/$/, '');
    const sendUrl = `${apiUrl}/message/sendText/${config.instance_name}`;

    console.log(`[send-password-recovery] Enviando para ${customerNumber.substring(0, 6)}***`);

    const response = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionConfig.api_key
      },
      body: JSON.stringify({
        number: customerNumber,
        text: message
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[send-password-recovery] Erro ao enviar:', result);
      return new Response(JSON.stringify({ success: false, error: 'Falha ao enviar mensagem' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[send-password-recovery] Senha enviada com sucesso para ${customerFirstName}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[send-password-recovery] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
