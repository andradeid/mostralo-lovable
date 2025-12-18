import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Parse PEM certificate content
function parsePemContent(pemContent: string): { certificate: string; privateKey: string } {
  const cleanPem = pemContent.trim();

  // Extrair TODOS os certificados (cadeia completa), se houver
  const certMatches = cleanPem.match(
    /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g,
  );
  const certificate = certMatches ? certMatches.join('\n') : '';

  // Extrair chave privada (pode ser PRIVATE KEY ou RSA PRIVATE KEY)
  const keyMatch = cleanPem.match(
    /-----BEGIN (?:RSA |EC |ENCRYPTED )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |ENCRYPTED )?PRIVATE KEY-----/,
  );
  const privateKey = keyMatch ? keyMatch[0] : '';
  
  if (!certificate || !privateKey) {
    throw new Error("Invalid PEM content: missing certificate or private key");
  }

  return { certificate, privateKey };
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

    // Verificar autenticação
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

    // Verificar se é master admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single();

    if (profile?.user_type !== 'master_admin') {
      return new Response(
        JSON.stringify({ error: "Acesso negado. Apenas master admin pode configurar webhooks." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("🔧 Configurando webhook de abertura de contas EFI...");

    // Buscar configuração EFI
    const { data: efiConfig, error: configError } = await supabase
      .from("subscription_payment_config")
      .select("*")
      .eq("is_active", true)
      .single();

    if (configError || !efiConfig) {
      return new Response(
        JSON.stringify({ error: "Configuração EFI não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determinar ambiente e credenciais
    const isProduction = efiConfig.efi_environment === 'production';
    const certificatePem = isProduction ? efiConfig.efi_certificate_pem_production : efiConfig.efi_certificate_pem;
    const clientId = isProduction ? efiConfig.efi_client_id_production : efiConfig.efi_client_id;
    const clientSecret = isProduction ? efiConfig.efi_client_secret_production : efiConfig.efi_client_secret;
    
    // API de Abertura de Contas usa URLs diferentes da API PIX
    const baseUrl = isProduction 
      ? "https://abrircontas.api.efipay.com.br" 
      : "https://abrircontas-h.api.efipay.com.br";

    if (!certificatePem) {
      return new Response(
        JSON.stringify({ error: `Certificado EFI não configurado para ambiente ${isProduction ? 'produção' : 'sandbox'}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: `Credenciais EFI não configuradas para ambiente ${isProduction ? 'produção' : 'sandbox'}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse certificado
    const { certificate, privateKey } = parsePemContent(certificatePem);

    // Criar cliente HTTP com mTLS
    const httpClient = Deno.createHttpClient({
      cert: certificate,
      key: privateKey,
      http2: false,
    });

    // Obter token OAuth2 com escopo de webhook de registro
    console.log("🔐 Obtendo token OAuth2...");
    const credentials = btoa(`${clientId}:${clientSecret}`);
    const tokenResponse = await fetch(`${baseUrl}/v1/oauth/token`, {
      method: "POST",
      client: httpClient,
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        scope: "gn.registration.webhook.write gn.registration.webhook.read"
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("❌ Erro ao obter token:", errorText);
      return new Response(
        JSON.stringify({ 
          error: "Erro de autenticação com EFI",
          details: errorText
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    console.log("✅ Token obtido");

    // URL do webhook de contas
    const webhookUrl = `${supabaseUrl}/functions/v1/efi-account-webhook`;

    // Configurar webhook na EFI
    console.log("📡 Configurando webhook na EFI:", webhookUrl);
    const webhookResponse = await fetch(`${baseUrl}/v1/webhook`, {
      method: "POST",
      client: httpClient,
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        webhookUrl: webhookUrl,
      }),
    });

    const webhookResponseText = await webhookResponse.text();
    console.log("📥 Resposta EFI:", webhookResponse.status, webhookResponseText);

    if (!webhookResponse.ok) {
      return new Response(
        JSON.stringify({ 
          error: "Erro ao configurar webhook na EFI",
          details: webhookResponseText
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Salvar configuração do webhook no banco
    const { error: updateError } = await supabase
      .from("subscription_payment_config")
      .update({
        account_webhook_configured: true,
        account_webhook_url: webhookUrl,
        account_webhook_configured_at: new Date().toISOString(),
      })
      .eq("id", efiConfig.id);

    if (updateError) {
      console.error("⚠️ Erro ao salvar status do webhook:", updateError);
      // Não falhar pois o webhook foi configurado na EFI
    }

    console.log("✅ Webhook de contas configurado com sucesso!");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook de abertura de contas configurado com sucesso",
        webhook_url: webhookUrl,
        environment: isProduction ? 'production' : 'sandbox'
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
