import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WelcomeRequest {
  type: 'store_owner' | 'salesperson';
  name: string;
  phone: string;
  extra_data?: {
    store_name?: string;
    slug?: string;
    salesperson_type?: string;
    referral_code?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: WelcomeRequest = await req.json();
    const { type, name, phone, extra_data } = body;

    console.log(`📨 Enviando boas-vindas: ${type} para ${name} (${phone})`);

    if (!type || !name || !phone) {
      return new Response(
        JSON.stringify({ error: 'Dados obrigatórios faltando: type, name, phone' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar configuração do Evolution API
    const { data: evolutionConfig, error: evolutionError } = await supabase
      .from('evolution_config')
      .select('api_url, api_key')
      .eq('is_active', true)
      .single();

    if (evolutionError || !evolutionConfig) {
      console.error('❌ Evolution config não encontrado:', evolutionError);
      return new Response(
        JSON.stringify({ error: 'Configuração Evolution não encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar configuração da instância master
    const { data: masterConfig, error: masterError } = await supabase
      .from('master_whatsapp_config')
      .select('instance_name, instance_status')
      .single();

    if (masterError || !masterConfig) {
      console.error('❌ Master WhatsApp config não encontrado:', masterError);
      return new Response(
        JSON.stringify({ error: 'Configuração Master WhatsApp não encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (masterConfig.instance_status !== 'open' && masterConfig.instance_status !== 'connected') {
      console.warn('⚠️ Instância master não está conectada');
      return new Response(
        JSON.stringify({ error: 'Instância master não conectada', status: masterConfig.instance_status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Formatar número de telefone (remover caracteres e adicionar 55 se necessário)
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = `55${formattedPhone}`;
    }

    // Extrair primeiro nome
    const firstName = name.split(' ')[0];

    // Montar mensagem baseada no tipo
    let message = '';

    if (type === 'store_owner') {
      const storeName = extra_data?.store_name || 'sua loja';
      const slug = extra_data?.slug || '';
      
      message = `Olá ${firstName}! 🎉

Bem-vindo ao *Mostralo*! 🚀

Sua loja *${storeName}* foi criada com sucesso!

🔗 Acesse: mostralo.com.br/loja/${slug}

Em breve você receberá mais informações sobre como configurar seu cardápio e começar a vender.

Qualquer dúvida, estamos aqui! 💬`;
    } else if (type === 'salesperson') {
      const salespersonType = extra_data?.salesperson_type === 'affiliate' ? 'Afiliado' : 'Parceiro PJ';
      const referralCode = extra_data?.referral_code || '';
      
      message = `Olá ${firstName}! 💼

Bem-vindo à equipe *Mostralo*! 🚀

Seu cadastro como *${salespersonType}* foi recebido com sucesso!

🔗 *Seu código de indicação:* ${referralCode}

📌 *Seus links para divulgar:*

🌐 Site: mostralo.com.br/?ref=${referralCode}
📝 Cadastro: mostralo.com.br/signup?ref=${referralCode}

Aguarde a aprovação do seu cadastro para começar a indicar clientes e ganhar comissões!

Qualquer dúvida, estamos aqui! 💬`;
    }

    console.log(`📝 Mensagem montada para ${formattedPhone}`);

    // Enviar mensagem via Evolution API
    const evolutionUrl = `${evolutionConfig.api_url}/message/sendText/${masterConfig.instance_name}`;
    
    const response = await fetch(evolutionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionConfig.api_key,
      },
      body: JSON.stringify({
        number: formattedPhone,
        text: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro ao enviar mensagem:', errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao enviar mensagem', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    console.log(`✅ Boas-vindas enviada com sucesso para ${formattedPhone}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Boas-vindas enviada com sucesso',
        phone: formattedPhone,
        type,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro no send-welcome-message:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
