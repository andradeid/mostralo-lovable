import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestConnectionRequest {
  client_id: string;
  client_secret: string;
  certificate_pem: string;
  pix_key: string;
  environment: 'sandbox' | 'production';
}

// Função para extrair certificado e chave privada do PEM
function parsePemContent(pemContent: string): { cert: string; key: string } {
  // Limpar o conteúdo
  const cleanPem = pemContent.trim();
  
  // Extrair certificado
  const certMatch = cleanPem.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/);
  const cert = certMatch ? certMatch[0] : '';
  
  // Extrair chave privada (pode ser PRIVATE KEY ou RSA PRIVATE KEY)
  const keyMatch = cleanPem.match(/-----BEGIN (RSA )?PRIVATE KEY-----[\s\S]*?-----END (RSA )?PRIVATE KEY-----/);
  const key = keyMatch ? keyMatch[0] : '';
  
  return { cert, key };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { client_id, client_secret, certificate_pem, pix_key, environment }: TestConnectionRequest = await req.json();

    console.log('🔄 Iniciando teste de conexão EFI...');
    console.log(`📍 Ambiente: ${environment}`);

    // Validar campos obrigatórios
    if (!client_id || !client_secret || !certificate_pem) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Credenciais incompletas. Preencha Client ID, Client Secret e Certificado.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Extrair certificado e chave privada do PEM
    const { cert, key } = parsePemContent(certificate_pem);
    
    console.log(`📄 Certificado extraído: ${cert ? 'OK' : 'NÃO ENCONTRADO'}`);
    console.log(`🔑 Chave privada extraída: ${key ? 'OK' : 'NÃO ENCONTRADA'}`);

    if (!cert || !key) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Certificado inválido. O arquivo PEM deve conter tanto o CERTIFICATE quanto a PRIVATE KEY.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // URLs da API EFI
    const baseUrl = environment === 'production' 
      ? 'https://pix.api.efipay.com.br'
      : 'https://pix-h.api.efipay.com.br';

    const authUrl = `${baseUrl}/oauth/token`;

    console.log(`🔗 URL de autenticação: ${authUrl}`);

    // Criar credenciais base64
    const credentials = btoa(`${client_id}:${client_secret}`);

    // Criar HTTP client com certificado mTLS
    console.log('🔐 Configurando cliente mTLS...');
    
    let httpClient;
    try {
      httpClient = Deno.createHttpClient({
        cert: cert,
        key: key,
      });
      console.log('✅ Cliente mTLS criado com sucesso!');
    } catch (clientError) {
      console.error('❌ Erro ao criar cliente mTLS:', clientError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro ao configurar certificado mTLS: ${clientError instanceof Error ? clientError.message : 'Erro desconhecido'}. Verifique se o certificado está no formato correto.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Tentar autenticação OAuth2 com mTLS
    console.log('🔐 Tentando autenticação OAuth2 com mTLS...');
    
    let authResponse;
    try {
      authResponse = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'client_credentials'
        }),
        client: httpClient,
      });
    } catch (fetchError) {
      console.error('❌ Erro na requisição mTLS:', fetchError);
      httpClient.close();
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro de conexão mTLS: ${fetchError instanceof Error ? fetchError.message : 'Falha na conexão'}. Verifique se o certificado corresponde às credenciais.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const authData = await authResponse.json();
    console.log('📄 Resposta de autenticação:', JSON.stringify(authData, null, 2));

    // Fechar o cliente HTTP
    httpClient.close();

    if (!authResponse.ok) {
      const errorMessage = authData.error_description || authData.error || 'Erro de autenticação';
      console.error('❌ Falha na autenticação:', errorMessage);
      
      // Atualizar status no banco
      await supabase
        .from('subscription_payment_config')
        .update({
          efi_last_test_at: new Date().toISOString(),
          efi_last_test_status: errorMessage,
          efi_is_configured: false
        })
        .eq('is_active', true);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Falha na autenticação: ${errorMessage}`,
          details: authData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { access_token } = authData;
    console.log('✅ Token de acesso obtido com sucesso!');

    // Atualizar status de sucesso no banco
    const { error: updateError } = await supabase
      .from('subscription_payment_config')
      .update({
        efi_last_test_at: new Date().toISOString(),
        efi_last_test_status: 'success',
        efi_is_configured: true
      })
      .eq('is_active', true);

    if (updateError) {
      console.error('⚠️ Erro ao atualizar status:', updateError);
    }

    console.log('🎉 Teste de conexão concluído com sucesso!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Conexão estabelecida com sucesso!',
        environment,
        token_type: authData.token_type,
        expires_in: authData.expires_in
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro no teste de conexão:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno ao testar conexão';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
