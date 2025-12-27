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

    // Criar cliente Supabase com service_role key (Admin API)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Criar cliente regular para verificar o usuário que está fazendo a requisição
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    );

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

    // Verificar se o usuário é master_admin
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .maybeSingle();

    console.log('🔍 Profile check:', { 
      hasProfile: !!profile, 
      userType: profile?.user_type,
      error: profileError?.message 
    });

    // Verificar também via user_roles
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    console.log('🔍 Role check:', { role: roleData?.role });

    const isMasterAdmin = 
      profile?.user_type === "master_admin" || 
      roleData?.role === "master_admin";

    if (!isMasterAdmin) {
      console.error('❌ Not master admin:', { 
        userType: profile?.user_type, 
        role: roleData?.role 
      });
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
    const { userId, newPassword } = await req.json();

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

    // Verificar se o usuário target existe
    const { data: targetUser, error: targetUserError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (targetUserError || !targetUser) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Resetar a senha usando Admin API
    const { data: updateData, error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

    if (updateError) {
      console.error("Error updating user password:", updateError);
      return new Response(
        JSON.stringify({ error: updateError.message || "Failed to update password" }),
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
          target_email: targetUser.user.email,
          reset_by: user.email,
          timestamp: new Date().toISOString(),
        },
      });

    if (auditError) {
      console.error("Error logging to audit:", auditError);
      // Não falhar a operação se o log falhar
    }

    // Limpar recovery token se existir
    await supabaseAdmin
      .from("auth.users")
      .update({ recovery_sent_at: null })
      .eq("id", userId);

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

