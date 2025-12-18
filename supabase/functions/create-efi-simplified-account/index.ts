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
  // Endereço (obtido da loja)
  cep?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  number?: string;
}

// Parse PEM certificate content
function parsePemContent(pemContent: string): { cert: string; key: string } {
  const certMatch = pemContent.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/);
  const keyMatch = pemContent.match(/-----BEGIN (RSA |EC |ENCRYPTED )?PRIVATE KEY-----[\s\S]*?-----END (RSA |EC |ENCRYPTED )?PRIVATE KEY-----/);
  
  if (!certMatch || !keyMatch) {
    throw new Error("Invalid PEM content: missing certificate or private key");
  }
  
  return {
    cert: certMatch[0],
    key: keyMatch[0]
  };
}

// Format date from YYYY-MM-DD to DD/MM/AAAA
function formatDateBR(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

// Format phone to only digits with country code
function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  // Add country code if not present
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
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
      .select("id, owner_id, name, efi_account_status, cep, state, city, neighborhood, street, number")
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

    // Verificar se já tem conta EFI ativa
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

    // Verificar se tem certificado configurado
    if (!efiConfig.certificate_pem) {
      console.error("❌ Certificado EFI não configurado");
      return new Response(
        JSON.stringify({ error: "Certificado de integração não configurado. Contate o suporte." }),
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
      if (!body.cnpj || !body.company_name || !body.cpf || !body.name || !body.phone || !body.email) {
        return new Response(
          JSON.stringify({ error: "Dados incompletos para pessoa jurídica" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Determinar ambiente e credenciais
    const isProduction = efiConfig.environment === 'production';
    const clientId = isProduction ? efiConfig.client_id_production : efiConfig.client_id_sandbox;
    const clientSecret = isProduction ? efiConfig.client_secret_production : efiConfig.client_secret_sandbox;
    const baseUrl = isProduction 
      ? "https://apis.gerencianet.com.br" 
      : "https://apis-h.gerencianet.com.br";

    if (!clientId || !clientSecret) {
      console.error("❌ Credenciais EFI não configuradas para o ambiente:", efiConfig.environment);
      return new Response(
        JSON.stringify({ error: "Credenciais de integração não configuradas. Contate o suporte." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse certificado
    let cert: string, key: string;
    try {
      const parsed = parsePemContent(efiConfig.certificate_pem);
      cert = parsed.cert;
      key = parsed.key;
    } catch (e) {
      console.error("❌ Erro ao parsear certificado:", e);
      return new Response(
        JSON.stringify({ error: "Certificado inválido. Contate o suporte." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente HTTP com mTLS
    const httpClient = Deno.createHttpClient({
      certChain: cert,
      privateKey: key,
    });

    // === PASSO 1: Obter token OAuth2 com escopo de registro ===
    console.log("🔐 Obtendo token OAuth2 com escopo gn.registration.write...");
    
    const credentials = btoa(`${clientId}:${clientSecret}`);
    const tokenResponse = await fetch(`${baseUrl}/oauth/token`, {
      method: "POST",
      client: httpClient,
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        scope: "gn.registration.write gn.registration.read"
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("❌ Erro ao obter token:", errorText);
      return new Response(
        JSON.stringify({ 
          error: "Erro de autenticação com gateway de pagamento",
          details: isProduction ? undefined : errorText
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    console.log("✅ Token OAuth2 obtido com sucesso");

    // === PASSO 2: Montar payload para conta simplificada ===
    // Usar endereço da loja ou do body
    const endereco = {
      cep: (body.cep || store.cep || "").replace(/\D/g, ''),
      estado: body.state || store.state || "",
      cidade: body.city || store.city || "",
      bairro: body.neighborhood || store.neighborhood || "",
      logradouro: body.street || store.street || "",
      numero: body.number || store.number || "S/N"
    };

    // Validar endereço
    if (!endereco.cep || !endereco.estado || !endereco.cidade || !endereco.logradouro) {
      return new Response(
        JSON.stringify({ error: "Endereço incompleto. Preencha os dados da loja primeiro." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Montar payload base
    const clienteFinal: Record<string, unknown> = {
      cpf: body.cpf!.replace(/\D/g, ''),
      nomeCompleto: body.name,
      dataNascimento: formatDateBR(body.birth_date!),
      nomeMae: body.mother_name,
      celular: formatPhone(body.phone!),
      email: body.email,
      endereco
    };

    // Adicionar dados PJ se aplicável
    if (person_type === 'pj') {
      clienteFinal.cnpj = body.cnpj!.replace(/\D/g, '');
      clienteFinal.razaoSocial = body.company_name;
    }

    const payload = {
      clienteFinal,
      meioDeNotificacao: ["whatsapp", "sms"],
      escoposIntegrados: [
        "cob.write", 
        "cob.read",
        "pix.write", 
        "pix.read", 
        "webhook.write", 
        "webhook.read",
        "gn.balance.read"
      ]
    };

    console.log("📤 Enviando requisição para criar conta simplificada...");
    console.log("Payload:", JSON.stringify(payload, null, 2));

    // === PASSO 3: Criar conta simplificada na EFI ===
    const createResponse = await fetch(`${baseUrl}/v1/conta-simplificada`, {
      method: "POST",
      client: httpClient,
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const createResponseText = await createResponse.text();
    console.log("📥 Resposta EFI:", createResponse.status, createResponseText);

    if (!createResponse.ok) {
      let errorMessage = "Erro ao criar conta no gateway de pagamento";
      try {
        const errorData = JSON.parse(createResponseText);
        if (errorData.mensagem) {
          errorMessage = errorData.mensagem;
        } else if (errorData.error_description) {
          errorMessage = errorData.error_description;
        }
      } catch {
        // Ignore parse error
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: isProduction ? undefined : createResponseText
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const createData = JSON.parse(createResponseText);
    const efiIdentifier = createData.identificador;

    console.log("✅ Conta simplificada criada! Identificador:", efiIdentifier);

    // === PASSO 4: Salvar dados no banco ===
    // Salvar dados EFI na tabela store_efi_data
    const { error: efiDataError } = await supabase
      .from("store_efi_data")
      .upsert({
        store_id,
        person_type,
        birth_date: person_type === 'pf' ? body.birth_date : null,
        mother_name: person_type === 'pf' ? body.mother_name : null,
        efi_identifier: efiIdentifier,
        authorization_link_sent_at: new Date().toISOString(),
      }, { onConflict: 'store_id' });

    if (efiDataError) {
      console.error("❌ Erro ao salvar dados EFI:", efiDataError);
      // Não retornar erro pois a conta já foi criada na EFI
    }

    // Atualizar status da loja para pendente de autorização
    const { error: updateError } = await supabase
      .from("stores")
      .update({
        wants_online_payment: true,
        efi_account_status: 'pending_authorization',
        efi_account_id: efiIdentifier,
      })
      .eq("id", store_id);

    if (updateError) {
      console.error("❌ Erro ao atualizar loja:", updateError);
    }

    console.log("✅ Processo de criação de conta finalizado com sucesso");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Conta EFI criada com sucesso!",
        identifier: efiIdentifier,
        status: "pending_authorization",
        next_steps: [
          "✅ Sua conta foi criada na EFI",
          "📱 Você receberá um SMS/WhatsApp com link de autorização",
          "🔐 Clique no link para autorizar a integração",
          "⏳ Após autorizar, seus dados serão sincronizados automaticamente",
          "💳 Quando aprovado, pagamentos PIX serão habilitados"
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
