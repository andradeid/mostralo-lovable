import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get professional_id from request
    const { professional_id } = await req.json();
    
    if (!professional_id) {
      return new Response(
        JSON.stringify({ error: "professional_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user has access to this professional
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, store_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: "Perfil não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get professional to verify access
    const { data: professional } = await supabase
      .from("professionals")
      .select("store_id")
      .eq("id", professional_id)
      .single();

    if (!professional) {
      return new Response(
        JSON.stringify({ error: "Profissional não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check access
    const hasAccess = 
      profile.role === "master_admin" || 
      (["store_admin"].includes(profile.role) && profile.store_id === professional.store_id);

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: "Sem permissão" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get tokens for this professional
    const { data: tokens, error: tokensError } = await supabase
      .from("google_calendar_tokens")
      .select("access_token, refresh_token, token_expires_at")
      .eq("professional_id", professional_id)
      .eq("is_active", true)
      .single();

    if (tokensError || !tokens) {
      return new Response(
        JSON.stringify({ error: "Google Calendar não conectado para este profissional" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get OAuth config for token refresh
    const { data: oauthConfig } = await supabase
      .from("google_oauth_config")
      .select("client_id, client_secret")
      .single();

    if (!oauthConfig) {
      return new Response(
        JSON.stringify({ error: "Configuração OAuth não encontrada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token is expired and refresh if needed
    let accessToken = tokens.access_token;
    const tokenExpiry = new Date(tokens.token_expires_at);
    
    if (tokenExpiry <= new Date()) {
      console.log("Token expired, refreshing...");
      const newToken = await refreshAccessToken(supabase, {
        refresh_token: tokens.refresh_token,
        professional_id
      }, oauthConfig);
      
      if (!newToken) {
        return new Response(
          JSON.stringify({ error: "Falha ao renovar token. Reconecte o Google Calendar." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      accessToken = newToken;
    }

    // Fetch calendars from Google
    const calendarsResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!calendarsResponse.ok) {
      const errorText = await calendarsResponse.text();
      console.error("Failed to fetch calendars:", errorText);
      return new Response(
        JSON.stringify({ error: "Falha ao buscar calendários do Google" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const calendarsData = await calendarsResponse.json();
    
    // Format calendars for response
    const calendars = (calendarsData.items || []).map((cal: any) => ({
      id: cal.id,
      summary: cal.summary,
      description: cal.description,
      primary: cal.primary || false,
      backgroundColor: cal.backgroundColor,
      accessRole: cal.accessRole
    }));

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
