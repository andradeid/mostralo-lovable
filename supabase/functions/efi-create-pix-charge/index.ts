import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateChargeRequest {
  valor: string;
  descricao: string;
  expiracao_segundos: number;
}

// Função para extrair certificado(s) e chave privada do PEM
function parsePemContent(pemContent: string): { cert: string; key: string } {
  const cleanPem = pemContent.trim();
  const certMatches = cleanPem.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g);
  const cert = certMatches ? certMatches.join('\n') : '';
  const keyMatch = cleanPem.match(/-----BEGIN (RSA )?PRIVATE KEY-----[\s\S]*?-----END (RSA )?PRIVATE KEY-----/);
  const key = keyMatch ? keyMatch[0] : '';
  return { cert, key };
}

// Gerar txid único (25-35 caracteres alfanuméricos)
function generateTxId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { valor, descricao, expiracao_segundos }: CreateChargeRequest = await req.json();

    console.log('💰 Iniciando criação de cobrança PIX...');
    console.log(`💵 Valor: R$ ${valor}`);
    console.log(`📝 Descrição: ${descricao}`);
    console.log(`⏱️ Expiração: ${expiracao_segundos}s`);

    // Buscar configuração ativa
    const { data: config, error: configError } = await supabase
      .from('subscription_payment_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração EFI não encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const environment = config.efi_environment || 'sandbox';
    const isProd = environment === 'production';

    // Selecionar credenciais do ambiente
    const clientId = isProd ? config.efi_client_id_production : config.efi_client_id;
    const clientSecret = isProd ? config.efi_client_secret_production : config.efi_client_secret;
    const certificatePem = isProd ? config.efi_certificate_pem_production : config.efi_certificate_pem;
    const pixKey = config.efi_pix_key;

    if (!clientId || !clientSecret || !certificatePem || !pixKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Credenciais incompletas para ambiente ${environment}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { cert, key } = parsePemContent(certificatePem);
    if (!cert || !key) {
      return new Response(
        JSON.stringify({ success: false, error: 'Certificado PEM inválido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const baseUrl = isProd 
      ? 'https://pix.api.efipay.com.br'
      : 'https://pix-h.api.efipay.com.br';

    // Criar cliente mTLS
    const httpClient = Deno.createHttpClient({
      cert: cert,
      key: key,
      http2: false,
    });

    // 1. Autenticar
    console.log('🔐 Autenticando...');
    const authResponse = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ grant_type: 'client_credentials' }),
      client: httpClient,
    });

    const authData = await authResponse.json();
    if (!authResponse.ok || !authData.access_token) {
      httpClient.close();
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Falha na autenticação: ${authData.error_description || authData.error || 'Erro desconhecido'}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const accessToken = authData.access_token;
    console.log('✅ Autenticado!');

    // 2. Criar cobrança imediata (cob)
    const txid = generateTxId();
    console.log(`📋 TXID: ${txid}`);

    const cobPayload = {
      calendario: {
        expiracao: expiracao_segundos
      },
      valor: {
        original: valor
      },
      chave: pixKey,
      solicitacaoPagador: descricao
    };

    console.log('📤 Criando cobrança...');
    const cobResponse = await fetch(`${baseUrl}/v2/cob/${txid}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cobPayload),
      client: httpClient,
    });

    const cobData = await cobResponse.json();
    console.log('📥 Resposta cob:', JSON.stringify(cobData, null, 2));

    if (!cobResponse.ok) {
      httpClient.close();
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: cobData.mensagem || cobData.detail || 'Erro ao criar cobrança',
          details: cobData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // 3. Buscar QR Code
    const location = cobData.loc?.id || cobData.location;
    console.log(`🔗 Location ID: ${location}`);

    let qrCodeData = null;
    if (location) {
      console.log('🎨 Buscando QR Code...');
      const qrResponse = await fetch(`${baseUrl}/v2/loc/${location}/qrcode`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        client: httpClient,
      });

      if (qrResponse.ok) {
        qrCodeData = await qrResponse.json();
        console.log('✅ QR Code gerado!');
      } else {
        console.log('⚠️ Erro ao buscar QR Code, usando pixCopiaECola');
      }
    }

    httpClient.close();

    console.log('🎉 Cobrança criada com sucesso!');

    return new Response(
      JSON.stringify({
        success: true,
        txid: cobData.txid,
        status: cobData.status,
        valor: cobData.valor?.original,
        expiracao: cobData.calendario?.expiracao,
        pixCopiaECola: qrCodeData?.qrcode || cobData.pixCopiaECola,
        qrCodeBase64: qrCodeData?.imagemQrcode,
        location: cobData.loc,
        ambiente: environment,
        criadoEm: cobData.calendario?.criacao,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
