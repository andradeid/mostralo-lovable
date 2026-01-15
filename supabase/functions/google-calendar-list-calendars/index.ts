import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1?target=deno";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

async function refreshAccessToken(
  supabase: any,
  tokens: { refresh_token: string; professional_id: string },
  oauthConfig: { client_id: string; client_secret: string }
): Promise<string | null> {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: oauthConfig.client_id,
      client_secret: oauthConfig.client_secret,
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token"
    })
  });

  if (!tokenResponse.ok) {
    console.error("Token refresh failed:", await tokenResponse.text());
    return null;
  }

  const newTokens = await tokenResponse.json();
  
  // Update tokens in database
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + (newTokens.expires_in || 3600));
  
  await supabase
    .from("google_calendar_tokens")
    .update({
      access_token: newTokens.access_token,
      token_expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("professional_id", tokens.professional_id);

  return newTokens.access_token;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("📅 google-calendar-list-calendars: Request received");
    
    // Create admin client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("❌ No authorization header");
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate token using an anon client with the caller's Authorization header
    // NOTE: supabase-js@2.49.x on Deno may not support getUser(token) reliably.
    console.log("🔐 Validating token (anon client)...");

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    
    if (authError || !user) {
      console.log("❌ Invalid token:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    console.log("✅ User authenticated:", userId.substring(0, 8) + "...");

    // Get professional_id from request
    const { professional_id } = await req.json();
    
    console.log("📋 Professional ID received:", professional_id);
    
    if (!professional_id) {
      console.log("❌ No professional_id provided");
      return new Response(
        JSON.stringify({ error: "professional_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user has access to this professional
    // Check user_roles table for role and store_id
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role, store_id")
      .eq("user_id", userId);

    console.log("👤 User roles found:", userRoles?.length || 0, userRoles);

    // Get professional to verify access
    const { data: professional } = await supabase
      .from("professionals")
      .select("store_id")
      .eq("id", professional_id)
      .single();

    if (!professional) {
      console.log("❌ Professional not found");
      return new Response(
        JSON.stringify({ error: "Profissional não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Professional found, store_id:", professional.store_id);

    // Check access - master_admin or store_admin of the same store
    const isMasterAdmin = userRoles?.some(r => r.role === "master_admin");
    const isStoreAdmin = userRoles?.some(r => 
      (r.role === "store_admin" || r.role === "professional") && 
      r.store_id === professional.store_id
    );
    const hasAccess = isMasterAdmin || isStoreAdmin;

    console.log("🔐 Access check:", { isMasterAdmin, isStoreAdmin, hasAccess });

    if (!hasAccess) {
      console.log("❌ Access denied");
      return new Response(
        JSON.stringify({ error: "Sem permissão" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Access granted");

    // Get tokens for this professional
    console.log("🔑 Fetching tokens for professional:", professional_id);
    const { data: tokens, error: tokensError } = await supabase
      .from("google_calendar_tokens")
      .select("access_token, refresh_token, token_expires_at")
      .eq("professional_id", professional_id)
      .eq("is_active", true)
      .single();

    if (tokensError || !tokens) {
      console.log("❌ No tokens found for professional:", tokensError?.message);
      return new Response(
        JSON.stringify({ error: "Google Calendar não conectado para este profissional" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Tokens found, expires at:", tokens.token_expires_at);

    // Get OAuth config for token refresh
    const { data: oauthConfig } = await supabase
      .from("google_oauth_config")
      .select("client_id, client_secret")
      .single();

    if (!oauthConfig) {
      console.log("❌ No OAuth config found");
      return new Response(
        JSON.stringify({ error: "Configuração OAuth não encontrada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ OAuth config found");

    // Check if token is expired and refresh if needed
    let accessToken = tokens.access_token;
    const tokenExpiry = new Date(tokens.token_expires_at);
    const now = new Date();
    
    console.log("🕐 Token expiry check:", { 
      tokenExpiry: tokenExpiry.toISOString(), 
      now: now.toISOString(),
      isExpired: tokenExpiry <= now 
    });
    
    if (tokenExpiry <= now) {
      console.log("🔄 Token expired, refreshing...");
      const newToken = await refreshAccessToken(supabase, {
        refresh_token: tokens.refresh_token,
        professional_id
      }, oauthConfig);
      
      if (!newToken) {
        console.log("❌ Token refresh failed");
        return new Response(
          JSON.stringify({ error: "Falha ao renovar token. Reconecte o Google Calendar." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      accessToken = newToken;
      console.log("✅ Token refreshed successfully");
    }

    // Fetch calendars from Google
    console.log("🌐 Fetching calendars from Google API...");
    const calendarsResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!calendarsResponse.ok) {
      const errorText = await calendarsResponse.text();
      console.error("❌ Failed to fetch calendars:", calendarsResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Falha ao buscar calendários do Google" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const calendarsData = await calendarsResponse.json();
    console.log("✅ Calendars received:", calendarsData.items?.length || 0, "items");
    
    // Format calendars for response
    const calendars = (calendarsData.items || []).map((cal: any) => ({
      id: cal.id,
      summary: cal.summary,
      description: cal.description,
      primary: cal.primary || false,
      backgroundColor: cal.backgroundColor,
      accessRole: cal.accessRole
    }));

    console.log("📋 Returning", calendars.length, "formatted calendars");

    return new Response(
      JSON.stringify({ calendars }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in google-calendar-list-calendars:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
