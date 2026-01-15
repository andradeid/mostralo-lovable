import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Edge Function: admin-reset-password
 * 
 * Permite que Master Admins resetem a senha de usuários diretamente
 * usando a Admin API do Supabase.
 * 
 * @requires Authorization header com JWT do master_admin
 * @param userId - ID do usuário que terá a senha resetada
 * @param newPassword - Nova senha para o usuário
 * 
 * @returns { success: boolean, message: string }
 */
serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      }
    });
  }

  try {
    // Verificar se é POST
    if (req.method !== "POST") {
      throw new Error("Method not allowed. Use POST.");
    }

    // Obter token do header
    const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
    console.log('🔐 Auth header presente:', !!authHeader);
    
    if (!authHeader) {
      console.error('❌ Missing authorization header');
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extrair token do header "Bearer <token>" (sem vazar o token nos logs)
    const token = (authHeader.split(' ')[1] ?? '').trim();
    console.log('🔐 Token parsed:', {
      hasToken: !!token,
      length: token.length,
      parts: token ? token.split('.').length : 0,
    });

    if (!token) {
      console.error('❌ Missing bearer token');
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: "Missing bearer token",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validar variáveis de ambiente necessárias (sem expor segredos)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    console.log("🔧 Env check:", {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceRoleKey: !!supabaseServiceRoleKey,
      serviceRoleKeyLength: supabaseServiceRoleKey.length,
    });

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      console.error("❌ Missing required env vars for Admin API");
      return new Response(
        JSON.stringify({
          error: "Server misconfiguration",
          details:
            "Missing SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY. Configure these secrets in Supabase Functions.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Criar cliente Supabase com service_role key (Admin API)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Criar cliente regular para verificar o usuário que está fazendo a requisição
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    // Verificar autenticação
    // IMPORTANTE: passar o token explicitamente para evitar AuthSessionMissingError
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    console.log('🔐 User auth check:', { 
      hasUser: !!user, 
      userId: user?.id?.substring(0, 8) + '***',
      userEmail: user?.email?.substring(0, 5) + '***',
      error: authError?.message,
      errorName: authError?.name
    });

    if (authError) {
      console.error('❌ Auth error detalhado:', {
        message: authError.message,
        name: authError.name,
        status: (authError as any).status
      });
      return new Response(
        JSON.stringify({ 
          error: "Unauthorized",
          details: authError.message || "Invalid token",
          errorName: authError.name
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!user) {
      console.error('❌ No user found');
      return new Response(
        JSON.stringify({ 
          error: "Unauthorized",
          details: "User not found in token"
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verificar se o usuário é master_admin (SOMENTE via user_roles)
    // ⚠️ CRÍTICO: não confiar em role no profile para evitar privilege escalation
    const { data: roleData, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "master_admin")
      .maybeSingle();

    console.log('🔍 Master admin role check:', {
      hasRole: !!roleData,
      error: roleError?.message,
    });

    if (roleError) {
      return new Response(
        JSON.stringify({
          error: "Erro ao verificar permissões",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!roleData) {
      console.error('❌ Not master admin (no user_roles):', { userId: user.id.substring(0, 8) + '***' });
      return new Response(
        JSON.stringify({ 
          error: "Forbidden: Only master admins can reset passwords" 
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('✅ Master admin verified');

    // Obter dados do body
    console.log('📋 Parsing request body...');
    const { userId, newPassword } = await req.json();
    console.log('📋 Request body parsed:', { hasUserId: !!userId, hasPassword: !!newPassword, passwordLength: newPassword?.length });

    // Validações
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!newPassword || typeof newPassword !== "string") {
      return new Response(
        JSON.stringify({ error: "newPassword is required and must be a string" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters long" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verificar se o usuário target existe (e capturar erro real quando a Admin API não está configurada)
    const { data: targetUserData, error: targetUserError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    console.log('🔎 Target user check:', {
      userId: userId.substring(0, 8) + '***',
      hasTargetUser: !!targetUserData?.user,
      error: targetUserError?.message,
      errorStatus: (targetUserError as any)?.status,
    });

    if (targetUserError) {
      console.error('❌ Failed to fetch target user:', targetUserError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch target user",
          details:
            targetUserError.message ||
            "Check if SUPABASE_SERVICE_ROLE_KEY is configured for this Edge Function.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!targetUserData?.user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('🔄 Updating password for target user...');

    // Resetar a senha usando Admin API
    const { data: updateData, error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

    if (updateError) {
      console.error("❌ Error updating user password:", updateError);
      return new Response(
        JSON.stringify({
          error: updateError.message || "Failed to update password",
          hint:
            "If this keeps failing, verify the Edge Function has SUPABASE_SERVICE_ROLE_KEY configured in Supabase Secrets.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Registrar ação no audit log
    const { error: auditError } = await supabaseAdmin
      .from("admin_audit_log")
      .insert({
        admin_id: user.id,
        action: "password_reset",
        target_user_id: userId,
        details: {
          target_email: targetUserData.user.email,
          reset_by: user.email,
          timestamp: new Date().toISOString(),
        },
      });

    if (auditError) {
      console.error("Error logging to audit:", auditError);
      // Não falhar a operação se o log falhar
    }

    console.log('✅ Password updated successfully for user:', userId.substring(0, 8) + '***');

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password reset successfully",
        user: {
          id: updateData.user.id,
          email: updateData.user.email,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in admin-reset-password function:", error);
    return new Response(
      JSON.stringify({ 
        error: (error as Error).message || "Internal server error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

