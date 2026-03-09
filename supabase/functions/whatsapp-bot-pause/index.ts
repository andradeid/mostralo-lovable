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

    // Chamar Evolution API para mudar status do bot
    const status = action === 'pause' ? 'closed' : 'opened';
    
    console.log(`📡 Chamando Evolution API: POST /openai/changeStatus/${instanceName}`);
    console.log(`   Status: ${status}, RemoteJid: ${remoteJid}`);

    const evolutionResponse = await fetch(
      `${evolutionUrl}/openai/changeStatus/${instanceName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify({
          remoteJid,
          status,
        }),
      }
    );

    const evolutionResult = await evolutionResponse.json();
    console.log('📡 Evolution Response:', JSON.stringify(evolutionResult, null, 2));

    if (!evolutionResponse.ok) {
      console.error('❌ Erro na Evolution API:', evolutionResult);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Evolution API error',
        details: evolutionResult
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Atualizar banco de dados
    if (action === 'pause') {
      // Calcular data de reativação automática
      let autoReactivateAt: string | null = null;
      if (autoReactivateMinutes && autoReactivateMinutes > 0) {
        const reactivateDate = new Date();
        reactivateDate.setMinutes(reactivateDate.getMinutes() + autoReactivateMinutes);
        autoReactivateAt = reactivateDate.toISOString();
      }

      // Verificar se já existe registro pausado para este contato
      const { data: existing } = await supabase
        .from('whatsapp_paused_contacts')
        .select('id')
        .eq('store_id', storeId)
        .eq('remote_jid', remoteJid)
        .eq('status', 'paused')
        .maybeSingle();

      if (existing) {
        // Atualizar registro existente (reiniciar timer)
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
        // Criar novo registro
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

      return new Response(JSON.stringify({ 
        success: true,
        action: 'paused',
        remoteJid,
        autoReactivateAt,
        message: autoReactivateAt 
          ? `Bot pausado. Reativará automaticamente em ${autoReactivateMinutes} minutos.`
          : 'Bot pausado. Reativação manual necessária.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'reactivate') {
      // Marcar como reativado no banco
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

      return new Response(JSON.stringify({ 
        success: true,
        action: 'reactivated',
        remoteJid,
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
