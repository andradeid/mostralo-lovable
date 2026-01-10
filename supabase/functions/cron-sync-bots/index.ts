// Cron Sync Bots - Processa sincronização em LOTES para escalar
// v2.0.0 - Batch processing: apenas needs_sync=true, limite de 20 por execução
// Deploy forçado: 2026-01-10T22:00
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FUNCTION_VERSION = '2.0.0';
const BATCH_LIMIT = 20; // Processar no máximo 20 bots por execução

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log(`🔄 [CRON-SYNC v${FUNCTION_VERSION}] Iniciando sincronização em lote...`);

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // ESTRATÉGIA ESCALÁVEL:
    // 1. Buscar APENAS configs com enabled=true E needs_sync=true
    // 2. Limitar a BATCH_LIMIT por execução
    // 3. Ordenar por updated_at ASC (mais antigos primeiro = fila justa)
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
        needs_sync,
        last_synced_at,
        store:stores!inner (
          id,
          name,
          slug
        ),
        whatsapp_instance:whatsapp_instances!store_bot_config_whatsapp_instance_id_fkey (
          id,
          instance_name
        )
      `)
      .eq('enabled', true)
      .eq('needs_sync', true)
      .order('updated_at', { ascending: true })
      .limit(BATCH_LIMIT);

    if (botConfigsError) {
      console.error('❌ [CRON-SYNC] Erro ao buscar configs:', botConfigsError);
      return new Response(JSON.stringify({
        success: false,
        error: botConfigsError.message,
        version: FUNCTION_VERSION,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!botConfigs || botConfigs.length === 0) {
      console.log('✅ [CRON-SYNC] Nenhum bot pendente de sincronização');
      return new Response(JSON.stringify({
        success: true,
        message: 'Nenhum bot pendente de sincronização',
        synced: 0,
        pending: 0,
        version: FUNCTION_VERSION,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar quantos ainda estão pendentes (para informar ao admin)
    const { count: pendingCount } = await supabase
      .from('store_bot_config')
      .select('id', { count: 'exact', head: true })
      .eq('enabled', true)
      .eq('needs_sync', true);

    console.log(`📋 [CRON-SYNC] Processando ${botConfigs.length} de ${pendingCount || botConfigs.length} pendente(s)`);

    const results: { 
      store: string; 
      store_id: string;
      config_id: string;
      whatsapp_instance_id: string | null;
      instance_found_by: string;
      success: boolean; 
      error?: string;
    }[] = [];

    for (const botConfig of botConfigs as any[]) {
      const storeData = Array.isArray(botConfig.store) ? botConfig.store[0] : botConfig.store;
      const storeId = storeData?.id || botConfig.store_id;
      const storeName = storeData?.name || storeId;
      const configId = botConfig.id;

      // FONTE ÚNICA DE VERDADE: whatsapp_instance via FK (whatsapp_instance_id)
      const whatsappInstance = Array.isArray(botConfig.whatsapp_instance)
        ? botConfig.whatsapp_instance[0]
        : botConfig.whatsapp_instance;

      const instanceName = whatsappInstance?.instance_name;
      const instanceId = botConfig.whatsapp_instance_id;

      console.log(`🔍 [CRON-SYNC] ${storeName}: config_id=${configId}, instance_id=${instanceId || 'NULL'}`);

      // Se não tem instância vinculada via FK, não processa
      if (!instanceName) {
        console.log(`⏭️ [CRON-SYNC] ${storeName}: sem whatsapp_instance_id vinculado - pulando`);
        
        // Marcar erro no banco para visibilidade
        await supabase
          .from('store_bot_config')
          .update({ 
            last_sync_error: 'WhatsApp não vinculado. Clique em "Aplicar Mudanças" no painel.',
            needs_sync: true, // Mantém pendente
          })
          .eq('id', configId);

        results.push({ 
          store: storeName, 
          store_id: storeId,
          config_id: configId,
          whatsapp_instance_id: instanceId,
          instance_found_by: 'none',
          success: false, 
          error: 'WhatsApp não vinculado ao bot config' 
        });
        continue;
      }

      console.log(`🔄 [CRON-SYNC] Sincronizando: ${storeName} (${instanceName})`);

      try {
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

        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const functionUrl = `${supabaseUrl}/functions/v1/openai-bot-sync`;

        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
            'X-Internal-Secret': serviceRoleKey,
          },
          body: JSON.stringify({
            action: 'update',
            config,
            origin: 'https://mostralo.com.br',
          }),
        });

        const syncResult = await response.json();

        if (response.ok && syncResult?.success) {
          console.log(`✅ [CRON-SYNC] ${storeName}: sincronizado com sucesso`);
          
          // Marcar como sincronizado (needs_sync=false, last_synced_at=now, limpar erro)
          await supabase
            .from('store_bot_config')
            .update({ 
              needs_sync: false,
              last_synced_at: new Date().toISOString(),
              last_sync_error: null,
            })
            .eq('id', configId);

          results.push({ 
            store: storeName, 
            store_id: storeId,
            config_id: configId,
            whatsapp_instance_id: instanceId,
            instance_found_by: 'fk_join',
            success: true 
          });
        } else {
          const msg = syncResult?.error || syncResult?.message || 'Erro desconhecido';
          console.error(`❌ [CRON-SYNC] ${storeName}: ${msg}`);

          // Marcar erro mas manter needs_sync=true para tentar novamente
          await supabase
            .from('store_bot_config')
            .update({ 
              last_sync_error: msg,
              // needs_sync permanece true
            })
            .eq('id', configId);

          results.push({ 
            store: storeName, 
            store_id: storeId,
            config_id: configId,
            whatsapp_instance_id: instanceId,
            instance_found_by: 'fk_join',
            success: false, 
            error: msg 
          });
        }
      } catch (err) {
        const errMsg = String(err);
        console.error(`❌ [CRON-SYNC] ${storeName}: Erro na execução:`, err);
        
        await supabase
          .from('store_bot_config')
          .update({ last_sync_error: errMsg })
          .eq('id', configId);

        results.push({ 
          store: storeName, 
          store_id: storeId,
          config_id: configId,
          whatsapp_instance_id: instanceId,
          instance_found_by: 'fk_join',
          success: false, 
          error: errMsg 
        });
      }

      // Delay entre sincronizações
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const elapsed = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const remainingPending = (pendingCount || 0) - successCount;

    console.log(`🏁 [CRON-SYNC] Finalizado em ${elapsed}ms - ${successCount}/${botConfigs.length} sincronizados`);
    if (remainingPending > 0) {
      console.log(`📋 [CRON-SYNC] ${remainingPending} ainda pendente(s) para próxima execução`);
    }

    return new Response(JSON.stringify({
      success: true,
      synced: successCount,
      processed: botConfigs.length,
      pending_remaining: remainingPending > 0 ? remainingPending : 0,
      elapsed_ms: elapsed,
      version: FUNCTION_VERSION,
      batch_limit: BATCH_LIMIT,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ [CRON-SYNC] Erro geral:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: String(error),
      version: FUNCTION_VERSION,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
