import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FixUserLoginRequest {
  email: string;
  newPassword?: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed. Use POST." }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Obter token do header
    const authHeader = req.headers.get("Authorization");
    console.log("🔐 Auth header presente:", !!authHeader);
    
    if (!authHeader) {
      console.error("❌ Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Criar cliente para verificar autenticação
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verificar autenticação
    const {
      data: { user: currentUser },
      error: authError,
    } = await supabaseClient.auth.getUser();

    console.log("🔐 User auth check:", {
      hasUser: !!currentUser,
      userId: currentUser?.id?.substring(0, 8) + "***",
      error: authError?.message,
    });

    if (authError) {
      console.error("❌ Auth error:", authError.message);
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: authError.message,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!currentUser) {
      console.error("❌ No user found");
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: "User not found in token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verificar se o usuário é master_admin
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("user_type")
      .eq("id", currentUser.id)
      .maybeSingle();

    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUser.id)
      .limit(1)
      .maybeSingle();

    const isMasterAdmin =
      profile?.user_type === "master_admin" ||
      roleData?.role === "master_admin";

    console.log("🔍 Master admin check:", {
      userType: profile?.user_type,
      role: roleData?.role,
      isMasterAdmin: isMasterAdmin,
    });

    if (!isMasterAdmin) {
      console.error("❌ Forbidden: User is not master_admin");
      return new Response(
        JSON.stringify({
          error: "Forbidden: Only master admins can fix user login",
          userType: profile?.user_type,
          userRole: roleData?.role,
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Master admin verified");

    // Criar cliente admin
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Obter dados da requisição
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      console.error("❌ Erro ao parsear JSON:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { email, newPassword }: FixUserLoginRequest = requestBody;
    console.log("📥 Request body:", {
      email: email?.substring(0, 5) + "***",
      hasPassword: !!newPassword,
    });

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("🔍 Buscando usuário:", email);

    // Buscar usuário pelo email
    const { data: users, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error("❌ Erro ao listar usuários:", listError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar usuário" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const targetUser = users.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!targetUser) {
      return new Response(
        JSON.stringify({
          error: "Usuário não encontrado",
          email: email,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Usuário encontrado:", {
      id: targetUser.id.substring(0, 8) + "***",
      email: targetUser.email,
      emailConfirmed: targetUser.email_confirmed_at ? true : false,
      createdAt: targetUser.created_at,
    });

    // Verificar perfil
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", targetUser.id)
      .maybeSingle();

    console.log("📋 Perfil:", {
      exists: !!userProfile,
      userType: userProfile?.user_type,
      fullName: userProfile?.full_name,
      error: profileError?.message,
    });

    // Verificar roles
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("*")
      .eq("user_id", targetUser.id);

    console.log("👤 Roles:", {
      count: userRoles?.length || 0,
      roles: userRoles?.map((r) => r.role),
      error: rolesError?.message,
    });

    const fixes: string[] = [];
    const updates: any = {};

    // 1. Confirmar email se não estiver confirmado
    if (!targetUser.email_confirmed_at) {
      updates.email_confirm = true;
      fixes.push("Email confirmado");
    }

    // 2. Resetar senha se fornecida
    if (newPassword) {
      if (newPassword.length < 6) {
        return new Response(
          JSON.stringify({ error: "Senha deve ter no mínimo 6 caracteres" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      updates.password = newPassword;
      fixes.push("Senha resetada");
    }

    // Aplicar correções
    if (Object.keys(updates).length > 0) {
      console.log("🔧 Aplicando correções:", updates);

      const { data: updatedUser, error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(targetUser.id, updates);

      if (updateError) {
        console.error("❌ Erro ao atualizar usuário:", updateError);
        return new Response(
          JSON.stringify({
            error: "Erro ao atualizar usuário",
            details: updateError.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log("✅ Usuário atualizado com sucesso");
    }

    // Resposta final
    return new Response(
      JSON.stringify({
        success: true,
        message: fixes.length > 0
          ? `Correções aplicadas: ${fixes.join(", ")}`
          : "Usuário verificado - nenhuma correção necessária",
        user: {
          id: targetUser.id,
          email: targetUser.email,
          emailConfirmed: updates.email_confirm
            ? true
            : !!targetUser.email_confirmed_at,
          passwordReset: !!updates.password,
          bannedRemoved: !!updates.ban_duration,
          profile: userProfile
            ? {
                fullName: userProfile.full_name,
                userType: userProfile.user_type,
              }
            : null,
          roles: userRoles?.map((r) => r.role) || [],
        },
        fixes: fixes,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ Erro inesperado:", error);
    return new Response(
      JSON.stringify({
        error: "Erro inesperado",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

