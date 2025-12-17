import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para extrair certificado(s) e chave privada do PEM
function parsePemContent(pemContent: string): { cert: string; key: string; certsCount: number } {
  const cleanPem = pemContent.trim();

  // Extrair TODOS os certificados (cadeia completa), se houver
  const certMatches = cleanPem.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g);
  const cert = certMatches ? certMatches.join('\n') : '';
  const certsCount = certMatches?.length ?? 0;

  // Extrair chave privada (pode ser PRIVATE KEY ou RSA PRIVATE KEY)
  const keyMatch = cleanPem.match(/-----BEGIN (RSA )?PRIVATE KEY-----[\s\S]*?-----END (RSA )?PRIVATE KEY-----/);
  const key = keyMatch ? keyMatch[0] : '';

  return { cert, key, certsCount };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let httpClient: Deno.HttpClient | null = null;

  try {
    console.log('🔧 Configurando webhook EFI PIX...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch EFI configuration
    const { data: config, error: configError } = await supabase
      .from('subscription_payment_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      console.error('❌ Configuração não encontrada:', configError);
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração EFI não encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Determine environment and credentials
    const environment = config.efi_environment || 'sandbox';
    const isProduction = environment === 'production';
    
    const clientId = isProduction 
      ? config.efi_client_id_production 
      : config.efi_client_id;
    const clientSecret = isProduction 
      ? config.efi_client_secret_production 
      : config.efi_client_secret;
    const certificatePem = isProduction 
      ? config.efi_certificate_pem_production 
      : config.efi_certificate_pem;
    const pixKey = config.efi_pix_key;

    if (!clientId || !clientSecret || !certificatePem || !pixKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Credenciais EFI incompletas' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Parse PEM certificate
    const { cert, key, certsCount } = parsePemContent(certificatePem);
    console.log(`📄 Certificados encontrados: ${certsCount}`);

    if (!cert || !key) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Certificado inválido. O arquivo PEM deve conter tanto o CERTIFICATE quanto a PRIVATE KEY.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // API URLs
    const baseUrl = isProduction
      ? 'https://pix.api.efipay.com.br'
      : 'https://pix-h.api.efipay.com.br';

    console.log(`📡 Ambiente: ${environment}, URL: ${baseUrl}`);

    // Create mTLS HTTP client
    console.log('🔐 Configurando cliente mTLS...');
    try {
      httpClient = Deno.createHttpClient({
        cert: cert,
        key: key,
        http2: false,
      });
      console.log('✅ Cliente mTLS criado com sucesso!');
    } catch (clientError) {
      console.error('❌ Erro ao criar cliente mTLS:', clientError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Erro ao configurar certificado mTLS: ${clientError instanceof Error ? clientError.message : 'Erro desconhecido'}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      );
    }

    // Step 1: Get OAuth token with mTLS
    const authString = btoa(`${clientId}:${clientSecret}`);
    console.log('🔐 Obtendo token OAuth2...');
    
    let tokenResponse;
    try {
      tokenResponse = await fetch(`${baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
        }),
        client: httpClient,
      });
    } catch (fetchError) {
      console.error('❌ Erro na requisição de token:', fetchError);
      httpClient?.close();
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro de conexão mTLS: ${fetchError instanceof Error ? fetchError.message : 'Falha na conexão'}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Erro ao obter token:', errorText);
      httpClient?.close();
      return new Response(
        JSON.stringify({ success: false, error: 'Falha na autenticação EFI', details: errorText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    console.log('✅ Token obtido com sucesso');

    // Step 2: Configure webhook
    const webhookUrl = `${supabaseUrl}/functions/v1/efi-pix-webhook`;
    
    // EFI requires the webhook URL with a query param to skip mTLS
    const webhookUrlWithParam = `${webhookUrl}?ignorar=`;

    console.log(`🔗 Configurando webhook: ${webhookUrlWithParam}`);

    let webhookResponse;
    try {
      webhookResponse = await fetch(`${baseUrl}/v2/webhook/${pixKey}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'x-skip-mtls-checking': 'true', // Skip mTLS for Supabase Edge Functions
        },
        body: JSON.stringify({
          webhookUrl: webhookUrlWithParam,
        }),
        client: httpClient,
      });
    } catch (webhookError) {
      console.error('❌ Erro ao configurar webhook:', webhookError);
      httpClient?.close();
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro ao configurar webhook: ${webhookError instanceof Error ? webhookError.message : 'Falha na conexão'}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const webhookText = await webhookResponse.text();
    console.log(`📥 Resposta webhook (${webhookResponse.status}):`, webhookText);

    if (!webhookResponse.ok) {
      httpClient?.close();
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Falha ao configurar webhook', 
          details: webhookText,
          status: webhookResponse.status 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Step 3: Verify webhook configuration
    let verifyResponse;
    try {
      verifyResponse = await fetch(`${baseUrl}/v2/webhook/${pixKey}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        client: httpClient,
      });
    } catch (verifyError) {
      console.warn('⚠️ Erro ao verificar webhook:', verifyError);
    }

    let webhookConfigured = false;
    let configuredUrl = webhookUrlWithParam;

    if (verifyResponse?.ok) {
      const verifyData = await verifyResponse.json();
      configuredUrl = verifyData.webhookUrl || webhookUrlWithParam;
      webhookConfigured = configuredUrl.includes('efi-pix-webhook');
      console.log('✅ Webhook verificado:', configuredUrl);
    } else {
      // If verification failed but PUT succeeded, assume it worked
      webhookConfigured = true;
    }

    // Close HTTP client
    httpClient?.close();

    // Step 4: Save webhook status to database
    await supabase
      .from('subscription_payment_config')
      .update({
        efi_webhook_configured: webhookConfigured,
        efi_webhook_url: configuredUrl,
        efi_webhook_configured_at: new Date().toISOString(),
      })
      .eq('id', config.id);

    console.log('✅ Webhook configurado com sucesso!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook configurado com sucesso',
        webhookUrl: configuredUrl,
        environment,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Erro ao configurar webhook:', error);
    httpClient?.close();
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro ao configurar webhook',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
