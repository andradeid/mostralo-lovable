import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth validation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Validate user via claims
    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Service role client for DB operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is master admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (!profile || profile.role !== "master") {
      return new Response(JSON.stringify({ error: "Forbidden - Master admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, store_id } = body;

    if (action === "diagnose") {
      return await handleDiagnose(supabase);
    } else if (action === "cleanup" && store_id) {
      return await handleCleanup(supabase, store_id, userId);
    } else if (action === "cleanup-all") {
      return await handleCleanupAll(supabase, userId);
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use: diagnose, cleanup, cleanup-all" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleDiagnose(supabase: any) {
  // Get stores without chat module
  const { data: stores, error: storesError } = await supabase.rpc(
    "get_stores_without_chat_module"
  );

  if (storesError) {
    console.error("Error getting stores:", storesError);
    return new Response(
      JSON.stringify({ error: "Failed to get stores: " + storesError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Count orphan data for each store
  const report = [];
  let totalMessages = 0;
  let totalConversations = 0;
  let totalCycles = 0;

  for (const store of stores || []) {
    const { data: counts, error: countError } = await supabase.rpc(
      "count_orphan_whatsapp_data",
      { p_store_id: store.store_id }
    );

    if (countError) {
      console.error(`Error counting for store ${store.store_id}:`, countError);
      continue;
    }

    const row = counts?.[0] || { messages_count: 0, conversations_count: 0, cycles_count: 0 };
    
    // Only include stores with data
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

  return new Response(
    JSON.stringify({
      success: true,
      report,
      summary: {
        total_stores: report.length,
        total_messages: totalMessages,
        total_conversations: totalConversations,
        total_cycles: totalCycles,
        total_records: totalMessages + totalConversations + totalCycles,
      },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleCleanup(supabase: any, storeId: string, userId: string) {
  // Count before cleanup
  const { data: beforeCounts } = await supabase.rpc("count_orphan_whatsapp_data", {
    p_store_id: storeId,
  });
  const before = beforeCounts?.[0] || { messages_count: 0, conversations_count: 0, cycles_count: 0 };

  // Execute cleanup
  const { data: result, error: cleanupError } = await supabase.rpc(
    "cleanup_orphan_whatsapp_data",
    { p_store_id: storeId, p_batch_size: 1000 }
  );

  if (cleanupError) {
    return new Response(
      JSON.stringify({ error: "Cleanup failed: " + cleanupError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const deleted = result?.[0] || { deleted_cycles: 0, deleted_messages: 0, deleted_conversations: 0 };

  // Log audit
  await supabase.from("admin_audit_log").insert({
    admin_id: userId,
    action: "whatsapp_orphan_cleanup",
    target_user_id: userId,
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

  return new Response(
    JSON.stringify({
      success: true,
      store_id: storeId,
      deleted: {
        messages: Number(deleted.deleted_messages),
        conversations: Number(deleted.deleted_conversations),
        cycles: Number(deleted.deleted_cycles),
        total: Number(deleted.deleted_messages) + Number(deleted.deleted_conversations) + Number(deleted.deleted_cycles),
      },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleCleanupAll(supabase: any, userId: string) {
  // Get stores to clean
  const { data: stores, error } = await supabase.rpc("get_stores_without_chat_module");
  if (error) {
    return new Response(
      JSON.stringify({ error: "Failed: " + error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const results = [];
  let grandTotal = 0;

  for (const store of stores || []) {
    // Check if store has data
    const { data: counts } = await supabase.rpc("count_orphan_whatsapp_data", {
      p_store_id: store.store_id,
    });
    const c = counts?.[0] || { messages_count: 0, conversations_count: 0, cycles_count: 0 };
    if (Number(c.messages_count) === 0 && Number(c.conversations_count) === 0 && Number(c.cycles_count) === 0) {
      continue;
    }

    const { data: result, error: cleanupError } = await supabase.rpc(
      "cleanup_orphan_whatsapp_data",
      { p_store_id: store.store_id, p_batch_size: 1000 }
    );

    if (cleanupError) {
      console.error(`Cleanup error for ${store.store_id}:`, cleanupError);
      continue;
    }

    const d = result?.[0] || { deleted_cycles: 0, deleted_messages: 0, deleted_conversations: 0 };
    const total = Number(d.deleted_messages) + Number(d.deleted_conversations) + Number(d.deleted_cycles);
    grandTotal += total;

    results.push({
      store_id: store.store_id,
      store_name: store.store_name,
      deleted_messages: Number(d.deleted_messages),
      deleted_conversations: Number(d.deleted_conversations),
      deleted_cycles: Number(d.deleted_cycles),
      total,
    });
  }

  // Log audit
  await supabase.from("admin_audit_log").insert({
    admin_id: userId,
    action: "whatsapp_orphan_cleanup_all",
    target_user_id: userId,
    details: {
      stores_cleaned: results.length,
      total_records_deleted: grandTotal,
      breakdown: results,
    },
  });

  return new Response(
    JSON.stringify({
      success: true,
      stores_cleaned: results.length,
      total_records_deleted: grandTotal,
      results,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
