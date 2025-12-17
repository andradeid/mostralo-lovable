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

    // Validar formato do certificado
    if (!certificate_pem.includes('-----BEGIN CERTIFICATE-----') && 
        !certificate_pem.includes('-----BEGIN PRIVATE KEY-----')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Certificado inválido. O certificado deve estar no formato PEM.' 
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

    // Tentar autenticação OAuth2
    console.log('🔐 Tentando autenticação OAuth2...');
    
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials'
      }),
    });

    const authData = await authResponse.json();
    console.log('📄 Resposta de autenticação:', JSON.stringify(authData, null, 2));

    if (!authResponse.ok) {
      const errorMessage = authData.error_description || authData.error || 'Erro de autenticação';
      console.error('❌ Falha na autenticação:', errorMessage);
      
      // Atualizar status no banco
      await supabase
        .from('subscription_payment_config')
        .update({
          efi_last_test_at: new Date().toISOString(),
          efi_last_test_status: 'failed',
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

    // Testar endpoint de chaves PIX (opcional, apenas se tiver access_token)
    if (access_token && pix_key) {
      console.log('🔍 Verificando chave PIX...');
      const pixUrl = `${baseUrl}/v2/gn/pix/keys`;
      
      try {
        const pixResponse = await fetch(pixUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (pixResponse.ok) {
          console.log('✅ Acesso às chaves PIX confirmado!');
        } else {
          console.log('⚠️ Não foi possível listar chaves PIX, mas autenticação OK');
        }
      } catch (pixError) {
        console.log('⚠️ Erro ao verificar PIX, mas autenticação OK:', pixError);
      }
    }

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
