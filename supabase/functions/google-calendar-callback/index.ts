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
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateBase64 = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    // Get frontend URL from referer or use default
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://mostralo.lovable.app";

    // Decode state first to determine flow type
    let state: { 
      professional_id: string; 
      store_id: string; 
      user_id: string;
      flow?: "store_admin" | "professional";
    };
    
    if (stateBase64) {
      try {
        state = JSON.parse(atob(stateBase64));
      } catch {
        return Response.redirect(
          `${frontendUrl}/profissional/google-calendar?error=invalid_state`,
          302
        );
      }
    } else {
      return Response.redirect(
        `${frontendUrl}/profissional/google-calendar?error=missing_params`,
        302
      );
    }

    const isStoreAdminFlow = state.flow === "store_admin";
    const redirectBase = isStoreAdminFlow 
      ? `${frontendUrl}/dashboard/booking/professionals`
      : `${frontendUrl}/profissional/google-calendar`;

    if (error) {
      console.error("Google OAuth error:", error);
      return Response.redirect(
        `${redirectBase}?error=google_denied`,
        302
      );
    }

    if (!code) {
      return Response.redirect(
        `${redirectBase}?error=missing_params`,
        302
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Google OAuth config (with secret)
    const { data: oauthConfig, error: configError } = await supabase
      .from("google_oauth_config")
      .select("client_id, client_secret")
      .single();

    if (configError || !oauthConfig?.client_id || !oauthConfig?.client_secret) {
      console.error("OAuth config error:", configError);
      return Response.redirect(
        `${redirectBase}?error=config_missing`,
        302
      );
    }

    // Exchange code for tokens - usar URL completa com /functions/v1/
    const redirectUri = "https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/google-calendar-callback";

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: oauthConfig.client_id,
        client_secret: oauthConfig.client_secret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error("Token exchange failed:", errorBody);
      return Response.redirect(
        `${redirectBase}?error=token_exchange`,
        302
      );
    }

    const tokens = await tokenResponse.json();
    
    if (!tokens.access_token || !tokens.refresh_token) {
      console.error("Missing tokens in response:", tokens);
      return Response.redirect(
        `${redirectBase}?error=missing_tokens`,
        302
      );
    }

    // Get user email from Google
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );

    let googleEmail = null;
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json();
      googleEmail = userInfo.email;
    }

    // Calculate token expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expires_in || 3600));

    // Upsert tokens in database
    const { error: upsertError } = await supabase
      .from("google_calendar_tokens")
      .upsert({
        professional_id: state.professional_id,
        store_id: state.store_id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        google_email: googleEmail,
        is_active: true,
        sync_enabled: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "professional_id"
      });

    if (upsertError) {
      console.error("Failed to save tokens:", upsertError);
      return Response.redirect(
        `${redirectBase}?error=save_failed`,
        302
      );
    }

    // Success! Redirect back appropriately
    const successUrl = isStoreAdminFlow 
      ? `${redirectBase}?google_success=true&professional_id=${state.professional_id}`
      : `${redirectBase}?success=true`;
      
    return Response.redirect(successUrl, 302);

  } catch (error) {
    console.error("Error in google-calendar-callback:", error);
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://mostralo.lovable.app";
    return Response.redirect(
      `${frontendUrl}/profissional/google-calendar?error=internal`,
      302
    );
  }
});
