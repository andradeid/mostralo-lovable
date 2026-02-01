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

    // Buscar configuração da Evolution API
    const { data: evolutionConfig, error: evolutionError } = await supabase
      .from('evolution_config')
      .select('api_url, api_key')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (evolutionError || !evolutionConfig) {
      console.error('[fetch-profile-picture] Evolution config não encontrada:', evolutionError);
      return new Response(
        JSON.stringify({ error: 'Configuração não encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determinar qual instância usar
    let instanceName: string | null = null;

    // Se storeId foi fornecido, tentar usar instância da loja
    if (storeId) {
      const { data: storeInstance } = await supabase
        .from('whatsapp_instances')
        .select('instance_name, status')
        .eq('store_id', storeId)
        .eq('status', 'connected')
        .limit(1)
        .single();

      if (storeInstance) {
        instanceName = storeInstance.instance_name;
        console.log('[fetch-profile-picture] Usando instância da loja:', instanceName);
      }
    }

    // Fallback: usar instância master
    if (!instanceName) {
      const { data: masterConfig } = await supabase
        .from('master_whatsapp_config')
        .select('instance_name, instance_status')
        .limit(1)
        .single();

      if (masterConfig && ['open', 'connected'].includes(masterConfig.instance_status || '')) {
        instanceName = masterConfig.instance_name;
        console.log('[fetch-profile-picture] Usando instância master:', instanceName);
      }
    }

    if (!instanceName) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma instância disponível' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar foto de perfil via Evolution API
    const apiUrl = evolutionConfig.api_url.replace(/\/+$/, '');
    const profilePicResponse = await fetch(
      `${apiUrl}/chat/fetchProfilePictureUrl/${instanceName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionConfig.api_key,
        },
        body: JSON.stringify({ number: normalizedPhone }),
      }
    );

    if (!profilePicResponse.ok) {
      const errorText = await profilePicResponse.text();
      console.log('[fetch-profile-picture] Erro Evolution:', profilePicResponse.status, errorText);
      return new Response(
        JSON.stringify({ pictureUrl: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const picData = await profilePicResponse.json();
    const pictureUrl = picData.profilePictureUrl || picData.pictureUrl || null;

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
