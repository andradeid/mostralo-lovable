import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

    const body = await req.json();
    const { action } = body;

    // Auto-cleanup can be called by cron (no auth needed, uses service role)
    if (action === "auto-cleanup") {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      return await handleAutoCleanup(supabase);
    }

    // All other actions require auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify master admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", userId)
      .single();

    if (!profile || profile.user_type !== "master_admin") {
      return new Response(JSON.stringify({ error: "Forbidden - Master admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { store_id } = body;

    switch (action) {
      case "diagnose":
        return await handleDiagnose(supabase);
      case "cleanup":
        if (!store_id) return errorResponse("store_id is required", 400);
        return await handleCleanup(supabase, store_id, userId, "manual");
      case "cleanup-all":
        return await handleCleanupAll(supabase, userId, "manual");
      case "history":
        return await handleHistory(supabase);
      case "get-settings":
        return await handleGetSettings(supabase);
      case "update-settings":
        return await handleUpdateSettings(supabase, body, userId);
      case "toggle-retention":
        if (!store_id) return errorResponse("store_id is required", 400);
        return await handleToggleRetention(supabase, store_id, body.retain);
      default:
        return errorResponse("Invalid action", 400);
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function errorResponse(msg: string, status: number) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonResponse(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function clearQuotedMessageReferences(supabase: any, storeId: string) {
  const { error } = await supabase
    .from("whatsapp_chat_messages")
    .update({ quoted_message_id: null })
    .eq("store_id", storeId)
    .not("quoted_message_id", "is", null);

  if (error) {
    throw new Error("Failed to detach quoted messages: " + error.message);
  }
}

async function handleDiagnose(supabase: any) {
  const { data: stores, error: storesError } = await supabase.rpc("get_stores_without_chat_module");
  if (storesError) return errorResponse("Failed: " + storesError.message, 500);

  const report = [];
  let totalMessages = 0, totalConversations = 0, totalCycles = 0;

  for (const store of stores || []) {
    const { data: counts, error: countError } = await supabase.rpc("count_orphan_whatsapp_data", { p_store_id: store.store_id });
    if (countError) continue;

    const row = counts?.[0] || { messages_count: 0, conversations_count: 0, cycles_count: 0 };
    if (row.messages_count > 0 || row.conversations_count > 0 || row.cycles_count > 0) {
      report.push({
        store_id: store.store_id,
        store_name: store.store_name,
        messages_count: Number(row.messages_count),
        conversations_count: Number(row.conversations_count),
        cycles_count: Number(row.cycles_count),
      });
      totalMessages += Number(row.messages_count);
      totalConversations += Number(row.conversations_count);
      totalCycles += Number(row.cycles_count);
    }
  }

  return jsonResponse({
    success: true,
    report,
    summary: {
      total_stores: report.length,
      total_messages: totalMessages,
      total_conversations: totalConversations,
      total_cycles: totalCycles,
      total_records: totalMessages + totalConversations + totalCycles,
    },
  });
}

async function handleCleanup(supabase: any, storeId: string, userId: string, executionType: string) {
  const { data: beforeCounts } = await supabase.rpc("count_orphan_whatsapp_data", { p_store_id: storeId });
  const before = beforeCounts?.[0] || { messages_count: 0, conversations_count: 0, cycles_count: 0 };

  await clearQuotedMessageReferences(supabase, storeId);

  const { data: result, error: cleanupError } = await supabase.rpc("cleanup_orphan_whatsapp_data", {
    p_store_id: storeId,
    p_batch_size: 1000,
  });
  if (cleanupError) {
    console.error(`[cleanup] RPC failed for store ${storeId}:`, cleanupError);
    return errorResponse("Cleanup failed: " + cleanupError.message, 500);
  }

  const deleted = result?.[0] || { deleted_cycles: 0, deleted_messages: 0, deleted_conversations: 0 };
  const totalDeleted = Number(deleted.deleted_messages) + Number(deleted.deleted_conversations) + Number(deleted.deleted_cycles);

  const { data: storeData } = await supabase.from("stores").select("name").eq("id", storeId).single();

  await supabase.from("whatsapp_cleanup_log").insert({
    store_id: storeId,
    store_name: storeData?.name || "Desconhecida",
    deleted_messages: Number(deleted.deleted_messages),
    deleted_conversations: Number(deleted.deleted_conversations),
    deleted_cycles: Number(deleted.deleted_cycles),
    total_deleted: totalDeleted,
    execution_type: executionType,
    executed_by: userId || null,
  });

  await supabase.from("admin_audit_log").insert({
    admin_id: userId || "00000000-0000-0000-0000-000000000000",
    action: `whatsapp_orphan_cleanup_${executionType}`,
    target_user_id: userId || "00000000-0000-0000-0000-000000000000",
    details: {
      store_id: storeId,
      deleted_messages: Number(deleted.deleted_messages),
      deleted_conversations: Number(deleted.deleted_conversations),
      deleted_cycles: Number(deleted.deleted_cycles),
      before: {
        messages: Number(before.messages_count),
        conversations: Number(before.conversations_count),
        cycles: Number(before.cycles_count),
      },
    },
  });

  return jsonResponse({
    success: true,
    store_id: storeId,
    deleted: {
      messages: Number(deleted.deleted_messages),
      conversations: Number(deleted.deleted_conversations),
      cycles: Number(deleted.deleted_cycles),
      total: totalDeleted,
    },
  });
}

async function handleCleanupAll(supabase: any, userId: string, executionType: string) {
  const { data: stores, error } = await supabase.rpc("get_stores_without_chat_module");
  if (error) return errorResponse("Failed: " + error.message, 500);

  const results = [];
  let grandTotal = 0;

  for (const store of stores || []) {
    const { data: counts } = await supabase.rpc("count_orphan_whatsapp_data", { p_store_id: store.store_id });
    const c = counts?.[0] || { messages_count: 0, conversations_count: 0, cycles_count: 0 };
    if (Number(c.messages_count) === 0 && Number(c.conversations_count) === 0 && Number(c.cycles_count) === 0) continue;

    await clearQuotedMessageReferences(supabase, store.store_id);

    const { data: result, error: cleanupError } = await supabase.rpc("cleanup_orphan_whatsapp_data", {
      p_store_id: store.store_id,
      p_batch_size: 1000,
    });
    if (cleanupError) {
      console.error(`[cleanup-all] RPC failed for store ${store.store_id}:`, cleanupError);
      continue;
    }

    const d = result?.[0] || { deleted_cycles: 0, deleted_messages: 0, deleted_conversations: 0 };
    const total = Number(d.deleted_messages) + Number(d.deleted_conversations) + Number(d.deleted_cycles);
    grandTotal += total;

    await supabase.from("whatsapp_cleanup_log").insert({
      store_id: store.store_id,
      store_name: store.store_name,
      deleted_messages: Number(d.deleted_messages),
      deleted_conversations: Number(d.deleted_conversations),
      deleted_cycles: Number(d.deleted_cycles),
      total_deleted: total,
      execution_type: executionType,
      executed_by: userId || null,
    });

    results.push({
      store_id: store.store_id,
      store_name: store.store_name,
      deleted_messages: Number(d.deleted_messages),
      deleted_conversations: Number(d.deleted_conversations),
      deleted_cycles: Number(d.deleted_cycles),
      total,
    });
  }

  await supabase.from("admin_audit_log").insert({
    admin_id: userId || "00000000-0000-0000-0000-000000000000",
    action: `whatsapp_orphan_cleanup_all_${executionType}`,
    target_user_id: userId || "00000000-0000-0000-0000-000000000000",
    details: { stores_cleaned: results.length, total_records_deleted: grandTotal, breakdown: results },
  });

  return jsonResponse({
    success: true,
    stores_cleaned: results.length,
    total_records_deleted: grandTotal,
    results,
  });
}

async function handleAutoCleanup(supabase: any) {
  const { data: settings } = await supabase
    .from("whatsapp_cleanup_settings")
    .select("*")
    .limit(1)
    .single();

  if (!settings?.is_enabled) {
    return jsonResponse({ success: true, message: "Auto-cleanup is disabled", skipped: true });
  }

  console.log(`[Auto-cleanup] Starting with retention_days=${settings.retention_days}`);

  const { data: stores, error } = await supabase.rpc("get_stores_without_chat_module");
  if (error) {
    console.error("[Auto-cleanup] Failed to get stores:", error);
    return errorResponse("Failed: " + error.message, 500);
  }

  const results = [];
  let grandTotal = 0;

  for (const store of stores || []) {
    const { data: counts } = await supabase.rpc("count_orphan_whatsapp_data", { p_store_id: store.store_id });
    const c = counts?.[0] || { messages_count: 0, conversations_count: 0, cycles_count: 0 };
    if (Number(c.messages_count) === 0 && Number(c.conversations_count) === 0 && Number(c.cycles_count) === 0) continue;

    await clearQuotedMessageReferences(supabase, store.store_id);

    const { data: result, error: cleanupError } = await supabase.rpc("cleanup_orphan_whatsapp_data", {
      p_store_id: store.store_id,
      p_batch_size: 1000,
    });
    if (cleanupError) {
      console.error(`[auto-cleanup] RPC failed for store ${store.store_id}:`, cleanupError);
      continue;
    }

    const d = result?.[0] || { deleted_cycles: 0, deleted_messages: 0, deleted_conversations: 0 };
    const total = Number(d.deleted_messages) + Number(d.deleted_conversations) + Number(d.deleted_cycles);
    grandTotal += total;

    await supabase.from("whatsapp_cleanup_log").insert({
      store_id: store.store_id,
      store_name: store.store_name,
      deleted_messages: Number(d.deleted_messages),
      deleted_conversations: Number(d.deleted_conversations),
      deleted_cycles: Number(d.deleted_cycles),
      total_deleted: total,
      execution_type: "auto",
      executed_by: null,
    });

    results.push({ store_id: store.store_id, store_name: store.store_name, total });
  }

  const nextRun = new Date();
  nextRun.setDate(nextRun.getDate() + settings.retention_days);

  await supabase
    .from("whatsapp_cleanup_settings")
    .update({
      last_run_at: new Date().toISOString(),
      next_run_at: nextRun.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", settings.id);

  console.log(`[Auto-cleanup] Complete. ${results.length} stores cleaned, ${grandTotal} records removed.`);

  return jsonResponse({
    success: true,
    stores_cleaned: results.length,
    total_records_deleted: grandTotal,
    results,
  });
}

async function handleHistory(supabase: any) {
  const { data: logs, error } = await supabase
    .from("whatsapp_cleanup_log")
    .select("*")
    .order("executed_at", { ascending: false })
    .limit(50);

  if (error) return errorResponse("Failed: " + error.message, 500);

  // Compute totals
  const totalDeleted = (logs || []).reduce((sum: number, l: any) => sum + Number(l.total_deleted), 0);
  const executions = (logs || []).length;
  const autoCount = (logs || []).filter((l: any) => l.execution_type === "auto").length;
  const manualCount = executions - autoCount;

  return jsonResponse({
    success: true,
    logs: logs || [],
    summary: { total_deleted: totalDeleted, executions, auto_count: autoCount, manual_count: manualCount },
  });
}

async function handleGetSettings(supabase: any) {
  const { data: settings, error } = await supabase
    .from("whatsapp_cleanup_settings")
    .select("*")
    .limit(1)
    .single();

  if (error) return errorResponse("Failed: " + error.message, 500);

  // Get stores with retention flag
  const { data: retainedStores } = await supabase
    .from("stores")
    .select("id, name, retain_whatsapp_history")
    .eq("retain_whatsapp_history", true);

  return jsonResponse({ success: true, settings, retained_stores: retainedStores || [] });
}

async function handleUpdateSettings(supabase: any, body: any, userId: string) {
  const { is_enabled, retention_days } = body;

  const { data: current } = await supabase
    .from("whatsapp_cleanup_settings")
    .select("id")
    .limit(1)
    .single();

  if (!current) return errorResponse("Settings not found", 404);

  const updates: any = { updated_at: new Date().toISOString(), updated_by: userId };
  if (typeof is_enabled === "boolean") updates.is_enabled = is_enabled;
  if (typeof retention_days === "number" && [7, 15, 30, 60].includes(retention_days)) {
    updates.retention_days = retention_days;
  }

  // If enabling, set next_run
  if (is_enabled === true) {
    const nextRun = new Date();
    nextRun.setDate(nextRun.getDate() + (retention_days || 30));
    updates.next_run_at = nextRun.toISOString();
  }

  const { error } = await supabase
    .from("whatsapp_cleanup_settings")
    .update(updates)
    .eq("id", current.id);

  if (error) return errorResponse("Failed: " + error.message, 500);

  return jsonResponse({ success: true, message: "Settings updated" });
}

async function handleToggleRetention(supabase: any, storeId: string, retain: boolean) {
  const { error } = await supabase
    .from("stores")
    .update({ retain_whatsapp_history: !!retain })
    .eq("id", storeId);

  if (error) return errorResponse("Failed: " + error.message, 500);

  return jsonResponse({ success: true, store_id: storeId, retain_whatsapp_history: !!retain });
}
