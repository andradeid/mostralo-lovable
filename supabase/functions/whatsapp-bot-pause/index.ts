import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função auxiliar para buscar ignoreJids atuais da Evolution API
async function fetchCurrentSettings(evolutionUrl: string, apiKey: string, instanceName: string): Promise<any> {
  try {
    const resp = await fetch(`${evolutionUrl}/openai/settings/${instanceName}`, {
      method: 'GET',
      headers: { 'apikey': apiKey },
    });
    if (!resp.ok) {
      console.log(`⚠️ GET settings falhou: ${resp.status}`);
      return null;
    }
    const data = await resp.json();
    const settings = Array.isArray(data) ? data[0] : data;
    console.log(`📋 Settings atuais: ${JSON.stringify(settings).slice(0, 500)}`);
    return settings;
  } catch (e) {
    console.error('⚠️ Erro ao buscar settings:', e);
    return null;
  }
}

// Função para atualizar ignoreJids preservando TODOS os outros campos
async function updateIgnoreJids(evolutionUrl: string, apiKey: string, instanceName: string, settings: any, newIgnoreJids: string[]): Promise<boolean> {
  try {
    // Montar payload completo preservando todos os campos existentes
    const s = settings?.OpenaiSetting || settings || {};
    const payload: any = {
      openaiCredsId: s.openaiCredsId || s.openai_creds_id,
      expire: s.expire,
      keywordFinish: s.keywordFinish || s.keyword_finish,
      delayMessage: s.delayMessage || s.delay_message,
      unknownMessage: s.unknownMessage || s.unknown_message,
      listeningFromMe: s.listeningFromMe ?? s.listening_from_me ?? false,
      stopBotFromMe: s.stopBotFromMe ?? s.stop_bot_from_me ?? true,
      keepOpen: s.keepOpen ?? s.keep_open ?? false,
      debounceTime: s.debounceTime ?? s.debounce_time ?? 0,
      ignoreJids: newIgnoreJids,
    };
    // Adicionar fallback se existir
    if (s.openaiIdFallback || s.openai_id_fallback) {
      payload.openaiIdFallback = s.openaiIdFallback || s.openai_id_fallback;
    }

    console.log(`📡 POST settings COMPLETO: ${JSON.stringify(payload).slice(0, 500)}`);

    const resp = await fetch(`${evolutionUrl}/openai/settings/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      body: JSON.stringify(payload),
    });
    const body = await resp.text();
    console.log(`📡 POST settings response: status=${resp.status}, body=${body.slice(0, 300)}`);
    return resp.ok;
  } catch (e) {
    console.error('❌ Erro ao atualizar settings:', e);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { 
      action, // 'pause' | 'reactivate'
      storeId, 
      instanceName, 
      remoteJid, 
      customerName,
      autoReactivateMinutes 
    } = body;

    console.log(`🤖 Bot Pause/Reactivate - Action: ${action}, Store: ${storeId}, JID: ${remoteJid}`);

    // Buscar config da Evolution API
    const { data: evolutionConfig, error: configError } = await supabase
      .from('evolution_config')
      .select('api_url, api_key')
      .eq('is_active', true)
      .single();

    if (configError || !evolutionConfig) {
      console.error('❌ Evolution config não encontrada');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Evolution config not found' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const evolutionUrl = evolutionConfig.api_url.replace(/\/$/, '');
    const evolutionApiKey = evolutionConfig.api_key;

    // ========================================
    // ESTRATÉGIA: Usar ignoreJids no settings da Evolution API
    // Isso é PERSISTENTE e impede que o bot processe mensagens do JID
    // Diferente do changeStatus que é resetado ao receber nova mensagem
    // ========================================

    if (action === 'pause') {
      // 1. Buscar settings completo
      const currentSettings = await fetchCurrentSettings(evolutionUrl, evolutionApiKey, instanceName);
      const s = currentSettings?.OpenaiSetting || currentSettings || {};
      const currentIgnoreJids: string[] = s.ignoreJids || [];
      console.log(`📋 ignoreJids atuais: ${JSON.stringify(currentIgnoreJids)}`);

      // 2. Adicionar JID à lista se não estiver
      if (!currentIgnoreJids.includes(remoteJid)) {
        const updatedJids = [...currentIgnoreJids, remoteJid];
        const success = await updateIgnoreJids(evolutionUrl, evolutionApiKey, instanceName, currentSettings, updatedJids);
        if (success) {
          console.log(`✅ JID ${remoteJid} adicionado a ignoreJids`);
        } else {
          console.error(`❌ Falha ao adicionar JID a ignoreJids`);
        }
      } else {
        console.log(`ℹ️ JID ${remoteJid} já está em ignoreJids`);
      }

      // 3. Também usar changeStatus como backup
      try {
        await fetch(`${evolutionUrl}/openai/changeStatus/${instanceName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
          body: JSON.stringify({ remoteJid, status: 'paused' }),
        });
      } catch (e) {
        console.log('⚠️ changeStatus backup falhou (não crítico):', e);
      }

      // 4. Atualizar banco de dados
      let autoReactivateAt: string | null = null;
      if (autoReactivateMinutes && autoReactivateMinutes > 0) {
        const reactivateDate = new Date();
        reactivateDate.setMinutes(reactivateDate.getMinutes() + autoReactivateMinutes);
        autoReactivateAt = reactivateDate.toISOString();
      }

      const { data: existing } = await supabase
        .from('whatsapp_paused_contacts')
        .select('id')
        .eq('store_id', storeId)
        .eq('remote_jid', remoteJid)
        .eq('status', 'paused')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('whatsapp_paused_contacts')
          .update({
            paused_at: new Date().toISOString(),
            auto_reactivate_at: autoReactivateAt,
            customer_name: customerName,
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('whatsapp_paused_contacts')
          .insert({
            store_id: storeId,
            instance_name: instanceName,
            remote_jid: remoteJid,
            customer_name: customerName,
            paused_by: 'manual_reply',
            auto_reactivate_at: autoReactivateAt,
            status: 'paused',
          });
      }

      return new Response(JSON.stringify({ 
        success: true,
        action: 'paused',
        remoteJid,
        autoReactivateAt,
        method: 'ignoreJids',
        message: autoReactivateAt 
          ? `Bot pausado via ignoreJids. Reativará em ${autoReactivateMinutes} min.`
          : 'Bot pausado via ignoreJids. Reativação manual necessária.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'reactivate') {
      // 1. Buscar settings completo
      const currentSettings = await fetchCurrentSettings(evolutionUrl, evolutionApiKey, instanceName);
      const s = currentSettings?.OpenaiSetting || currentSettings || {};
      const currentIgnoreJids: string[] = s.ignoreJids || [];
      console.log(`📋 ignoreJids atuais: ${JSON.stringify(currentIgnoreJids)}`);

      // 2. Remover JID da lista
      const updatedJids = currentIgnoreJids.filter((jid: string) => jid !== remoteJid);
      if (updatedJids.length !== currentIgnoreJids.length) {
        const success = await updateIgnoreJids(evolutionUrl, evolutionApiKey, instanceName, currentSettings, updatedJids);
        if (success) {
          console.log(`✅ JID ${remoteJid} removido de ignoreJids`);
        }
      }

      // 3. Reabrir sessão via changeStatus
      try {
        await fetch(`${evolutionUrl}/openai/changeStatus/${instanceName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
          body: JSON.stringify({ remoteJid, status: 'opened' }),
        });
      } catch (e) {
        console.log('⚠️ changeStatus opened falhou:', e);
      }

      // 4. Atualizar banco de dados
      await supabase
        .from('whatsapp_paused_contacts')
        .update({
          status: 'reactivated',
          reactivated_at: new Date().toISOString(),
        })
        .eq('store_id', storeId)
        .eq('remote_jid', remoteJid)
        .eq('status', 'paused');

      return new Response(JSON.stringify({ 
        success: true,
        action: 'reactivated',
        remoteJid,
        method: 'ignoreJids_removed',
        message: 'Bot reativado! JID removido de ignoreJids.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Invalid action' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Error:', errorMessage);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
