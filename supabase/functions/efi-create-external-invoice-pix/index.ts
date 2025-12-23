import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateExternalInvoicePixRequest {
  invoice_id: string;
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

    const { invoice_id, valor, descricao, expiracao_segundos }: CreateExternalInvoicePixRequest = await req.json();

    if (!invoice_id || !valor) {
      return new Response(
        JSON.stringify({ success: false, error: 'invoice_id e valor são obrigatórios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Formatar valor para ter exatamente 2 casas decimais
    const valorFormatado = parseFloat(valor).toFixed(2);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('💰 CRIANDO PIX PARA FATURA EXTERNA');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📄 Invoice ID: ${invoice_id}`);
    console.log(`💵 Valor: R$ ${valorFormatado}`);
    console.log(`📝 Descrição: ${descricao}`);
    console.log(`⏱️ Expiração: ${expiracao_segundos}s`);

    // Buscar configuração ativa do payment gateway
    const { data: config, error: configError } = await supabase
      .from('subscription_payment_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      console.error('❌ Configuração EFI não encontrada:', configError);
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração de pagamento não encontrada' }),
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

    console.log(`🌐 Ambiente: ${environment} (${baseUrl})`);

    // Criar cliente mTLS
    const httpClient = Deno.createHttpClient({
      cert: cert,
      key: key,
      http2: false,
    });

    // ETAPA 1: AUTENTICAÇÃO
    console.log('\n🔐 [ETAPA 1/3] Autenticando na API EFI...');
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
      console.error('❌ Falha na autenticação:', authData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Falha na autenticação: ${authData.error_description || authData.error || 'Erro desconhecido'}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const accessToken = authData.access_token;
    console.log('✅ Autenticado com sucesso!');

    // ETAPA 2: CRIAR COBRANÇA PIX
    const txid = generateTxId();
    console.log(`📋 TXID gerado: ${txid}`);
    console.log('\n📤 [ETAPA 2/3] Criando cobrança PIX...');
    
    const cobPayload = {
      calendario: {
        expiracao: expiracao_segundos || 300
      },
      valor: {
        original: valorFormatado
      },
      chave: pixKey,
      solicitacaoPagador: descricao?.substring(0, 140) || 'Pagamento de fatura'
    };

    console.log('📦 Payload cobrança:', JSON.stringify(cobPayload, null, 2));

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
    console.log('📥 Resposta cobrança:', JSON.stringify(cobData, null, 2));

    if (!cobResponse.ok) {
      httpClient.close();
      console.error('❌ Erro ao criar cobrança:', cobData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: cobData.mensagem || cobData.detail || 'Erro ao criar cobrança',
          details: cobData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('✅ Cobrança criada com sucesso!');

    // ETAPA 3: BUSCAR QR CODE
    const location = cobData.loc?.id || cobData.location;
    console.log(`\n🎨 [ETAPA 3/3] Buscando QR Code... (Location ID: ${location})`);

    let qrCodeData: any = null;
    if (location) {
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
        const qrErrText = await qrResponse.text().catch(() => '');
        console.log('⚠️ Erro ao buscar QR Code:', qrErrText);
      }
    }

    const pixCopiaECola = cobData.pixCopiaECola || qrCodeData?.qrcode || null;
    const qrCodeBase64 = qrCodeData?.imagemQrcode
      ? (String(qrCodeData.imagemQrcode).trim().startsWith('data:')
        ? String(qrCodeData.imagemQrcode).trim()
        : `data:image/png;base64,${String(qrCodeData.imagemQrcode).trim()}`)
      : null;

    httpClient.close();

    // Calcular data de expiração
    const expiresAt = new Date(Date.now() + (expiracao_segundos || 300) * 1000).toISOString();

    // Salvar dados do PIX na fatura
    console.log(`\n💾 Salvando dados do PIX na fatura ${invoice_id}...`);
    const { error: updateError } = await supabase
      .from('external_invoices')
      .update({
        pix_txid: cobData.txid,
        pix_copia_cola: pixCopiaECola,
        pix_qrcode_base64: qrCodeBase64,
        pix_expires_at: expiresAt,
      })
      .eq('id', invoice_id);

    if (updateError) {
      console.error('⚠️ Erro ao salvar PIX na fatura:', updateError);
    } else {
      console.log('✅ Dados do PIX salvos na fatura!');
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ PIX PARA FATURA EXTERNA CRIADO COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════════');

    return new Response(
      JSON.stringify({
        success: true,
        txid: cobData.txid,
        pixCopiaECola,
        qrCodeBase64,
        expiracao: expiracao_segundos || 300,
        expiresAt,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
