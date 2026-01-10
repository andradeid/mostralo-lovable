// Cron Sync Bots - Executa "Aplicar Mudanças" para todas as lojas com bot ativo
// v1.1.0 - Corrigido: usa whatsapp_instance_id FK para buscar instance_name
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

    // Buscar configs de bot ativas com instância vinculada (schema atual usa whatsapp_instance_id)
    const { data: botConfigs, error: botConfigsError } = await supabase
      .from('store_bot_config')
      .select(`
        id,
        store_id,
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
        bot_split_messages,
        bot_time_per_char,
        whatsapp_instance_id,
        store:stores!inner (
          id,
          name,
          slug
        ),
        whatsapp_instance:whatsapp_instances!store_bot_config_whatsapp_instance_id_fkey (
          instance_name
        )
      `)
      .eq('enabled', true);

    if (botConfigsError) {
      console.error('❌ [CRON-SYNC] Erro ao buscar configs:', botConfigsError);
      return new Response(JSON.stringify({
        success: false,
        error: botConfigsError.message,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!botConfigs || botConfigs.length === 0) {
      console.log('ℹ️ [CRON-SYNC] Nenhuma loja com bot ativo encontrada');
      return new Response(JSON.stringify({
        success: true,
        message: 'Nenhuma loja com bot ativo',
        synced: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📋 [CRON-SYNC] ${botConfigs.length} bot(s) ativo(s) encontrado(s)`);

    const results: { store: string; success: boolean; error?: string }[] = [];

    // Para cada config ativa, chamar a edge function openai-bot-sync
    for (const botConfig of botConfigs as any[]) {
      const storeData = Array.isArray(botConfig.store) ? botConfig.store[0] : botConfig.store;
      const whatsappInstance = Array.isArray(botConfig.whatsapp_instance)
        ? botConfig.whatsapp_instance[0]
        : botConfig.whatsapp_instance;

      const storeName = storeData?.name || botConfig.store_id;
      const instanceName = whatsappInstance?.instance_name;

      if (!instanceName) {
        console.log(`⏭️ [CRON-SYNC] Pulando ${storeName}: sem whatsapp_instance_id vinculado`);
        results.push({ store: storeName, success: false, error: 'Sem WhatsApp instance vinculada' });
        continue;
      }

      console.log(`🔄 [CRON-SYNC] Sincronizando: ${storeName} (${instanceName})`);

      try {
        // Montar o config no formato esperado pela openai-bot-sync
        const config = {
          storeId: botConfig.store_id,
          instanceName: instanceName,
          botName: botConfig.bot_name || 'Assistente Virtual',
          stopBotFromMe: botConfig.stop_bot_from_me ?? true,
          listeningFromMe: botConfig.listening_from_me ?? false,
          delayMessage: botConfig.delay_message ?? 1000,
          expireMinutes: botConfig.expire_minutes ?? 20,
          keywordFinish: botConfig.keyword_finish || '#sair',
          unknownMessage: botConfig.unknown_message || '',
          keepOpen: botConfig.keep_open ?? false,
          debounceTime: botConfig.debounce_time ?? 10,
          triggerType: botConfig.trigger_type || 'all',
          triggerOperator: botConfig.trigger_operator || 'contains',
          triggerValue: botConfig.trigger_value || '',
          ignoreJids: botConfig.ignore_jids || [],
          splitMessages: botConfig.bot_split_messages ?? true,
          timePerChar: botConfig.bot_time_per_char ?? 50,
        };

        // Chamar openai-bot-sync internamente com header de chamada interna
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const { data: syncResult, error: syncError } = await supabase.functions.invoke(
          'openai-bot-sync',
          {
            headers: {
              'X-Internal-Secret': serviceRoleKey,
            },
            body: {
              action: 'update',
              config,
              origin: 'https://mostralo.com.br',
            },
          }
        );

        if (!syncError && (syncResult as any)?.success) {
          console.log(`✅ [CRON-SYNC] ${storeName}: sincronizado com sucesso`);
          results.push({ store: storeName, success: true });
        } else {
          const msg = (syncError as any)?.message || (syncResult as any)?.error || 'Erro desconhecido';
          console.error(`❌ [CRON-SYNC] ${storeName}: ${msg}`);
          results.push({ store: storeName, success: false, error: msg });
        }
      } catch (err) {
        console.error(`❌ [CRON-SYNC] ${storeName}: Erro na execução:`, err);
        results.push({ store: storeName, success: false, error: String(err) });
      }

      // Pequeno delay entre lojas para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const elapsed = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;

    console.log(`🏁 [CRON-SYNC] Finalizado em ${elapsed}ms - ${successCount}/${botConfigs.length} sincronizados`);

    return new Response(JSON.stringify({
      success: true,
      synced: successCount,
      total: botConfigs.length,
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
