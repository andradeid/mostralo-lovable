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
    const { email, phone } = await req.json();
    
    console.log(`[send-user-recovery-link] Solicitação - email: ${email?.substring(0, 3) || 'N/A'}*** phone: ${phone ? phone.substring(0, 4) + '***' : 'N/A'}`);

    if (!email && !phone) {
      return new Response(JSON.stringify({ success: false, error: 'Email ou telefone é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let profile: any = null;

    if (email) {
      // Buscar por email
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, user_type, email')
        .eq('email', email.toLowerCase().trim())
        .single();
      if (!error) profile = { ...data, name: data.full_name };
    }

    if (!profile && phone) {
      // Buscar por telefone (tentar variantes)
      let normalizedPhone = phone.replace(/\D/g, '');
      if (normalizedPhone.startsWith('55') && normalizedPhone.length > 11) {
        normalizedPhone = normalizedPhone.substring(2);
      }
      
      // Gerar variantes para busca
      const variants = [normalizedPhone];
      if (normalizedPhone.length === 10) {
        variants.push(normalizedPhone.substring(0, 2) + '9' + normalizedPhone.substring(2));
      }
      if (normalizedPhone.length === 11 && normalizedPhone[2] === '9') {
        variants.push(normalizedPhone.substring(0, 2) + normalizedPhone.substring(3));
      }
      variants.push('55' + normalizedPhone);
      
      // Buscar todos os perfis com esse telefone e priorizar store_admin
      const { data: phoneResults, error: phoneError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, user_type, email')
        .or(variants.map(v => `phone.ilike.%${v}%`).join(','));
      
      if (!phoneError && phoneResults && phoneResults.length > 0) {
        // Priorizar store_admin > master_admin > outros
        const priorityOrder = ['store_admin', 'master_admin', 'attendant', 'delivery_driver'];
        const sorted = phoneResults.sort((a: any, b: any) => {
          const aIdx = priorityOrder.indexOf(a.user_type || '');
          const bIdx = priorityOrder.indexOf(b.user_type || '');
          return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
        });
        const found = sorted[0];
        profile = { ...found, name: found.full_name };
        console.log(`[send-user-recovery-link] Encontrado: ${profile.name} (${profile.user_type}) entre ${phoneResults.length} resultado(s)`);
      }
    }

    if (!profile) {
      console.log('[send-user-recovery-link] Usuário não encontrado');
      return new Response(JSON.stringify({ success: false, error: 'Usuário não encontrado' }), {
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
    const profileEmail = profile.email || email;
    if (!profileEmail) {
      return new Response(JSON.stringify({ success: false, error: 'Usuário não possui email cadastrado para recuperação' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: profileEmail.toLowerCase().trim(),
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

    // O link gerado - corrigir redirect_to para produção
    let recoveryLink = linkData.properties?.action_link || '';
    
    // Substituir localhost por domínio de produção no redirect_to
    if (recoveryLink) {
      recoveryLink = recoveryLink.replace(
        /redirect_to=http[s]?:\/\/localhost[^&]*/,
        `redirect_to=${encodeURIComponent(siteUrl + '/auth/reset-password')}`
      );
    }
    
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

    // Buscar config da UaZapi
    const { data: uazapiConfig, error: uazapiError } = await supabase
      .from('uazapi_config')
      .select('api_url')
      .order('is_active', { ascending: false })
      .limit(1)
      .single();

    if (uazapiError || !uazapiConfig?.api_url) {
      console.error('[send-user-recovery-link] UaZapi config não encontrada');
      return new Response(JSON.stringify({ success: false, error: 'Configuração de envio não disponível' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Token UaZapi da instância master (armazenado em evolution_instance_id)
    const instanceToken = config.evolution_instance_id;
    if (!instanceToken) {
      console.error('[send-user-recovery-link] Token UaZapi não encontrado');
      return new Response(JSON.stringify({ success: false, error: 'Token da instância não configurado' }), {
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

    // Enviar mensagem via UaZapi
    const apiUrl = uazapiConfig.api_url.replace(/\/$/, '');

    console.log(`[send-user-recovery-link] Enviando via UaZapi para ${userNumber.substring(0, 6)}***`);

    const response = await fetch(`${apiUrl}/send/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': instanceToken,
      },
      body: JSON.stringify({
        number: userNumber,
        text: message,
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