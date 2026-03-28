import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Check if this is a test request (manual trigger from UI)
    let isTest = false;
    try {
      const body = await req.json();
      isTest = body?.test === true;
    } catch {
      // No body or invalid JSON — cron call
    }

    // 1. Fetch alert config
    const { data: config, error: configError } = await supabase
      .from("system_alert_config")
      .select("*")
      .limit(1)
      .single();

    if (configError || !config) {
      console.log("[system-health-alert] Sem configuração de alerta");
      return jsonResponse({ success: false, reason: "no_config" });
    }

    if (!config.is_enabled && !isTest) {
      // Update last check
      await supabase.from("system_alert_config").update({
        last_check_at: new Date().toISOString(),
        last_check_status: "disabled",
      }).eq("id", config.id);

      return jsonResponse({ success: false, reason: "disabled" });
    }

    if (!config.alert_phone) {
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

        return jsonResponse({ success: false, reason: "cooldown", nextAlertIn: Math.round((cooldownMs - timeSinceLastAlert) / 60000) });
      }
    }

    // 3. Collect metrics (lightweight RPCs)
    const start = performance.now();

    const { data: connData } = await supabase.rpc("get_system_health_connections");
    const { data: dbStats } = await supabase.rpc("get_system_health_db_stats");

    const queryTimeMs = Math.round(performance.now() - start);

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

      return jsonResponse({ success: true, status: "healthy", queryTimeMs });
    }

    // Build message
    const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    let message: string;

    if (isTest && alerts.length === 0) {
      message = `✅ *TESTE DE ALERTA - SAÚDE DO SISTEMA*

Todos os indicadores estão normais.

📊 *Conexões:* ${connData?.total || 0}/${connData?.max || 120}
💾 *Cache Hit:* ${(dbStats?.cacheHitRatio || dbStats?.cache_hit_ratio || 0).toFixed(2)}%
⚡ *Query Time:* ${queryTimeMs}ms

⏰ ${now}`;
    } else {
      message = `🚨 *ALERTA - SAÚDE DO SISTEMA*${isTest ? ' (TESTE)' : ''}

${alerts.join("\n\n")}

📊 *Resumo:*
• Conexões: ${connData?.total || 0}/${connData?.max || 120}
• Cache Hit: ${(dbStats?.cacheHitRatio || dbStats?.cache_hit_ratio || 0).toFixed(2)}%
• Query Time: ${queryTimeMs}ms

⏰ ${now}`;
    }

    // Send via UaZapi master instance
    const { data: masterConfig } = await supabase
      .from("master_whatsapp_config")
      .select("evolution_instance_id, instance_status")
      .limit(1)
      .single();

    if (!masterConfig?.evolution_instance_id) {
      console.error("[system-health-alert] Token da instância master não encontrado");
      return jsonResponse({ success: false, reason: "no_master_token" });
    }

    if (masterConfig.instance_status !== "open" && masterConfig.instance_status !== "connected") {
      console.error("[system-health-alert] Instância master não conectada:", masterConfig.instance_status);
      return jsonResponse({ success: false, reason: "master_not_connected" });
    }

    // Get UaZapi API URL
    const { data: uazapiConfig } = await supabase
      .from("uazapi_config")
      .select("api_url")
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!uazapiConfig) {
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
      return jsonResponse({ success: false, reason: "send_failed", error: sendResult });
    }

    // Update last alert tracking
    await supabase.from("system_alert_config").update({
      last_check_at: new Date().toISOString(),
      last_check_status: isTest ? "test_sent" : "alert_sent",
      last_alert_at: new Date().toISOString(),
      last_alert_type: isTest ? "test" : alerts.map((_, i) => ["connections", "cache", "query_time"][i]).join(","),
    }).eq("id", config.id);

    return jsonResponse({ success: true, status: isTest ? "test_sent" : "alert_sent", alerts: alerts.length, queryTimeMs });

  } catch (err) {
    console.error("[system-health-alert] Erro:", err);
    return jsonResponse({ success: false, error: err.message }, 500);
  }
});

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
