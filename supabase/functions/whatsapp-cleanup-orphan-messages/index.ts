import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { removeChatMediaFiles } from "../_shared/chat-media.ts";
import { listChatMediaObjects, runMediaRetention } from "../_shared/chat-media-retention.ts";

const CLEANUP_BATCH_SIZE = 150;

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const supabaseServiceKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnon = getRequiredEnv("SUPABASE_ANON_KEY");

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
      case "media-diagnose":
        return await handleMediaDiagnose(supabase);
      case "media-retention":
        return await handleMediaRetentionAction(supabase, userId, "manual");
      case "toggle-retention":
        if (!store_id) return errorResponse("store_id is required", 400);
        return await handleToggleRetention(supabase, store_id, body.retain);
      default:
        return errorResponse("Invalid action", 400);
    }
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
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

async function countStoreWhatsAppData(supabase: any, storeId: string) {
  const { data, error } = await supabase.rpc("count_orphan_whatsapp_data", { p_store_id: storeId });

  if (error) {
    throw new Error("Failed to count WhatsApp data: " + error.message);
  }

  return data?.[0] || { messages_count: 0, conversations_count: 0, cycles_count: 0 };
}

async function fetchStoreRowIds(supabase: any, table: string, storeId: string, batchSize = CLEANUP_BATCH_SIZE) {
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("store_id", storeId)
    .limit(batchSize);

  if (error) {
    throw new Error(`Failed to fetch ${table} rows: ${error.message}`);
  }

  return (data || []).map((row: { id: string }) => row.id);
}

async function clearQuotedMessageReferences(supabase: any, storeId: string, batchSize = CLEANUP_BATCH_SIZE) {
  let detachedCount = 0;

  while (true) {
    const ids = await fetchStoreRowIds(
      supabase,
      "whatsapp_chat_messages",
      storeId,
      batchSize,
    );

    if (!ids.length) {
      break;
    }

    const { data: quotedRows, error: quotedRowsError } = await supabase
      .from("whatsapp_chat_messages")
      .select("id")
      .eq("store_id", storeId)
      .not("quoted_message_id", "is", null)
      .limit(batchSize);

    if (quotedRowsError) {
      throw new Error("Failed to fetch quoted messages: " + quotedRowsError.message);
    }

    const quotedIds = (quotedRows || []).map((row: { id: string }) => row.id);

    if (!quotedIds.length) {
      break;
    }

    const { error } = await supabase
      .from("whatsapp_chat_messages")
      .update({ quoted_message_id: null })
      .in("id", quotedIds);

    if (error) {
      throw new Error("Failed to detach quoted messages: " + error.message);
    }

    detachedCount += quotedIds.length;

    if (quotedIds.length < batchSize) {
      break;
    }
  }

  return detachedCount;
}

async function deleteStoreRowsInBatches(supabase: any, table: string, storeId: string, batchSize = CLEANUP_BATCH_SIZE) {
  let deletedCount = 0;

  while (true) {
    const ids = await fetchStoreRowIds(supabase, table, storeId, batchSize);

    if (!ids.length) {
      break;
    }

    const { error } = await supabase
      .from(table)
      .delete()
      .in("id", ids);

    if (error) {
      throw new Error(`Failed to delete ${table}: ${error.message}`);
    }

    deletedCount += ids.length;

    if (ids.length < batchSize) {
      break;
    }
  }

  return deletedCount;
}

async function cleanupStoreWhatsAppData(supabase: any, storeId: string) {
  await clearQuotedMessageReferences(supabase, storeId);

  // Arquivos da loja no bucket (inclui os que já ficaram órfãos de limpezas antigas).
  const storeFiles = await listChatMediaObjects(supabase, { prefix: `${storeId}/` });
  const deletedFiles = await removeChatMediaFiles(supabase, storeFiles.map((f) => f.name));
  const freedBytes = storeFiles.reduce((sum, f) => sum + Number(f.size || 0), 0);

  const deletedCycles = await deleteStoreRowsInBatches(
    supabase,
    "whatsapp_conversation_cycles",
    storeId,
  );
  const deletedMessages = await deleteStoreRowsInBatches(
    supabase,
    "whatsapp_chat_messages",
    storeId,
  );
  const deletedConversations = await deleteStoreRowsInBatches(
    supabase,
    "whatsapp_conversations",
    storeId,
  );

  return {
    deleted_cycles: deletedCycles,
    deleted_messages: deletedMessages,
    deleted_conversations: deletedConversations,
    deleted_files: deletedFiles,
    freed_bytes: freedBytes,
  };
}

async function handleMediaDiagnose(supabase: any) {
  const { data: settings } = await supabase.from("whatsapp_cleanup_settings").select("retention_days").limit(1).maybeSingle();
  const days = Number(settings?.retention_days || 30);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.rpc("chat_media_summary", { p_before: cutoff });
  if (error) return errorResponse("Failed: " + error.message, 500);
  const rows = (data || []) as Array<{ folder: string; files: number; bytes: number; old_files: number; old_bytes: number }>;
  const total = rows.reduce((acc, r) => ({
    files: acc.files + Number(r.files), bytes: acc.bytes + Number(r.bytes),
    old_files: acc.old_files + Number(r.old_files), old_bytes: acc.old_bytes + Number(r.old_bytes),
  }), { files: 0, bytes: 0, old_files: 0, old_bytes: 0 });
  return jsonResponse({ success: true, retention_days: days, cutoff, folders: rows, total });
}

async function handleMediaRetentionAction(supabase: any, userId: string | null, executionType: string) {
  const { data: settings } = await supabase.from("whatsapp_cleanup_settings").select("retention_days").limit(1).maybeSingle();
  const days = Number(settings?.retention_days || 30);
  let result;
  try {
    result = await runMediaRetention(supabase, days);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[media-retention] failed:", e);
    return errorResponse("Media retention failed: " + message, 500);
  }
  await logMediaRetention(supabase, result, executionType, userId);
  return jsonResponse({ success: true, retention_days: days, ...result });
}

async function logMediaRetention(supabase: any, result: any, executionType: string, userId: string | null) {
  if (!result.deleted_master_messages && !result.deleted_files) return;
  await supabase.from("whatsapp_cleanup_log").insert({
    store_id: null,
    store_name: "Mídia e WhatsApp master (retenção)",
    deleted_messages: Number(result.deleted_master_messages),
    deleted_conversations: 0,
    deleted_cycles: 0,
    total_deleted: Number(result.deleted_master_messages),
    deleted_files: Number(result.deleted_files),
    freed_bytes: Number(result.freed_bytes),
    execution_type: executionType,
    executed_by: userId,
  });
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
  const before = await countStoreWhatsAppData(supabase, storeId);

  let deleted;
  try {
    deleted = await cleanupStoreWhatsAppData(supabase, storeId);
  } catch (cleanupError) {
    const message = cleanupError instanceof Error ? cleanupError.message : "Unknown cleanup error";
    console.error(`[cleanup] failed for store ${storeId}:`, cleanupError);
    return errorResponse("Cleanup failed: " + message, 500);
  }

  const totalDeleted = Number(deleted.deleted_messages) + Number(deleted.deleted_conversations) + Number(deleted.deleted_cycles);

  const { data: storeData } = await supabase.from("stores").select("name").eq("id", storeId).single();

  await supabase.from("whatsapp_cleanup_log").insert({
    store_id: storeId,
    store_name: storeData?.name || "Desconhecida",
    deleted_messages: Number(deleted.deleted_messages),
    deleted_conversations: Number(deleted.deleted_conversations),
    deleted_cycles: Number(deleted.deleted_cycles),
    total_deleted: totalDeleted,
    deleted_files: Number(deleted.deleted_files || 0),
    freed_bytes: Number(deleted.freed_bytes || 0),
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
    const c = await countStoreWhatsAppData(supabase, store.store_id);
    if (Number(c.messages_count) === 0 && Number(c.conversations_count) === 0 && Number(c.cycles_count) === 0) continue;

    let d;
    try {
      d = await cleanupStoreWhatsAppData(supabase, store.store_id);
    } catch (cleanupError) {
      console.error(`[cleanup-all] failed for store ${store.store_id}:`, cleanupError);
      continue;
    }

    const total = Number(d.deleted_messages) + Number(d.deleted_conversations) + Number(d.deleted_cycles);
    grandTotal += total;

    await supabase.from("whatsapp_cleanup_log").insert({
      store_id: store.store_id,
      store_name: store.store_name,
      deleted_messages: Number(d.deleted_messages),
      deleted_conversations: Number(d.deleted_conversations),
      deleted_cycles: Number(d.deleted_cycles),
      total_deleted: total,
      deleted_files: Number(d.deleted_files || 0),
      freed_bytes: Number(d.freed_bytes || 0),
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
    const c = await countStoreWhatsAppData(supabase, store.store_id);
    if (Number(c.messages_count) === 0 && Number(c.conversations_count) === 0 && Number(c.cycles_count) === 0) continue;

    let d;
    try {
      d = await cleanupStoreWhatsAppData(supabase, store.store_id);
    } catch (cleanupError) {
      console.error(`[auto-cleanup] failed for store ${store.store_id}:`, cleanupError);
      continue;
    }

    const total = Number(d.deleted_messages) + Number(d.deleted_conversations) + Number(d.deleted_cycles);
    grandTotal += total;

    await supabase.from("whatsapp_cleanup_log").insert({
      store_id: store.store_id,
      store_name: store.store_name,
      deleted_messages: Number(d.deleted_messages),
      deleted_conversations: Number(d.deleted_conversations),
      deleted_cycles: Number(d.deleted_cycles),
      total_deleted: total,
      deleted_files: Number(d.deleted_files || 0),
      freed_bytes: Number(d.freed_bytes || 0),
      execution_type: "auto",
      executed_by: null,
    });

    results.push({ store_id: store.store_id, store_name: store.store_name, total });
  }

  // Retenção de mídia + mensagens do master (mesmo prazo).
  let media: any = null;
  try {
    media = await runMediaRetention(supabase, Number(settings.retention_days || 30));
    await logMediaRetention(supabase, media, "auto", null);
  } catch (mediaError) {
    console.error("[Auto-cleanup] media retention failed:", mediaError);
  }

  const nextRun = new Date();
  nextRun.setDate(nextRun.getDate() + 1); // roda todo dia (cron diário)

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
    media,
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
