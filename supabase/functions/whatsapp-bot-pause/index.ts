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
    // ESTRATÉGIA: Usar ignoreJids no bot para bloquear/desbloquear contato
    // changeStatus não funciona porque cria nova sessão a cada mensagem
    // ========================================

    // 1. Buscar bots existentes para esta instância
    let bots: any[] = [];
    try {
      const findResp = await fetch(`${evolutionUrl}/openai/find/${instanceName}`, {
        method: 'GET',
        headers: { 'apikey': evolutionApiKey },
      });
      if (findResp.ok) {
        const data = await findResp.json();
        bots = Array.isArray(data) ? data : (data?.bots || data?.data || []);
      }
      console.log(`📡 Bots encontrados para ${instanceName}: ${bots.length}`);
    } catch (e) {
      console.error('❌ Erro ao buscar bots:', e);
    }

    if (bots.length === 0) {
      console.log('⚠️ Nenhum bot encontrado, apenas atualizando banco');
    }

    // 2. Para cada bot, atualizar ignoreJids
    for (const bot of bots) {
      if (!bot.id) continue;

      const currentIgnoreJids: string[] = Array.isArray(bot.ignoreJids) ? [...bot.ignoreJids] : [];
      let newIgnoreJids: string[];

      if (action === 'pause') {
        // Adicionar JID à lista de ignorados (se não estiver)
        if (!currentIgnoreJids.includes(remoteJid)) {
          newIgnoreJids = [...currentIgnoreJids, remoteJid];
          console.log(`➕ Adicionando ${remoteJid} ao ignoreJids do bot ${bot.id.slice(0, 8)}...`);
        } else {
          console.log(`ℹ️ ${remoteJid} já está no ignoreJids`);
          newIgnoreJids = currentIgnoreJids;
        }
      } else {
        // Remover JID da lista de ignorados
        newIgnoreJids = currentIgnoreJids.filter((jid: string) => jid !== remoteJid);
        console.log(`➖ Removendo ${remoteJid} do ignoreJids do bot ${bot.id.slice(0, 8)}...`);
      }

      // Atualizar bot via PUT /openai/update/:botId/:instanceName
      try {
        const updateResp = await fetch(
          `${evolutionUrl}/openai/update/${bot.id}/${instanceName}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionApiKey,
            },
            body: JSON.stringify({
              ignoreJids: newIgnoreJids,
            }),
          }
        );

        const updateResult = await updateResp.text();
        console.log(`📡 Update bot ${bot.id.slice(0, 8)}: status ${updateResp.status}, response: ${updateResult.slice(0, 200)}`);

        if (!updateResp.ok) {
          console.error(`❌ Erro ao atualizar ignoreJids do bot ${bot.id}:`, updateResult);
        } else {
          console.log(`✅ ignoreJids atualizado com sucesso para bot ${bot.id.slice(0, 8)}`);
        }
      } catch (e) {
        console.error(`❌ Erro ao chamar PUT /openai/update/${bot.id}:`, e);
      }
    }

    // 3. TAMBÉM enviar changeStatus como fallback (belt and suspenders)
    try {
      const status = action === 'pause' ? 'closed' : 'opened';
      console.log(`📡 Fallback: changeStatus para ${status}`);
      await fetch(
        `${evolutionUrl}/openai/changeStatus/${instanceName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey,
          },
          body: JSON.stringify({ remoteJid, status }),
        }
      );
    } catch (e) {
      console.log('⚠️ Fallback changeStatus falhou (não crítico):', e);
    }

    // 4. Atualizar banco de dados
    if (action === 'pause') {
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
        console.log(`✅ Registro de pausa atualizado (timer reiniciado)`);
      } else {
        const { error: insertError } = await supabase
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
        if (insertError) {
          console.error('⚠️ Erro ao salvar pausa:', insertError);
        } else {
          console.log(`✅ Contato pausado registrado no banco`);
        }
      }

      // Também salvar ignoreJids no store_bot_config para persistência
      await supabase
        .from('store_bot_config')
        .update({ ignore_jids: bots[0] ? [...(bots[0].ignoreJids || []), remoteJid].filter((v: string, i: number, a: string[]) => a.indexOf(v) === i) : [remoteJid] })
        .eq('store_id', storeId);

      return new Response(JSON.stringify({ 
        success: true,
        action: 'paused',
        remoteJid,
        autoReactivateAt,
        method: 'ignoreJids',
        message: autoReactivateAt 
          ? `Bot pausado (ignoreJids). Reativará automaticamente em ${autoReactivateMinutes} minutos.`
          : 'Bot pausado (ignoreJids). Reativação manual necessária.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'reactivate') {
      const { error: updateError } = await supabase
        .from('whatsapp_paused_contacts')
        .update({
          status: 'reactivated',
          reactivated_at: new Date().toISOString(),
        })
        .eq('store_id', storeId)
        .eq('remote_jid', remoteJid)
        .eq('status', 'paused');

      if (updateError) {
        console.error('⚠️ Erro ao marcar reativação:', updateError);
      } else {
        console.log(`✅ Contato reativado no banco`);
      }

      // Atualizar ignoreJids no store_bot_config
      const { data: botConfig } = await supabase
        .from('store_bot_config')
        .select('ignore_jids')
        .eq('store_id', storeId)
        .single();

      if (botConfig?.ignore_jids) {
        const updatedJids = (botConfig.ignore_jids as string[]).filter((jid: string) => jid !== remoteJid);
        await supabase
          .from('store_bot_config')
          .update({ ignore_jids: updatedJids })
          .eq('store_id', storeId);
      }

      return new Response(JSON.stringify({ 
        success: true,
        action: 'reactivated',
        remoteJid,
        method: 'ignoreJids',
        message: 'Bot reativado com sucesso!'
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
