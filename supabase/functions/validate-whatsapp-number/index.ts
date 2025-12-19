import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    if (!phone) {
      console.log('[validate-whatsapp] Número não fornecido');
      return new Response(
        JSON.stringify({ valid: false, error: 'Número não fornecido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[validate-whatsapp] Validando número:', phone);

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar configuração da Evolution API
    const { data: evolutionConfig, error: evolutionError } = await supabase
      .from('evolution_config')
      .select('api_url, api_key')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (evolutionError || !evolutionConfig) {
      console.error('[validate-whatsapp] Erro ao buscar evolution_config:', evolutionError);
      return new Response(
        JSON.stringify({ valid: false, error: 'Configuração Evolution não encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar instância master
    const { data: masterConfig, error: masterError } = await supabase
      .from('master_whatsapp_config')
      .select('instance_name, instance_status')
      .limit(1)
      .single();

    if (masterError || !masterConfig) {
      console.error('[validate-whatsapp] Erro ao buscar master_whatsapp_config:', masterError);
      return new Response(
        JSON.stringify({ valid: false, error: 'Configuração master não encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['open', 'connected'].includes(masterConfig.instance_status || '')) {
      console.log('[validate-whatsapp] Instância não conectada:', masterConfig.instance_status);
      return new Response(
        JSON.stringify({ valid: false, error: 'Instância não conectada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalizar número (garantir que tem código do país)
    let normalizedPhone = phone.replace(/\D/g, '');
    if (!normalizedPhone.startsWith('55')) {
      normalizedPhone = '55' + normalizedPhone;
    }

    console.log('[validate-whatsapp] Consultando Evolution API para:', normalizedPhone);

    // Chamar Evolution API para verificar número
    const evolutionUrl = `${evolutionConfig.api_url}/chat/whatsappNumbers/${masterConfig.instance_name}`;
    
    const response = await fetch(evolutionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionConfig.api_key
      },
      body: JSON.stringify({
        numbers: [normalizedPhone]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[validate-whatsapp] Erro na Evolution API:', response.status, errorText);
      return new Response(
        JSON.stringify({ valid: false, error: 'Erro ao consultar WhatsApp' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    console.log('[validate-whatsapp] Resposta Evolution:', JSON.stringify(result));

    // Verificar se o número existe no WhatsApp
    // A API retorna um array com objetos contendo { exists: boolean, jid: string }
    const isValid = Array.isArray(result) && result.length > 0 && result[0]?.exists === true;

    console.log('[validate-whatsapp] Número válido:', isValid);

    return new Response(
      JSON.stringify({ 
        valid: isValid,
        jid: isValid ? result[0]?.jid : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[validate-whatsapp] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ valid: false, error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
