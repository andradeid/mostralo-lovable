import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    // Parse request body for professional_id (store admin flow)
    let professionalId: string | null = null;
    let isStoreAdminFlow = false;
    
    if (req.method === "POST") {
      try {
        const body = await req.json();
        professionalId = body.professional_id || null;
      } catch {
        // No body or invalid JSON, continue with default flow
      }
    }

    // If professional_id is provided, this is store admin flow
    if (professionalId) {
      isStoreAdminFlow = true;
      
      // Buscar profissional primeiro para validar
      const { data: professional, error: profCheckError } = await supabase
        .from("professionals")
        .select("id, store_id")
        .eq("id", professionalId)
        .single();
      
      if (profCheckError || !professional) {
        return new Response(
          JSON.stringify({ error: "Profissional não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Verificar se usuário tem permissão para gerenciar este profissional
      // Pode ser: owner da loja, store_admin da loja, ou master_admin
      const { data: masterAdminRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .eq("role", "master_admin")
        .maybeSingle();
      
      const isMasterAdmin = !!masterAdminRole;
      
      // Verificar se é owner da loja
      const { data: store } = await supabase
        .from("stores")
        .select("owner_id")
        .eq("id", professional.store_id)
        .single();
      
      const isStoreOwner = store?.owner_id === user.id;
      
      // Verificar se é store_admin da loja
      const { data: storeAdminRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .eq("store_id", professional.store_id)
        .eq("role", "store_admin")
        .maybeSingle();
      
      const isStoreAdmin = !!storeAdminRole;
      
      if (!isMasterAdmin && !isStoreOwner && !isStoreAdmin) {
        return new Response(
          JSON.stringify({ error: "Sem permissão para gerenciar profissionais desta loja" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get Google OAuth config
      const { data: oauthConfig, error: configError } = await supabase
        .from("google_oauth_config")
        .select("client_id")
        .single();

      if (configError || !oauthConfig?.client_id) {
        return new Response(
          JSON.stringify({ error: "Configuração OAuth não encontrada. Entre em contato com o suporte." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Build the redirect URI - usar URL completa com /functions/v1/
      const redirectUri = "https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/google-calendar-callback";

      // State contains professional_id, store_id, user_id and flow type
      const state = JSON.stringify({
        professional_id: professionalId,
        store_id: professional.store_id,
        user_id: user.id,
        flow: "store_admin"
      });

      // Google OAuth URL with calendar scopes
      const scopes = [
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/userinfo.email"
      ].join(" ");

      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", oauthConfig.client_id);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", scopes);
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
      authUrl.searchParams.set("state", btoa(state));

      return new Response(
        JSON.stringify({ authUrl: authUrl.toString() }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Default flow: Professional connecting their own account
    const { data: professional, error: profError } = await supabase
      .from("professionals")
      .select("id, store_id")
      .eq("user_id", user.id)
      .single();

    if (profError || !professional) {
      return new Response(
        JSON.stringify({ error: "Profissional não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Google OAuth config
    const { data: oauthConfig, error: configError } = await supabase
      .from("google_oauth_config")
      .select("client_id")
      .single();

    if (configError || !oauthConfig?.client_id) {
      return new Response(
        JSON.stringify({ error: "Configuração OAuth não encontrada. Entre em contato com o suporte." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the redirect URI - usar URL completa com /functions/v1/
    const redirectUri = "https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/google-calendar-callback";

    // State contains professional_id and store_id for the callback
    const state = JSON.stringify({
      professional_id: professional.id,
      store_id: professional.store_id,
      user_id: user.id,
      flow: "professional"
    });

    // Google OAuth URL with calendar scopes
    const scopes = [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/userinfo.email"
    ].join(" ");

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", oauthConfig.client_id);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", btoa(state));

    return new Response(
      JSON.stringify({ authUrl: authUrl.toString() }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error in google-calendar-auth:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
