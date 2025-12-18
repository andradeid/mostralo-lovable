import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateAccountRequest {
  store_id: string;
  person_type: 'pf' | 'pj';
  // Dados PF
  cpf?: string;
  name?: string;
  birth_date?: string;
  mother_name?: string;
  phone?: string;
  email?: string;
  // Dados PJ
  cnpj?: string;
  company_name?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Autenticar usuário
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: CreateAccountRequest = await req.json();
    const { store_id, person_type } = body;

    console.log("📋 Criando conta EFI simplificada:", { store_id, person_type });

    // Verificar se usuário é dono da loja
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, owner_id, name, efi_account_status")
      .eq("id", store_id)
      .single();

    if (storeError || !store) {
      return new Response(
        JSON.stringify({ error: "Loja não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (store.owner_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Você não tem permissão para esta loja" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se já tem conta EFI
    if (store.efi_account_status === 'active') {
      return new Response(
        JSON.stringify({ error: "Esta loja já possui uma conta EFI ativa" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar configuração EFI do master admin
    const { data: efiConfig, error: configError } = await supabase
      .from("subscription_payment_config")
      .select("*")
      .eq("is_active", true)
      .single();

    if (configError || !efiConfig) {
      console.error("❌ Configuração EFI não encontrada:", configError);
      return new Response(
        JSON.stringify({ error: "Gateway de pagamento não configurado. Contate o suporte." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar dados obrigatórios
    if (person_type === 'pf') {
      if (!body.cpf || !body.name || !body.birth_date || !body.mother_name || !body.phone || !body.email) {
        return new Response(
          JSON.stringify({ error: "Dados incompletos para pessoa física" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (person_type === 'pj') {
      if (!body.cnpj || !body.company_name || !body.phone || !body.email) {
        return new Response(
          JSON.stringify({ error: "Dados incompletos para pessoa jurídica" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Salvar dados EFI na tabela store_efi_data
    const { error: efiDataError } = await supabase
      .from("store_efi_data")
      .upsert({
        store_id,
        person_type,
        birth_date: person_type === 'pf' ? body.birth_date : null,
        mother_name: person_type === 'pf' ? body.mother_name : null,
      }, { onConflict: 'store_id' });

    if (efiDataError) {
      console.error("❌ Erro ao salvar dados EFI:", efiDataError);
      return new Response(
        JSON.stringify({ error: "Erro ao salvar dados" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // TODO: Integrar com API EFI para criar conta simplificada
    // Por agora, apenas salvamos os dados e marcamos como pendente
    // A integração completa com EFI requer:
    // 1. Obter token de acesso da EFI
    // 2. POST /v1/conta-simplificada com dados do lojista
    // 3. Receber identificador e link de autorização
    // 4. Lojista acessa link via SMS/WhatsApp para autorizar
    // 5. Webhook recebe confirmação
    // 6. Salvar credenciais (client_id, client_secret)

    // Atualizar status da loja para pendente
    const { error: updateError } = await supabase
      .from("stores")
      .update({
        wants_online_payment: true,
        efi_account_status: 'pending_approval',
      })
      .eq("id", store_id);

    if (updateError) {
      console.error("❌ Erro ao atualizar loja:", updateError);
      return new Response(
        JSON.stringify({ error: "Erro ao atualizar status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Dados salvos, aguardando integração EFI");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Solicitação de conta registrada com sucesso",
        status: "pending_approval",
        next_steps: [
          "Seus dados foram registrados",
          "A conta EFI será criada automaticamente",
          "Você receberá um SMS/WhatsApp para autorizar",
          "Após autorização, pagamentos online serão habilitados"
        ]
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: unknown) {
    console.error("❌ Erro na função:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
