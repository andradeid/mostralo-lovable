import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { getStoreAdminUser } from "../_shared/storeAdmin.ts";

// Convite por link para o profissional criar a própria senha.
// action "create"  (dono/admin da loja): gera o link para um profissional sem acesso.
// action "resolve" (público): mostra loja, nome e e-mail do convite.
// action "accept"  (público): cria o acesso com a senha escolhida e vincula ao profissional.

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Erros de negócio voltam com 200 + success:false para o app mostrar a mensagem (o invoke descarta o corpo em 4xx)
const respond = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status: body.success === false && status < 500 ? 200 : status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const newToken = () => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "create") {
      const professionalId = String(body.professional_id || "");
      const email = String(body.email || "").trim().toLowerCase();
      if (!professionalId || !emailOk(email)) return respond({ success: false, error: "Informe um e-mail válido." }, 400);

      const { data: prof } = await admin
        .from("professionals")
        .select("id, store_id, name, user_id")
        .eq("id", professionalId)
        .maybeSingle();
      if (!prof) return respond({ success: false, error: "Profissional não encontrado." }, 404);

      const caller = await getStoreAdminUser(req, prof.store_id);
      if (!caller) return respond({ success: false, error: "Sem permissão para esta loja." }, 403);
      if (prof.user_id) return respond({ success: false, error: "Este profissional já tem acesso." }, 400);

      // Um convite válido por vez: os anteriores deixam de valer
      await admin.from("professional_invites").update({ used_at: new Date().toISOString() })
        .eq("professional_id", prof.id).is("used_at", null);

      const token = newToken();
      const { error } = await admin.from("professional_invites").insert({
        professional_id: prof.id, store_id: prof.store_id, email, token, created_by: caller.id,
      });
      if (error) return respond({ success: false, error: "Erro ao gerar o convite." }, 500);

      const origin = req.headers.get("origin") || "https://mostralo.com.br";
      return respond({ success: true, token, invite_url: `${origin}/convite-profissional/${token}` });
    }

    // resolve / accept: pelo token
    const token = String(body.token || "");
    if (!/^[0-9a-f]{48}$/.test(token)) return respond({ success: false, error: "Link inválido." }, 400);

    const { data: inv } = await admin
      .from("professional_invites")
      .select("id, professional_id, store_id, email, expires_at, used_at")
      .eq("token", token)
      .maybeSingle();
    if (!inv) return respond({ success: false, error: "Link inválido." }, 404);
    if (inv.used_at) return respond({ success: false, error: "Este convite já foi usado. Entre com seu e-mail e senha." , used: true }, 410);
    if (new Date(inv.expires_at) < new Date()) return respond({ success: false, error: "Este convite expirou. Peça um novo ao responsável." }, 410);

    const [{ data: prof }, { data: store }] = await Promise.all([
      admin.from("professionals").select("id, name, user_id, phone").eq("id", inv.professional_id).maybeSingle(),
      admin.from("stores").select("name, logo_url").eq("id", inv.store_id).maybeSingle(),
    ]);
    if (!prof) return respond({ success: false, error: "Profissional não encontrado." }, 404);

    if (action === "resolve") {
      return respond({
        success: true,
        professional_name: prof.name,
        store_name: store?.name || "",
        store_logo: store?.logo_url || null,
        email: inv.email,
        already_has_access: !!prof.user_id,
      });
    }

    if (action === "accept") {
      const password = String(body.password || "");
      if (password.length < 6) return respond({ success: false, error: "A senha precisa ter pelo menos 6 caracteres." }, 400);
      if (prof.user_id) return respond({ success: false, error: "Este profissional já tem acesso. Entre com seu e-mail e senha." }, 400);

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: inv.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: prof.name, role_type: "professional", user_type: "professional", store_id: inv.store_id },
      });
      if (createError || !created?.user) {
        const msg = (createError?.message || "").toLowerCase();
        const already = msg.includes("already") || msg.includes("registered") || msg.includes("exists");
        return respond({
          success: false,
          error: already
            ? "Este e-mail já tem uma conta no Mostralo. Peça ao responsável um convite com outro e-mail."
            : "Não foi possível criar o acesso.",
        }, already ? 409 : 500);
      }
      const userId = created.user.id;

      const { error: linkError } = await admin.from("professionals").update({ user_id: userId }).eq("id", prof.id).is("user_id", null);
      if (linkError) {
        await admin.auth.admin.deleteUser(userId);
        return respond({ success: false, error: "Não foi possível vincular o acesso." }, 500);
      }
      await admin.from("user_roles").insert({ user_id: userId, role: "professional", store_id: inv.store_id });
      await admin.from("profiles").update({
        full_name: prof.name, phone: prof.phone || null, user_type: "professional", approval_status: "approved",
      }).eq("id", userId);
      await admin.from("professional_invites").update({ used_at: new Date().toISOString() }).eq("id", inv.id);

      return respond({ success: true, email: inv.email });
    }

    return respond({ success: false, error: "Ação inválida." }, 400);
  } catch (error) {
    console.error("[professional-invite]", error);
    return respond({ success: false, error: "Erro interno." }, 500);
  }
});
