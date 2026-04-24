import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const start = performance.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify master_admin via auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
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

    // Check master_admin role via service client
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "master_admin")
      .limit(1)
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: master_admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === ALL QUERIES (lightweight pg_stat_* views) ===

    // 1. Connections from pg_stat_activity
    const { data: connData } = await adminClient.rpc("get_system_health_connections");

    // 2. Database stats from pg_stat_database
    const { data: dbStats } = await adminClient.rpc("get_system_health_db_stats");

    // 3. Realtime subscriptions count
    const { count: realtimeCount } = await adminClient
      .from("store_modules")
      .select("*", { count: "exact", head: true })
      .limit(0);
    // We can't query realtime.subscription directly via client, so we use a RPC
    const { data: realtimeData } = await adminClient.rpc("get_system_health_realtime");

    // 4. Modules by store
    const { data: modulesData } = await adminClient.rpc("get_system_health_modules");

    // 5. Top accessed tables
    const { data: topTables } = await adminClient.rpc("get_system_health_top_tables");

    // 6. Slow queries and index warnings (best-effort; may be unavailable)
    const [{ data: slowQueries }, { data: indexAlerts }] = await Promise.all([
      adminClient.rpc("get_system_health_slow_queries"),
      adminClient.rpc("get_system_health_index_alerts"),
    ]);

    const elapsed = Math.round(performance.now() - start);

    return new Response(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        queryTimeMs: elapsed,
        connections: connData ?? { total: 0, active: 0, idle: 0, max: 120, byState: [] },
        database: dbStats ?? { cacheHitRatio: 0, txCommit: 0, txRollback: 0, tupReturned: 0, tupFetched: 0, tupInserted: 0, tupUpdated: 0, tupDeleted: 0 },
        realtime: realtimeData ?? { activeSubscriptions: 0 },
        modules: modulesData ?? [],
        topTables: topTables ?? [],
        slowQueries: slowQueries ?? [],
        indexAlerts: indexAlerts ?? [],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("system-health-check error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err), timestamp: new Date().toISOString() }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
