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
    const { phone, storeId } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Número não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[fetch-profile-picture] Buscando foto para:', phone);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Normalizar número
    let normalizedPhone = phone.replace(/\D/g, '');
    if (!normalizedPhone.startsWith('55') && normalizedPhone.length <= 11) {
      normalizedPhone = '55' + normalizedPhone;
    }

    // Determinar qual instância usar
    let instanceToken: string | null = null;
    let uazapiBaseUrl: string | null = null;

    // Buscar config UaZapi
    const { data: uaCfg } = await supabase.from('uazapi_config').select('api_url').limit(1).single();

    // Se storeId foi fornecido, tentar usar instância da loja
    if (storeId && uaCfg?.api_url) {
      const { data: storeInstance } = await supabase
        .from('whatsapp_instances')
        .select('instance_name, status, api_token, provider')
        .eq('store_id', storeId)
        .eq('status', 'connected')
        .eq('provider', 'uazapi')
        .limit(1)
        .single();

      if (storeInstance?.api_token) {
        instanceToken = storeInstance.api_token;
        uazapiBaseUrl = uaCfg.api_url.replace(/\/+$/, '');
        console.log('[fetch-profile-picture] Usando instância da loja UaZapi');
      }
    }

    // Fallback: usar instância master
    if (!instanceToken && uaCfg?.api_url) {
      const { data: masterConfig } = await supabase
        .from('master_whatsapp_config')
        .select('instance_name, instance_status, api_token')
        .limit(1)
        .single();

      if (masterConfig && ['open', 'connected'].includes(masterConfig.instance_status || '') && masterConfig.api_token) {
        instanceToken = masterConfig.api_token;
        uazapiBaseUrl = uaCfg.api_url.replace(/\/+$/, '');
        console.log('[fetch-profile-picture] Usando instância master UaZapi');
      }
    }

    if (!instanceToken || !uazapiBaseUrl) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma instância disponível' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar foto de perfil via UaZapi
    const profilePicResponse = await fetch(
      `${uazapiBaseUrl}/contact/profile-picture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': instanceToken,
        },
        body: JSON.stringify({ number: normalizedPhone }),
      }
    );

    if (!profilePicResponse.ok) {
      const errorText = await profilePicResponse.text();
      console.log('[fetch-profile-picture] Erro UaZapi:', profilePicResponse.status, errorText);
      return new Response(
        JSON.stringify({ pictureUrl: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const picData = await profilePicResponse.json();
    const pictureUrl = picData.profilePictureUrl || picData.pictureUrl || picData.url || null;

    console.log('[fetch-profile-picture] Foto encontrada:', pictureUrl ? 'Sim' : 'Não');

    // Se encontrou foto, atualizar no whatsapp_contacts se existir
    if (pictureUrl && storeId) {
      await supabase
        .from('whatsapp_contacts')
        .update({ profile_picture_url: pictureUrl })
        .eq('store_id', storeId)
        .or(`phone_number.eq.${normalizedPhone},phone_number.eq.${normalizedPhone.substring(2)}`);
    }

    return new Response(
      JSON.stringify({ pictureUrl, phone: normalizedPhone }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[fetch-profile-picture] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
