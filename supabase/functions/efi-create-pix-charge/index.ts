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
  store_id?: string; // Opcional: se informado, usa Split Payment
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

// Limpar documento (CPF/CNPJ)
function cleanDocument(doc: string): string {
  return doc.replace(/\D/g, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { valor, descricao, expiracao_segundos, store_id }: CreateChargeRequest = await req.json();

    // Formatar valor para ter exatamente 2 casas decimais (exigido pela API EFI)
    const valorFormatado = parseFloat(valor).toFixed(2);

    console.log('💰 Iniciando criação de cobrança PIX...');
    console.log(`💵 Valor: R$ ${valorFormatado}`);
    console.log(`📝 Descrição: ${descricao}`);
    console.log(`⏱️ Expiração: ${expiracao_segundos}s`);
    console.log(`🏪 Store ID: ${store_id || 'N/A (sem split)'}`);

    // Buscar configuração ativa do master admin
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

    // 2. Preparar payload da cobrança
    const txid = generateTxId();
    console.log(`📋 TXID: ${txid}`);

    const cobPayload: any = {
      calendario: {
        expiracao: expiracao_segundos || 3600
      },
      valor: {
        original: valorFormatado
      },
      chave: pixKey,
      solicitacaoPagador: descricao
    };

    let useSplitEndpoint = false;
    let splitConfig: any = null;

    // 3. Se tiver store_id, configurar Split Payment
    if (store_id) {
      console.log('🔀 Configurando Split Payment...');
      
      // Buscar dados da loja
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('efi_account_number, online_payment_commission, owner_id, name, responsible_cpf')
        .eq('id', store_id)
        .single();

      if (storeError || !store) {
        console.error('❌ Loja não encontrada:', storeError);
        httpClient.close();
        return new Response(
          JSON.stringify({ success: false, error: 'Loja não encontrada' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      if (!store.efi_account_number) {
        console.error('❌ Loja não tem conta EFI vinculada');
        httpClient.close();
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Loja não possui conta EFI vinculada. Configure o pagamento online primeiro.' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Buscar CPF do responsável
      const document = store.responsible_cpf;
      
      if (!document) {
        httpClient.close();
        return new Response(
          JSON.stringify({ success: false, error: 'CPF do responsável não cadastrado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Calcular comissão (padrão 7% se não configurado)
      const commissionPercent = store.online_payment_commission ?? 7;
      // Valor líquido para o lojista = 100% - comissão Mostralo - taxa EFI (1.19%)
      const merchantPercent = 100 - commissionPercent - 1.19;

      console.log(`💼 Comissão Mostralo: ${commissionPercent}%`);
      console.log(`🏪 Valor líquido lojista: ${merchantPercent.toFixed(2)}%`);
      console.log(`🏦 Conta EFI lojista: ${store.efi_account_number}`);

      // Configurar split - usar endpoint separado /v2/gn/split/cob
      const favorecido: any = {
        conta: store.efi_account_number
      };

      // Adicionar CPF ou CNPJ
      const cleanDoc = cleanDocument(document);
      if (cleanDoc.length === 11) {
        favorecido.cpf = cleanDoc;
      } else {
        favorecido.cnpj = cleanDoc;
      }

      useSplitEndpoint = true;
      splitConfig = {
        divisaoTarifa: "assumir_total",
        minhaParte: {
          tipo: "porcentagem",
          valor: commissionPercent.toFixed(2)
        },
        repasses: [{
          tipo: "porcentagem",
          valor: merchantPercent.toFixed(2),
          favorecido: favorecido
        }]
      };

      console.log('✅ Split configurado:', JSON.stringify(splitConfig, null, 2));
    }

    // 4. Criar cobrança - usar endpoint diferente para split
    console.log('📤 Criando cobrança...');
    
    let cobResponse;
    let cobEndpoint;
    let cobData;
    let splitApplied = false;
    
    if (useSplitEndpoint && splitConfig) {
      // Tentar endpoint de split primeiro: /v2/gn/split/cob/:txid
      cobEndpoint = `${baseUrl}/v2/gn/split/cob/${txid}`;
      console.log(`🔗 Tentando endpoint split: ${cobEndpoint}`);
      
      const splitPayload = {
        ...cobPayload,
        split: splitConfig
      };
      
      cobResponse = await fetch(cobEndpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(splitPayload),
        client: httpClient,
      });

      cobData = await cobResponse.json();
      console.log('📥 Resposta split:', JSON.stringify(cobData, null, 2));
      
      // Se split não estiver habilitado (404), fallback para cobrança normal
      if (!cobResponse.ok && (cobData.nome === 'nao_encontrado' || cobResponse.status === 404)) {
        console.log('⚠️ Split não habilitado na conta EFI. Usando cobrança normal...');
        
        // Gerar novo txid para evitar conflito
        const newTxid = generateTxId();
        cobEndpoint = `${baseUrl}/v2/cob/${newTxid}`;
        console.log(`🔗 Fallback para endpoint padrão: ${cobEndpoint}`);
        
        cobResponse = await fetch(cobEndpoint, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cobPayload),
          client: httpClient,
        });
        
        cobData = await cobResponse.json();
        console.log('📥 Resposta cob (fallback):', JSON.stringify(cobData, null, 2));
      } else if (cobResponse.ok) {
        splitApplied = true;
        console.log('✅ Split aplicado com sucesso!');
      }
    } else {
      // Endpoint padrão para cobrança sem split
      cobEndpoint = `${baseUrl}/v2/cob/${txid}`;
      console.log(`🔗 Usando endpoint padrão: ${cobEndpoint}`);
      
      cobResponse = await fetch(cobEndpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cobPayload),
        client: httpClient,
      });
      
      cobData = await cobResponse.json();
      console.log('📥 Resposta cob:', JSON.stringify(cobData, null, 2));
    }

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

    // 5. Buscar QR Code
    const location = cobData.loc?.id || cobData.location;
    console.log(`🔗 Location ID: ${location}`);

    let qrCodeData: any = null;
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
        console.log('🖼️ qrCodeData:', JSON.stringify(qrCodeData, null, 2));
        console.log('✅ QR Code gerado!');
      } else {
        const qrErrText = await qrResponse.text().catch(() => '');
        console.log('⚠️ Erro ao buscar QR Code, usando pixCopiaECola', qrErrText);
      }
    }

    const pixCopiaECola = cobData.pixCopiaECola || qrCodeData?.qrcode || null;
    const qrCodeBase64 = qrCodeData?.imagemQrcode
      ? (String(qrCodeData.imagemQrcode).trim().startsWith('data:')
        ? String(qrCodeData.imagemQrcode).trim()
        : `data:image/png;base64,${String(qrCodeData.imagemQrcode).trim()}`)
      : null;

    httpClient.close();

    console.log('🎉 Cobrança criada com sucesso!');

    return new Response(
      JSON.stringify({
        success: true,
        txid: cobData.txid,
        status: cobData.status,
        valor: cobData.valor?.original,
        expiracao: cobData.calendario?.expiracao,
        pixCopiaECola,
        qrCodeBase64,
        location: cobData.loc,
        ambiente: environment,
        criadoEm: cobData.calendario?.criacao,
        hasSplit: !!store_id,
        splitApplied: splitApplied,
        splitWarning: store_id && !splitApplied 
          ? 'Split não aplicado. A funcionalidade pode não estar habilitada na conta EFI.'
          : null,
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
