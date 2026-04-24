import { createClient } from "npm:@supabase/supabase-js@2";
import { acquireJobLock, releaseJobLock } from "../_shared/jobLock.ts";
import { completeJobRun, createJobRun } from "../_shared/jobObservability.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * system-health-alert
 * Chamada pelo pg_cron a cada 5 minutos OU manualmente (teste).
 * 1. Busca config de alerta
 * 2. Verifica cooldown
 * 3. Coleta métricas leves (connections, cache hit ratio, query time)
 * 4. Se threshold ultrapassado → envia WhatsApp via instância master
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const run = createJobRun('system-health-alert');
  let supabase: ReturnType<typeof createClient> | null = null;
  let lockOwnerId: string | null = null;
  let completionLogged = false;
  let isTest = false;
  let alertCount = 0;
  let queryTimeMs = 0;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    supabase = createClient(supabaseUrl, serviceKey);

    // Check if this is a test request (manual trigger from UI)
    try {
      const body = await req.json();
      isTest = body?.test === true;
    } catch {
      // No body or invalid JSON — cron call
    }

    if (!isTest) {
      const lock = await acquireJobLock(supabase, 'system-health-alert', 240);
      if (!lock) {
        completeJobRun('system-health-alert', run, 'skipped', { reason: 'job_already_running', is_test: false });
        completionLogged = true;
        return jsonResponse({ success: true, skipped: true, reason: 'job_already_running' });
      }
      lockOwnerId = lock.ownerId;
    }

    // 1. Fetch alert config
    const { data: configRaw, error: configError } = await supabase
      .from("system_alert_config")
      .select("*")
      .limit(1)
      .single();
    const config = configRaw as any;

    if (configError || !config) {
      console.log("[system-health-alert] Sem configuração de alerta");
      completeJobRun('system-health-alert', run, 'completed', { status: 'no_config', is_test: isTest });
      completionLogged = true;
      return jsonResponse({ success: false, reason: "no_config" });
    }

    if (!config.is_enabled && !isTest) {
      // Update last check
      await supabase.from("system_alert_config").update({
        last_check_at: new Date().toISOString(),
        last_check_status: "disabled",
      }).eq("id", config.id);

      completeJobRun('system-health-alert', run, 'completed', { status: 'disabled', is_test: false });
      completionLogged = true;
      return jsonResponse({ success: false, reason: "disabled" });
    }

    if (!config.alert_phone) {
      completeJobRun('system-health-alert', run, 'completed', { status: 'no_phone', is_test: isTest });
      completionLogged = true;
      return jsonResponse({ success: false, reason: "no_phone" });
    }

    // 2. Check cooldown (skip for test)
    if (!isTest && config.last_alert_at) {
      const cooldownMs = (config.cooldown_minutes || 30) * 60 * 1000;
      const timeSinceLastAlert = Date.now() - new Date(config.last_alert_at).getTime();
      if (timeSinceLastAlert < cooldownMs) {
        await supabase.from("system_alert_config").update({
          last_check_at: new Date().toISOString(),
          last_check_status: "cooldown",
        }).eq("id", config.id);

        completeJobRun('system-health-alert', run, 'completed', { status: 'cooldown', is_test: false });
        completionLogged = true;
        return jsonResponse({ success: false, reason: "cooldown", nextAlertIn: Math.round((cooldownMs - timeSinceLastAlert) / 60000) });
      }
    }

    // 3. Collect metrics (lightweight RPCs)
    const start = performance.now();

    const { data: connDataRaw } = await supabase.rpc("get_system_health_connections");
    const { data: dbStatsRaw } = await supabase.rpc("get_system_health_db_stats");
    const connData = connDataRaw as any;
    const dbStats = dbStatsRaw as any;

    queryTimeMs = Math.round(performance.now() - start);

    // 4. Evaluate thresholds
    const alerts: string[] = [];

    // Connection usage
    if (connData) {
      const connPercent = connData.max > 0 ? (connData.total / connData.max) * 100 : 0;
      if (connPercent >= (config.max_connections_percent || 80)) {
        alerts.push(`🔴 *Conexões:* ${connData.total}/${connData.max} (${connPercent.toFixed(0)}%) — Limite: ${config.max_connections_percent}%`);
      }
    }

    // Cache hit ratio
    if (dbStats) {
      const cacheHit = dbStats.cacheHitRatio || dbStats.cache_hit_ratio || 0;
      if (cacheHit > 0 && cacheHit < (config.min_cache_hit_ratio || 95)) {
        alerts.push(`🟡 *Cache Hit Ratio:* ${cacheHit.toFixed(2)}% — Mínimo: ${config.min_cache_hit_ratio}%`);
      }
    }

    // Query time
    if (queryTimeMs > (config.max_query_time_ms || 5000)) {
      alerts.push(`🟠 *Query Time:* ${queryTimeMs}ms — Máximo: ${config.max_query_time_ms}ms`);
    }

    // 5. Send alert if needed
    if (alerts.length === 0 && !isTest) {
      await supabase.from("system_alert_config").update({
        last_check_at: new Date().toISOString(),
        last_check_status: "ok",
      }).eq("id", config.id);

      completeJobRun('system-health-alert', run, 'completed', { status: 'healthy', is_test: false, alerts: 0, query_time_ms: queryTimeMs });
      completionLogged = true;
      return jsonResponse({ success: true, status: "healthy", queryTimeMs });
    }

    alertCount = alerts.length;

    // Build message with dynamic status indicators
    const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    
    const connTotal = connData?.total || 0;
    const connMax = connData?.max || 120;
    const connPercent = connMax > 0 ? (connTotal / connMax) * 100 : 0;
    const cacheHit = dbStats?.cacheHitRatio || dbStats?.cache_hit_ratio || 0;

    // Status emojis based on thresholds
    const connIcon = connPercent >= (config.max_connections_percent || 80) ? "🔴" : connPercent >= 60 ? "🟡" : "🟢";
    const cacheIcon = cacheHit < (config.min_cache_hit_ratio || 95) ? "🔴" : cacheHit < 98 ? "🟡" : "🟢";
    const queryIcon = queryTimeMs > (config.max_query_time_ms || 5000) ? "🔴" : queryTimeMs > 2000 ? "🟡" : "🟢";

    let message: string;

    if (isTest && alerts.length === 0) {
      message = `🏪 *MOSTRALO — Alerta do Sistema*
━━━━━━━━━━━━━━━━━━
✅ *TESTE DE ALERTA*

Todos os indicadores estão normais.

${connIcon} *Conexões:* ${connTotal}/${connMax} (${connPercent.toFixed(0)}%)
${cacheIcon} *Cache Hit:* ${cacheHit.toFixed(2)}%
${queryIcon} *Query Time:* ${queryTimeMs}ms

⏰ ${now}
━━━━━━━━━━━━━━━━━━
_Monitoramento automático a cada 5 min_`;
    } else {
      message = `🏪 *MOSTRALO — Alerta do Sistema*
━━━━━━━━━━━━━━━━━━
🚨 *ATENÇÃO${isTest ? ' (TESTE)' : ''}*

${alerts.join("\n")}

📊 *Painel completo:*
${connIcon} Conexões: ${connTotal}/${connMax} (${connPercent.toFixed(0)}%)
${cacheIcon} Cache Hit: ${cacheHit.toFixed(2)}%
${queryIcon} Query Time: ${queryTimeMs}ms

⏰ ${now}
━━━━━━━━━━━━━━━━━━
_Próximo check em ${config.cooldown_minutes || 30} min (cooldown)_`;
    }

    // Send via UaZapi master instance
    const { data: masterConfigRaw } = await supabase
      .from("master_whatsapp_config")
      .select("evolution_instance_id, instance_status")
      .limit(1)
      .single();
    const masterConfig = masterConfigRaw as any;

    if (!masterConfig?.evolution_instance_id) {
      console.error("[system-health-alert] Token da instância master não encontrado");
      completeJobRun('system-health-alert', run, 'failed', { status: 'no_master_token', is_test: isTest, alerts: alertCount, query_time_ms: queryTimeMs });
      completionLogged = true;
      return jsonResponse({ success: false, reason: "no_master_token" });
    }

    if (masterConfig.instance_status !== "open" && masterConfig.instance_status !== "connected") {
      console.error("[system-health-alert] Instância master não conectada:", masterConfig.instance_status);
      completeJobRun('system-health-alert', run, 'failed', { status: 'master_not_connected', is_test: isTest, alerts: alertCount, query_time_ms: queryTimeMs });
      completionLogged = true;
      return jsonResponse({ success: false, reason: "master_not_connected" });
    }

    // Get UaZapi API URL (não depende de is_active, é a config global)
    const { data: uazapiConfigRaw } = await supabase
      .from("uazapi_config")
      .select("api_url")
      .limit(1)
      .single();
    const uazapiConfig = uazapiConfigRaw as any;

    if (!uazapiConfig?.api_url) {
      completeJobRun('system-health-alert', run, 'failed', { status: 'no_uazapi_config', is_test: isTest, alerts: alertCount, query_time_ms: queryTimeMs });
      completionLogged = true;
      return jsonResponse({ success: false, reason: "no_uazapi_config" });
    }

    const apiUrl = uazapiConfig.api_url.replace(/\/$/, "");
    const countryCode = (config.alert_country_code || "+55").replace("+", "");
    const fullNumber = countryCode + config.alert_phone;

    console.log(`[system-health-alert] Enviando alerta para ${fullNumber.substring(0, 6)}***`);

    const sendResponse = await fetch(`${apiUrl}/send/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: masterConfig.evolution_instance_id,
      },
      body: JSON.stringify({ number: fullNumber, text: message }),
    });

    const sendResult = await sendResponse.json();

    if (!sendResponse.ok) {
      console.error("[system-health-alert] Falha no envio:", sendResult);
      await supabase.from("system_alert_config").update({
        last_check_at: new Date().toISOString(),
        last_check_status: "error",
      }).eq("id", config.id);
      completeJobRun('system-health-alert', run, 'failed', { status: 'send_failed', is_test: isTest, alerts: alertCount, query_time_ms: queryTimeMs });
      completionLogged = true;
      return jsonResponse({ success: false, reason: "send_failed", error: sendResult });
    }

    // Update last alert tracking
    await supabase.from("system_alert_config").update({
      last_check_at: new Date().toISOString(),
      last_check_status: isTest ? "test_sent" : "alert_sent",
      last_alert_at: new Date().toISOString(),
      last_alert_type: isTest ? "test" : alerts.map((_, i) => ["connections", "cache", "query_time"][i]).join(","),
    }).eq("id", config.id);

    completeJobRun('system-health-alert', run, 'completed', {
      status: isTest ? 'test_sent' : 'alert_sent',
      is_test: isTest,
      alerts: alertCount,
      query_time_ms: queryTimeMs,
    });
    completionLogged = true;
    return jsonResponse({ success: true, status: isTest ? "test_sent" : "alert_sent", alerts: alerts.length, queryTimeMs });

  } catch (err) {
    console.error("[system-health-alert] Erro:", err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    completeJobRun('system-health-alert', run, 'failed', {
      status: 'error',
      error: errorMessage,
      is_test: isTest,
      alerts: alertCount,
      query_time_ms: queryTimeMs,
    });
    completionLogged = true;
    return jsonResponse({ success: false, error: err instanceof Error ? err.message : String(err) }, 500);
  } finally {
    if (supabase && lockOwnerId) {
      try {
        await releaseJobLock(supabase, 'system-health-alert', lockOwnerId);
      } catch (releaseError) {
        console.error('[system-health-alert] Erro ao liberar lock:', releaseError);
      }
    }

    if (!completionLogged) {
      completeJobRun('system-health-alert', run, 'completed', {
        status: 'completed_without_explicit_result',
        is_test: isTest,
        alerts: alertCount,
        query_time_ms: queryTimeMs,
      });
    }
  }
});

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
