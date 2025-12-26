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
    const { email } = await req.json();
    
    console.log(`[send-user-recovery-link] Solicitação para email: ${email?.substring(0, 3)}***`);

    if (!email) {
      return new Response(JSON.stringify({ success: false, error: 'Email é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar profile pelo email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, phone, user_type, email')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (profileError || !profile) {
      console.log('[send-user-recovery-link] Usuário não encontrado');
      return new Response(JSON.stringify({ success: false, error: 'Usuário não encontrado com este email' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se tem telefone cadastrado
    if (!profile.phone) {
      console.log('[send-user-recovery-link] Usuário sem telefone cadastrado');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Você não tem telefone cadastrado. Use a opção de recuperação por email.',
        noPhone: true 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Usar domínio de produção ou variável de ambiente
    const siteUrl = Deno.env.get('SITE_URL') || 'https://mostralo.com.br';
    
    // Gerar link de recuperação usando Supabase Admin API
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email.toLowerCase().trim(),
      options: {
        redirectTo: `${siteUrl}/auth/reset-password`
      }
    });

    if (linkError || !linkData) {
      console.error('[send-user-recovery-link] Erro ao gerar link:', linkError);
      return new Response(JSON.stringify({ success: false, error: 'Erro ao gerar link de recuperação' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // O link gerado
    const recoveryLink = linkData.properties?.action_link || '';
    
    if (!recoveryLink) {
      console.error('[send-user-recovery-link] Link não foi gerado');
      return new Response(JSON.stringify({ success: false, error: 'Erro ao gerar link de recuperação' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[send-user-recovery-link] Link gerado com sucesso');

    // Buscar configuração master do WhatsApp
    const { data: config, error: configError } = await supabase
      .from('master_whatsapp_config')
      .select('*')
      .limit(1)
      .single();

    if (configError || !config) {
      console.log('[send-user-recovery-link] Config master não encontrada');
      return new Response(JSON.stringify({ success: false, error: 'Configuração de WhatsApp não disponível' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se instância está conectada
    if (config.instance_status !== 'open' && config.instance_status !== 'connected') {
      console.log('[send-user-recovery-link] Instância não conectada:', config.instance_status);
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
      console.error('[send-user-recovery-link] Evolution config não encontrada');
      return new Response(JSON.stringify({ success: false, error: 'Configuração de envio não disponível' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Mapear tipo de usuário para texto amigável
    const userTypeLabels: Record<string, string> = {
      'store_admin': 'Lojista',
      'attendant': 'Atendente',
      'delivery_driver': 'Entregador',
      'salesperson': 'Vendedor',
      'master_admin': 'Administrador'
    };

    const userTypeLabel = userTypeLabels[profile.user_type] || 'Usuário';
    const firstName = profile.name?.split(' ')[0] || 'Usuário';

    // Montar mensagem de recuperação
    const message = `Olá ${firstName}! 👋

Você solicitou recuperação de senha no *Mostralo* (${userTypeLabel}).

🔐 Clique no link abaixo para criar uma nova senha:
${recoveryLink}

⚠️ Este link expira em 1 hora.

🔒 _Mostralo - Sistema de Lojas_`;

    // Montar número completo
    const normalizedPhone = profile.phone.replace(/\D/g, '');
    const userNumber = normalizedPhone.startsWith('55') ? normalizedPhone : '55' + normalizedPhone;

    // Enviar mensagem via Evolution API
    const apiUrl = evolutionConfig.api_url.replace(/\/$/, '');
    const sendUrl = `${apiUrl}/message/sendText/${config.instance_name}`;

    console.log(`[send-user-recovery-link] Enviando para ${userNumber.substring(0, 6)}***`);

    const response = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionConfig.api_key
      },
      body: JSON.stringify({
        number: userNumber,
        text: message
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[send-user-recovery-link] Erro ao enviar:', result);
      return new Response(JSON.stringify({ success: false, error: 'Falha ao enviar mensagem' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[send-user-recovery-link] Link enviado com sucesso para ${firstName} (${userTypeLabel})`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Link de recuperação enviado por WhatsApp'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[send-user-recovery-link] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
