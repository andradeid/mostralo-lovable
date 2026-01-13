import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1?target=deno";

interface UpdatePasswordRequest {
  professional_id: string;
  new_password: string;
  store_id: string;
}

type SupabaseAdminError = {
  message: string;
  status?: number;
  code?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const isCorruptedAuthUserError = (error: SupabaseAdminError) =>
  error.message?.toLowerCase().includes("database error loading user") ||
  error.code === "unexpected_failure";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    console.log("Creating admin client...");

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const body: UpdatePasswordRequest = await req.json();

    console.log("Request received:", {
      professional_id: body.professional_id,
      store_id: body.store_id,
      password_length: body.new_password?.length || 0,
    });

    // Validações
    if (!body.professional_id) {
      return new Response(
        JSON.stringify({ success: false, error: "ID do profissional é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!body.new_password || body.new_password.length < 6) {
      return new Response(
        JSON.stringify({ success: false, error: "Nova senha deve ter pelo menos 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!body.store_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Store ID é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Buscar profissional e validar que pertence à loja
    console.log("Fetching professional...");
    const { data: professional, error: professionalError } = await supabaseAdmin
      .from("professionals")
      .select("id, user_id, name, store_id")
      .eq("id", body.professional_id)
      .eq("store_id", body.store_id)
      .single();

    if (professionalError || !professional) {
      console.error("Professional not found:", professionalError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Profissional não encontrado ou não pertence a esta loja",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("Professional found:", professional.name, "user_id:", professional.user_id);

    if (!professional.user_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Profissional não possui conta de acesso vinculada",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1) Tentar atualizar senha normalmente
    console.log("Updating password for user:", professional.user_id);

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      professional.user_id,
      { password: body.new_password },
    );

    if (!updateError) {
      console.log("Password updated successfully for:", professional.name);
      return new Response(
        JSON.stringify({ success: true, message: "Senha atualizada com sucesso" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.error("Error updating password:", updateError);

    // 2) Fallback: se o usuário do Auth estiver corrompido, tentar recriar o acesso
    //    (sem SQL no schema auth; usando apenas Admin API + tabelas públicas)
    if (isCorruptedAuthUserError(updateError as SupabaseAdminError)) {
      console.warn(
        "Detected corrupted auth user. Attempting recovery by recreating auth user and relinking professional...",
      );

      // Buscar email no profiles (porque professionals não tem email)
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("email, full_name, phone")
        .eq("id", professional.user_id)
        .single();

      if (profileError || !profile?.email) {
        console.error("Unable to recover: missing profile email", profileError);
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "Conta de acesso do profissional parece corrompida e não foi possível recuperar automaticamente (email não encontrado no perfil).",
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const email = profile.email.toLowerCase().trim();

      // Tentar remover usuário antigo para liberar o email
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(
        professional.user_id,
      );

      if (deleteAuthError) {
        console.error("Failed to delete corrupted auth user:", deleteAuthError);
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "Conta de acesso do profissional parece corrompida e não foi possível remover automaticamente. Abra um chamado para o suporte (erro ao deletar usuário no Auth).",
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Criar um novo usuário com o mesmo email e a nova senha
      const { data: newAuthUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser(
        {
          email,
          password: body.new_password,
          email_confirm: true,
          user_metadata: {
            full_name: profile.full_name || professional.name,
            user_type: "professional",
            store_id: body.store_id,
          },
        },
      );

      if (createAuthError || !newAuthUser?.user) {
        console.error("Failed to recreate auth user:", createAuthError);
        return new Response(
          JSON.stringify({
            success: false,
            error:
              createAuthError?.message ||
              "Falha ao recriar conta de acesso do profissional.",
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const newUserId = newAuthUser.user.id;
      console.log("New auth user created:", newUserId);

      // Relink no profissional
      const { error: relinkError } = await supabaseAdmin
        .from("professionals")
        .update({ user_id: newUserId })
        .eq("id", professional.id);

      if (relinkError) {
        console.error("Failed to relink professional.user_id:", relinkError);
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "Conta recriada, mas falhou ao vincular ao profissional. Contate o suporte.",
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Recriar profile com o novo id (evita conflito de PK)
      // Obs: removemos o perfil antigo (user_id antigo) pois agora não existe mais no Auth
      const { error: deleteProfileError } = await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", professional.user_id);

      if (deleteProfileError) {
        console.warn("Warning deleting old profile:", deleteProfileError);
      }

      const { error: createProfileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: newUserId,
          email,
          full_name: profile.full_name || professional.name,
          phone: profile.phone || null,
          user_type: "professional",
        });

      if (createProfileError) {
        console.warn("Warning creating new profile:", createProfileError);
      }

      // Recriar roles
      const { error: deleteRolesError } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", professional.user_id);

      if (deleteRolesError) {
        console.warn("Warning deleting old roles:", deleteRolesError);
      }

      const { error: createRoleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: newUserId, role: "professional", store_id: body.store_id });

      if (createRoleError) {
        console.warn("Warning creating professional role:", createRoleError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message:
            "Senha atualizada e conta de acesso do profissional foi recriada automaticamente (usuário antigo estava corrompido).",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Erro normal
    return new Response(
      JSON.stringify({
        success: false,
        error: `Erro ao atualizar senha: ${updateError.message}`,
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro interno do servidor",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
