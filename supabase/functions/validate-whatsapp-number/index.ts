import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, leadName, sendWelcome, storeId } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Número não fornecido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[validate-whatsapp] Validando número:', phone, 'storeId:', storeId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Normalizar número
    let normalizedPhone = phone.replace(/\D/g, '');
    if (!normalizedPhone.startsWith('55')) {
      normalizedPhone = '55' + normalizedPhone;
    }

    // Se storeId fornecido, buscar instância da loja para determinar provider
    let instance: any = null;
    if (storeId) {
      const { data: inst } = await supabase
        .from('whatsapp_instances')
        .select('api_token, provider, instance_name')
        .eq('store_id', storeId)
        .eq('status', 'connected')
        .limit(1)
        .single();
      instance = inst;
    }

    // Se temos instância UaZapi, usar seus endpoints
    if (instance?.provider === 'uazapi' && instance?.api_token) {
      console.log('[validate-whatsapp] Usando UaZapi para validação');

      const { data: uazapiConfig } = await supabase
        .from('uazapi_config')
        .select('api_url')
        .limit(1)
        .single();

      if (!uazapiConfig?.api_url) {
        return new Response(
          JSON.stringify({ valid: false, error: 'UaZapi não configurada' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const baseUrl = uazapiConfig.api_url.replace(/\/+$/, '');
      const token = instance.api_token;

      // Step 1: /chat/check
      console.log('[validate-whatsapp] UaZapi /chat/check para:', normalizedPhone);
      const checkResponse = await fetch(`${baseUrl}/chat/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'token': token },
        body: JSON.stringify({ numbers: [normalizedPhone] }),
      });

      if (!checkResponse.ok) {
        const errText = await checkResponse.text();
        console.error('[validate-whatsapp] UaZapi check failed:', errText);
        return new Response(
          JSON.stringify({ valid: false, error: 'Falha ao validar' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const checkData = await checkResponse.json();
      console.log('[validate-whatsapp] UaZapi check result:', JSON.stringify(checkData));

      // Interpretar resultado
      let isValid = false;
      let jid = '';
      let verifiedName = '';

      if (Array.isArray(checkData)) {
        const entry = checkData[0];
        isValid = entry?.isInWhatsapp === true || entry?.exists === true || entry?.valid === true;
        jid = entry?.jid || entry?.number || '';
        verifiedName = entry?.verifiedName || entry?.name || '';
      } else if (checkData?.result) {
        const entries = Array.isArray(checkData.result) ? checkData.result : [checkData.result];
        const entry = entries[0];
        isValid = entry?.isInWhatsapp === true || entry?.exists === true;
        jid = entry?.jid || entry?.number || '';
        verifiedName = entry?.verifiedName || entry?.name || '';
      } else if (checkData?.isInWhatsapp !== undefined) {
        isValid = checkData.isInWhatsapp === true;
        jid = checkData.jid || '';
        verifiedName = checkData.verifiedName || '';
      }

      if (!isValid) {
        console.log('[validate-whatsapp] Número NÃO encontrado no WhatsApp');
        return new Response(
          JSON.stringify({ valid: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Step 2: /chat/details para buscar nome e foto
      let pushName = verifiedName || null;
      let pictureUrl: string | null = null;

      try {
        console.log('[validate-whatsapp] UaZapi /chat/details para:', normalizedPhone);
        const detailsResponse = await fetch(`${baseUrl}/chat/details`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'token': token },
          body: JSON.stringify({ number: normalizedPhone, preview: true }),
        });

        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json();
          console.log('[validate-whatsapp] UaZapi details:', JSON.stringify(detailsData));
          pushName = detailsData?.wa_name || detailsData?.name || pushName;
          pictureUrl = detailsData?.image || detailsData?.profilePicUrl || null;
        }
      } catch (detailErr) {
        console.error('[validate-whatsapp] Details error (non-blocking):', detailErr);
      }

      console.log('[validate-whatsapp] ✅ Válido! pushName:', pushName, 'foto:', pictureUrl ? 'sim' : 'não');

      return new Response(
        JSON.stringify({
          valid: true,
          pushName,
          profilePictureUrl: pictureUrl,
          pictureUrl,
          jid,
          formattedNumber: normalizedPhone,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== FALLBACK: Master UaZapi ==========
    console.log('[validate-whatsapp] Usando instância Master UaZapi para validação');

    const { data: uazapiConfig } = await supabase
      .from('uazapi_config')
      .select('api_url')
      .limit(1)
      .single();

    const { data: masterConfig } = await supabase
      .from('master_whatsapp_config')
      .select('evolution_instance_id, instance_status')
      .limit(1)
      .single();

    if (!uazapiConfig?.api_url || !masterConfig?.evolution_instance_id) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Instância master não configurada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['open', 'connected'].includes(masterConfig.instance_status || '')) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Instância master não conectada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const masterBaseUrl = uazapiConfig.api_url.replace(/\/+$/, '');
    const masterToken = masterConfig.evolution_instance_id;

    // UaZapi: /chat/check
    console.log('[validate-whatsapp] Master UaZapi /chat/check para:', normalizedPhone);
    const checkResp = await fetch(`${masterBaseUrl}/chat/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': masterToken },
      body: JSON.stringify({ numbers: [normalizedPhone] }),
    });

    if (!checkResp.ok) {
      const errText = await checkResp.text();
      console.error('[validate-whatsapp] Master check failed:', errText);
      return new Response(
        JSON.stringify({ valid: false, error: 'Erro ao consultar WhatsApp' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const checkResult = await checkResp.json();
    console.log('[validate-whatsapp] Master check result:', JSON.stringify(checkResult));

    let masterValid = false;
    let masterJid = '';
    let masterName = '';

    if (Array.isArray(checkResult)) {
      const entry = checkResult[0];
      masterValid = entry?.isInWhatsapp === true || entry?.exists === true || entry?.valid === true;
      masterJid = entry?.jid || entry?.number || '';
      masterName = entry?.verifiedName || entry?.name || '';
    } else if (checkResult?.isInWhatsapp !== undefined) {
      masterValid = checkResult.isInWhatsapp === true;
      masterJid = checkResult.jid || '';
      masterName = checkResult.verifiedName || '';
    }

    if (!masterValid) {
      console.log('[validate-whatsapp] Número NÃO encontrado no WhatsApp (master)');
      return new Response(
        JSON.stringify({ valid: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar detalhes (nome/foto)
    let masterPushName = masterName || null;
    let masterPicUrl: string | null = null;

    try {
      const detResp = await fetch(`${masterBaseUrl}/chat/details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'token': masterToken },
        body: JSON.stringify({ number: normalizedPhone, preview: true }),
      });
      if (detResp.ok) {
        const detData = await detResp.json();
        masterPushName = detData?.wa_name || detData?.name || masterPushName;
        masterPicUrl = detData?.image || detData?.profilePicUrl || null;
      }
    } catch (detErr) {
      console.error('[validate-whatsapp] Master details error (non-blocking):', detErr);
    }

    // sendWelcome via UaZapi master
    let welcomeSent = false;
    if (sendWelcome && leadName) {
      try {
        const firstName = leadName.split(' ')[0];
        const welcomeMessage = `Olá ${firstName}! 👋\n\nObrigado pelo interesse no *Mostralo*! 🚀\n\nEm instantes um consultor vai entrar em contato.\n\nEnquanto isso, pode mandar qualquer dúvida aqui! 😊`;
        const sendResp = await fetch(`${masterBaseUrl}/send/text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'token': masterToken },
          body: JSON.stringify({ phone: normalizedPhone, message: welcomeMessage }),
        });
        welcomeSent = sendResp.ok;
      } catch {}
    }

    console.log('[validate-whatsapp] ✅ Válido (master)! pushName:', masterPushName);

    return new Response(
      JSON.stringify({
        valid: true,
        jid: masterJid,
        profilePictureUrl: masterPicUrl,
        pictureUrl: masterPicUrl,
        pushName: masterPushName,
        formattedNumber: normalizedPhone,
        welcomeSent,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[validate-whatsapp] Erro:', error);
    return new Response(
      JSON.stringify({ valid: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
