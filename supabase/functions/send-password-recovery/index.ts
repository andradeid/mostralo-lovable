import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { normalizePhoneCanonical, getPhoneVariants } from '../_shared/phoneUtils.ts';

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

    // Buscar cliente pelo telefone usando variantes (tolera 10 ou 11 dígitos)
    const phoneVariants = getPhoneVariants(phone);
    const canonicalPhone = normalizePhoneCanonical(phone);
    console.log(`[send-password-recovery] Buscando variantes: ${phoneVariants.join(', ')}`);
    
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name, phone, table_password, auth_user_id')
      .in('phone', phoneVariants)
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle();

    if (customerError || !customer) {
      console.log('[send-password-recovery] Cliente não encontrado');
      return new Response(JSON.stringify({ success: false, error: 'Cliente não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[send-password-recovery] Cliente: ${customer.name} | auth_user_id: ${customer.auth_user_id ? 'SIM' : 'NÃO'} | table_password: ${customer.table_password ? 'SIM' : 'NÃO'}`);

    // Cliente precisa ter pelo menos uma forma de autenticação
    if (!customer.table_password && !customer.auth_user_id) {
      console.log('[send-password-recovery] Cliente sem nenhuma forma de autenticação');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Você ainda não tem senha cadastrada. Use "Criar conta" para definir sua senha.' 
      }), {
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

    const customerFirstName = customer.name?.split(' ')[0] || 'Cliente';
    let message = '';

    // Se tem table_password, envia a senha diretamente
    if (customer.table_password) {
      message = `Olá ${customerFirstName}! 👋

Você solicitou recuperação de senha no *Mostralo*.

🔐 *Sua senha é:* ${customer.table_password}

Use ela em qualquer loja do sistema!

🔒 _Mostralo - Sistema de Lojas_`;
    } 
    // Se só tem auth_user_id, gera uma nova senha e atualiza
    else if (customer.auth_user_id) {
      // Gerar nova senha numérica de 6 dígitos
      const newPassword = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Atualizar senha no Supabase Auth
      const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
        customer.auth_user_id,
        { password: newPassword }
      );

      if (updateAuthError) {
        console.error('[send-password-recovery] Erro ao atualizar senha auth:', updateAuthError);
        return new Response(JSON.stringify({ success: false, error: 'Erro ao gerar nova senha' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Também salva no table_password para próximas recuperações
      await supabase
        .from('customers')
        .update({ table_password: newPassword })
        .eq('id', customer.id);

      console.log(`[send-password-recovery] Nova senha gerada para ${customerFirstName}`);

      message = `Olá ${customerFirstName}! 👋

Você solicitou recuperação de senha no *Mostralo*.

🔐 *Sua nova senha é:* ${newPassword}

Use ela em qualquer loja do sistema!

⚠️ _Recomendamos que você altere sua senha após o login._

🔒 _Mostralo - Sistema de Lojas_`;
    }

    // Montar número completo do cliente usando formato canônico
    const customerNumber = '55' + canonicalPhone;

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
