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

// Convert base64 certificate to PEM format
function base64ToPem(base64Cert: string, base64Key?: string): string {
  let pem = "";
  
  // Certificate
  const certPem = `-----BEGIN CERTIFICATE-----\n${base64Cert.match(/.{1,64}/g)?.join('\n')}\n-----END CERTIFICATE-----`;
  pem += certPem;
  
  // Private key (if provided)
  if (base64Key) {
    const keyPem = `\n-----BEGIN PRIVATE KEY-----\n${base64Key.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`;
    pem += keyPem;
  }
  
  return pem;
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

    // Parse webhook payload
    const payload = await req.json();
    console.log("📥 Webhook EFI recebido:", JSON.stringify(payload, null, 2));

    // Estrutura esperada do webhook EFI para conta simplificada
    // {
    //   "evento": "conta-simplificada",
    //   "identificador": "uuid-da-conta",
    //   "status": "aprovada" | "recusada" | "autorizada"
    // }
    
    const { evento, identificador, status } = payload;

    if (evento !== 'conta-simplificada') {
      console.log("⚠️ Evento não suportado:", evento);
      return new Response(
        JSON.stringify({ received: true, processed: false, reason: "unsupported_event" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!identificador) {
      console.error("❌ Identificador não fornecido no webhook");
      return new Response(
        JSON.stringify({ error: "Missing identificador" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar loja pelo identificador EFI
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, name, efi_account_status")
      .eq("efi_account_id", identificador)
      .single();

    if (storeError || !store) {
      console.error("❌ Loja não encontrada para identificador:", identificador);
      return new Response(
        JSON.stringify({ error: "Store not found for identifier" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📋 Processando webhook para loja: ${store.name} (${store.id})`);
    console.log(`📋 Status recebido: ${status}`);

    // Processar baseado no status
    if (status === 'recusada') {
      // Conta foi recusada pelo lojista ou pela EFI
      console.log("❌ Conta EFI recusada");
      
      await supabase
        .from("stores")
        .update({
          efi_account_status: 'rejected',
        })
        .eq("id", store.id);

      return new Response(
        JSON.stringify({ received: true, processed: true, status: 'rejected' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (status === 'autorizada' || status === 'aprovada') {
      // Conta foi autorizada pelo lojista - buscar credenciais
      console.log("✅ Conta EFI autorizada! Buscando credenciais...");

      // Buscar configuração EFI do master admin para fazer requisições
      const { data: efiConfig, error: configError } = await supabase
        .from("subscription_payment_config")
        .select("*")
        .eq("is_active", true)
        .single();

      if (configError || !efiConfig || !efiConfig.certificate_pem) {
        console.error("❌ Configuração EFI não encontrada");
        return new Response(
          JSON.stringify({ error: "EFI config not found" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Configurar cliente mTLS
      const isProduction = efiConfig.environment === 'production';
      const clientId = isProduction ? efiConfig.client_id_production : efiConfig.client_id_sandbox;
      const clientSecret = isProduction ? efiConfig.client_secret_production : efiConfig.client_secret_sandbox;
      const baseUrl = isProduction 
        ? "https://apis.gerencianet.com.br" 
        : "https://apis-h.gerencianet.com.br";

      const { certificate, privateKey } = parsePemContent(efiConfig.certificate_pem);
      const httpClient = Deno.createHttpClient({
        cert: certificate,
        key: privateKey,
        http2: false,
      });

      // Obter token OAuth2
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
          scope: "gn.registration.read"
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("❌ Erro ao obter token:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to get OAuth token" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // === Buscar credenciais da conta simplificada ===
      console.log("🔑 Buscando credenciais da conta...");
      const credentialsResponse = await fetch(
        `${baseUrl}/v1/conta-simplificada/${identificador}/credenciais`,
        {
          method: "GET",
          client: httpClient,
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        }
      );

      if (!credentialsResponse.ok) {
        const errorText = await credentialsResponse.text();
        console.error("❌ Erro ao buscar credenciais:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to fetch credentials" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const credentialsData = await credentialsResponse.json();
      const storeClientId = credentialsData.clientId;
      const storeClientSecret = credentialsData.clientSecret;

      console.log("✅ Credenciais obtidas com sucesso");

      // === Buscar certificado da conta simplificada ===
      console.log("📜 Buscando certificado da conta...");
      const certResponse = await fetch(
        `${baseUrl}/v1/conta-simplificada/${identificador}/certificado`,
        {
          method: "POST",
          client: httpClient,
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      if (!certResponse.ok) {
        const errorText = await certResponse.text();
        console.error("❌ Erro ao buscar certificado:", errorText);
        // Continuar mesmo sem certificado - algumas contas podem não precisar
      }

      let storeCertificatePem = null;
      if (certResponse.ok) {
        const certData = await certResponse.json();
        // Certificado vem em base64, converter para PEM
        if (certData.certificado) {
          storeCertificatePem = base64ToPem(certData.certificado, certData.chavePrivada);
          console.log("✅ Certificado obtido e convertido");
        }
      }

      // === Salvar credenciais na loja ===
      console.log("💾 Salvando credenciais na loja...");
      const { error: updateError } = await supabase
        .from("stores")
        .update({
          efi_account_status: 'active',
          efi_client_id: storeClientId,
          efi_client_secret: storeClientSecret,
          efi_certificate_pem: storeCertificatePem,
        })
        .eq("id", store.id);

      if (updateError) {
        console.error("❌ Erro ao atualizar loja:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to save credentials" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Atualizar store_efi_data com timestamp de autorização
      await supabase
        .from("store_efi_data")
        .update({
          authorized_at: new Date().toISOString(),
        })
        .eq("store_id", store.id);

      console.log("✅ Conta EFI ativada com sucesso para loja:", store.name);

      return new Response(
        JSON.stringify({ 
          received: true, 
          processed: true, 
          status: 'active',
          message: "Store EFI account activated successfully"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Status desconhecido
    console.log("⚠️ Status desconhecido:", status);
    return new Response(
      JSON.stringify({ received: true, processed: false, reason: "unknown_status" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("❌ Erro no webhook:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
