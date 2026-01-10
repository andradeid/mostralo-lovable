// Cron Sync Bots - Executa "Aplicar Mudanças" para todas as lojas com bot ativo
// v1.0.1 - Corrigido query via join com stores
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

  const startTime = Date.now();
  console.log('🔄 [CRON-SYNC] Iniciando sincronização de bots...');

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar todas as lojas com bot ativo e instância configurada
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select(`
        id,
        name,
        slug,
        whatsapp_instances!inner (
          instance_name
        ),
        store_bot_config!inner (
          enabled,
          bot_name,
          delay_message,
          expire_minutes,
          keyword_finish,
          unknown_message,
          keep_open,
          debounce_time,
          trigger_type,
          trigger_operator,
          trigger_value,
          ignore_jids,
          stop_bot_from_me,
          listening_from_me,
          split_messages,
          time_per_char
        )
      `)
      .eq('store_bot_config.enabled', true);

    if (storesError) {
      console.error('❌ [CRON-SYNC] Erro ao buscar lojas:', storesError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: storesError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!stores || stores.length === 0) {
      console.log('ℹ️ [CRON-SYNC] Nenhuma loja com bot ativo encontrada');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Nenhuma loja com bot ativo',
        synced: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📋 [CRON-SYNC] ${stores.length} loja(s) com bot ativo encontrada(s)`);

    const results: { store: string; success: boolean; error?: string }[] = [];

    // Para cada loja, chamar a edge function openai-bot-sync
    for (const store of stores) {
      // Supabase retorna arrays para joins, pegamos o primeiro item
      const whatsappInstance = Array.isArray(store.whatsapp_instances) 
        ? store.whatsapp_instances[0] 
        : store.whatsapp_instances;
      const botConfigData = Array.isArray(store.store_bot_config) 
        ? store.store_bot_config[0] 
        : store.store_bot_config;
      
      const instanceName = whatsappInstance?.instance_name;

      if (!instanceName || !botConfigData) {
        console.log(`⏭️ [CRON-SYNC] Pulando ${store.name}: sem instância ou config`);
        results.push({ store: store.name, success: false, error: 'Sem instância ou config' });
        continue;
      }

      console.log(`🔄 [CRON-SYNC] Sincronizando: ${store.name} (${instanceName})`);

      try {
        // Montar o config igual ao frontend faz
        const config = {
          storeId: store.id,
          instanceName: instanceName,
          botName: botConfigData.bot_name || 'Assistente Virtual',
          stopBotFromMe: botConfigData.stop_bot_from_me ?? true,
          listeningFromMe: botConfigData.listening_from_me ?? false,
          delayMessage: botConfigData.delay_message ?? 1000,
          expireMinutes: botConfigData.expire_minutes ?? 20,
          keywordFinish: botConfigData.keyword_finish || '#sair',
          unknownMessage: botConfigData.unknown_message || '',
          keepOpen: botConfigData.keep_open ?? false,
          debounceTime: botConfigData.debounce_time ?? 10,
          triggerType: botConfigData.trigger_type || 'all',
          triggerOperator: botConfigData.trigger_operator || 'contains',
          triggerValue: botConfigData.trigger_value || '',
          ignoreJids: botConfigData.ignore_jids || [],
          splitMessages: botConfigData.split_messages ?? false,
          timePerChar: botConfigData.time_per_char ?? 50
        };

        // Chamar openai-bot-sync internamente com header de chamada interna
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const syncResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/openai-bot-sync`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'X-Internal-Secret': serviceRoleKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'update',
              config: config,
              origin: 'https://mostralo.com.br'
            }),
          }
        );

        const syncResult = await syncResponse.json();

        if (syncResponse.ok && syncResult.success) {
          console.log(`✅ [CRON-SYNC] ${store.name}: sincronizado com sucesso`);
          results.push({ store: store.name, success: true });
        } else {
          console.error(`❌ [CRON-SYNC] ${store.name}: ${syncResult.error || 'Erro desconhecido'}`);
          results.push({ store: store.name, success: false, error: syncResult.error });
        }
      } catch (err) {
        console.error(`❌ [CRON-SYNC] ${store.name}: Erro na requisição:`, err);
        results.push({ store: store.name, success: false, error: String(err) });
      }

      // Pequeno delay entre lojas para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const elapsed = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;

    console.log(`🏁 [CRON-SYNC] Finalizado em ${elapsed}ms - ${successCount}/${stores.length} sincronizados`);

    return new Response(JSON.stringify({
      success: true,
      synced: successCount,
      total: stores.length,
      elapsed_ms: elapsed,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ [CRON-SYNC] Erro geral:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: String(error) 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
