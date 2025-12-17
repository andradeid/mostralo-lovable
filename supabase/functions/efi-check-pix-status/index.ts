import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Parse PEM content
function parsePemContent(pemContent: string): { certificate: string; privateKey: string } {
  const cleanPem = pemContent.trim();

  // Extrair TODOS os certificados (cadeia completa), se houver
  const certMatches = cleanPem.match(
    /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g,
  );
  const certificate = certMatches ? certMatches.join('\n') : '';

  // Extrair chave privada (pode ser PRIVATE KEY ou RSA PRIVATE KEY)
  const keyMatch = cleanPem.match(
    /-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA )?PRIVATE KEY-----/,
  );
  const privateKey = keyMatch ? keyMatch[0] : '';

  return { certificate, privateKey };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { txid } = await req.json();

    if (!txid) {
      throw new Error('txid é obrigatório');
    }

    console.log('🔍 Verificando status do PIX:', txid);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get EFI config
    const { data: config, error: configError } = await supabase
      .from('subscription_payment_config')
      .select('*')
      .single();

    if (configError || !config) {
      throw new Error('Configuração do gateway não encontrada');
    }

    // Selecionar credenciais corretas conforme ambiente (igual às outras funções EFI)
    const environment = config.efi_environment || 'sandbox';
    const isProd = environment === 'production';

    const clientId = isProd ? config.efi_client_id_production : config.efi_client_id;
    const clientSecret = isProd ? config.efi_client_secret_production : config.efi_client_secret;
    const certificatePem = isProd
      ? config.efi_certificate_pem_production
      : config.efi_certificate_pem;

    if (!clientId || !clientSecret || !certificatePem) {
      throw new Error('Credenciais EFI não configuradas');
    }

    console.log(`📡 Ambiente EFI: ${environment}`);

    const { certificate, privateKey } = parsePemContent(certificatePem);

    if (!certificate || !privateKey) {
      throw new Error('Certificado PEM inválido');
    }

    // URLs conforme ambiente
    const baseUrl = isProd
      ? 'https://pix.api.efipay.com.br'
      : 'https://pix-h.api.efipay.com.br';

    const authUrl = `${baseUrl}/oauth/token`;
    const pixUrl = `${baseUrl}/v2/cob/${txid}`;

    // Criar cliente mTLS (obrigatório para /oauth/token e rotas do PIX)
    let httpClient: Deno.HttpClient | null = null;

    try {
      httpClient = Deno.createHttpClient({
        cert: certificate,
        key: privateKey,
        http2: false,
      });

      // Authenticate with EFI
      const credentials = btoa(`${clientId}:${clientSecret}`);

      const authResponse = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ grant_type: 'client_credentials' }),
        client: httpClient,
      });

      if (!authResponse.ok) {
        const errorText = await authResponse.text();
        throw new Error(`Erro na autenticação EFI: ${errorText}`);
      }

      const authData = await authResponse.json();
      const accessToken = authData.access_token;

      // Get PIX charge status
      const pixResponse = await fetch(pixUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        client: httpClient,
      });

      if (!pixResponse.ok) {
        const errorText = await pixResponse.text();
        throw new Error(`Erro ao consultar PIX: ${errorText}`);
      }

      const pixData = await pixResponse.json();

      console.log('📊 Status do PIX:', pixData.status);
      console.log('📋 Dados completos:', JSON.stringify(pixData, null, 2));

      // Map EFI status to our system status
      let systemStatus = 'pending';
      if (pixData.status === 'CONCLUIDA') {
        systemStatus = 'paid';
      } else if (
        pixData.status === 'REMOVIDA_PELO_USUARIO_RECEBEDOR' ||
        pixData.status === 'REMOVIDA_PELO_PSP'
      ) {
        systemStatus = 'cancelled';
      } else if (pixData.status === 'ATIVA') {
        systemStatus = 'pending';
      }

      return new Response(
        JSON.stringify({
          success: true,
          txid: pixData.txid,
          status: pixData.status,
          systemStatus,
          valor: pixData.valor?.original,
          pix: pixData.pix || null, // Contains payment details when paid
          criacao: pixData.calendario?.criacao,
          expiracao: pixData.calendario?.expiracao,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      );
    } finally {
      httpClient?.close();
    }
  } catch (error: any) {
    console.error('❌ Erro ao verificar status:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro ao verificar status do PIX',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
