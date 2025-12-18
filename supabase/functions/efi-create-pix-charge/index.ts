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

    console.log('═══════════════════════════════════════════════════════════');
    console.log('💰 INICIANDO CRIAÇÃO DE COBRANÇA PIX');
    console.log('═══════════════════════════════════════════════════════════');
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

    console.log(`🌐 Ambiente: ${environment} (${baseUrl})`);

    // Criar cliente mTLS
    const httpClient = Deno.createHttpClient({
      cert: cert,
      key: key,
      http2: false,
    });

    // ═══════════════════════════════════════════════════════════
    // ETAPA 1: AUTENTICAÇÃO
    // ═══════════════════════════════════════════════════════════
    console.log('\n🔐 [ETAPA 1/4] Autenticando na API EFI...');
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

    // Preparar dados para cobrança
    const txid = generateTxId();
    console.log(`📋 TXID gerado: ${txid}`);

    let splitApplied = false;
    let splitConfigId: string | null = null;
    let storeData: any = null;

    // ═══════════════════════════════════════════════════════════
    // ETAPA 2: CRIAR CONFIGURAÇÃO DE SPLIT (se aplicável)
    // ═══════════════════════════════════════════════════════════
    if (store_id) {
      console.log('\n🔀 [ETAPA 2/4] Configurando Split Payment...');
      
      // Buscar dados da loja
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('efi_account_number, efi_document_type, efi_document_number, online_payment_commission, owner_id, name, responsible_cpf')
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

      storeData = store;

      // Determinar documento a usar (novo campo ou fallback para responsible_cpf)
      const documentNumber = store.efi_document_number || store.responsible_cpf;
      const documentType = store.efi_document_type || 
        (documentNumber && cleanDocument(documentNumber).length === 11 ? 'cpf' : 'cnpj');

      if (!store.efi_account_number) {
        console.log('⚠️ Loja não tem conta EFI vinculada - prosseguindo sem split');
      } else if (!documentNumber) {
        console.log('⚠️ Documento do titular não cadastrado - prosseguindo sem split');
      } else {
        // Calcular comissões - CORREÇÃO: não subtrair taxa EFI do percentual
        // A taxa EFI (1.19%) é descontada do valor recebido, não do percentual
        const commissionPercent = store.online_payment_commission ?? 7;
        const merchantPercent = (100 - commissionPercent).toFixed(2);

        console.log(`💼 Comissão Mostralo: ${commissionPercent}%`);
        console.log(`🏪 Valor líquido lojista: ${merchantPercent}%`);
        console.log(`🏦 Conta EFI lojista: ${store.efi_account_number}`);
        console.log(`📄 Tipo documento: ${documentType}`);
        console.log(`📄 Documento: ${documentNumber}`);

        // Preparar favorecido com tipo de documento correto
        const cleanDoc = cleanDocument(documentNumber);
        const favorecido: any = {
          conta: store.efi_account_number
        };
        
        if (documentType === 'cpf') {
          favorecido.cpf = cleanDoc;
        } else {
          favorecido.cnpj = cleanDoc;
        }

        // Payload para criar configuração de split
        const splitConfigPayload = {
          descricao: `Split - ${store.name || 'Loja'} - ${descricao}`.substring(0, 80),
          lancamento: {
            imediato: true
          },
          split: {
            divisaoTarifa: "assumir_total",
            minhaParte: {
              tipo: "porcentagem",
              valor: commissionPercent.toFixed(2)
            },
            repasses: [{
              tipo: "porcentagem",
              valor: merchantPercent,
              favorecido: favorecido
            }]
          }
        };

        console.log('📤 Criando configuração de split...');
        console.log('📦 Payload:', JSON.stringify(splitConfigPayload, null, 2));

        // POST /v2/gn/split/config
        const splitConfigResponse = await fetch(`${baseUrl}/v2/gn/split/config`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(splitConfigPayload),
          client: httpClient,
        });

        const splitConfigData = await splitConfigResponse.json();
        console.log('📥 Resposta split config:', JSON.stringify(splitConfigData, null, 2));

        if (splitConfigResponse.ok && splitConfigData.id) {
          splitConfigId = splitConfigData.id;
          console.log(`✅ Configuração de split criada! ID: ${splitConfigId}`);
        } else {
          console.log('⚠️ Falha ao criar configuração de split:', splitConfigData);
          console.log('⚠️ Prosseguindo com cobrança normal (sem split)...');
          
          // Verificar se é erro de escopo/permissão
          if (splitConfigData.nome === 'nao_autorizado' || splitConfigData.nome === 'nao_encontrado') {
            console.log('ℹ️ Split payment pode não estar habilitado na conta EFI');
            console.log('ℹ️ Verifique se os escopos gn.split.write e gn.split.read estão ativos');
          }
          
          // Verificar se é erro de conta inválida
          if (splitConfigData.mensagem?.includes('conta') || splitConfigData.mensagem?.includes('favorecido')) {
            console.log('ℹ️ Possível problema com a conta EFI do lojista');
            console.log(`ℹ️ Conta: ${store.efi_account_number}, CPF: ${cleanDoc}`);
          }
        }
      }
    } else {
      console.log('\n⏭️ [ETAPA 2/4] Pulando split (store_id não informado)');
    }

    // ═══════════════════════════════════════════════════════════
    // ETAPA 3: CRIAR COBRANÇA PIX NORMAL
    // ═══════════════════════════════════════════════════════════
    console.log('\n📤 [ETAPA 3/4] Criando cobrança PIX...');
    
    const cobPayload = {
      calendario: {
        expiracao: expiracao_segundos || 3600
      },
      valor: {
        original: valorFormatado
      },
      chave: pixKey,
      solicitacaoPagador: descricao
    };

    console.log('📦 Payload cobrança:', JSON.stringify(cobPayload, null, 2));

    // PUT /v2/cob/:txid (cobrança normal)
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

    // ═══════════════════════════════════════════════════════════
    // ETAPA 4: VINCULAR COBRANÇA AO SPLIT (se aplicável)
    // ═══════════════════════════════════════════════════════════
    if (splitConfigId) {
      console.log('\n🔗 [ETAPA 4/4] Vinculando cobrança ao split...');
      console.log(`📋 TXID: ${txid}`);
      console.log(`🔧 Split Config ID: ${splitConfigId}`);

      // PUT /v2/gn/split/cob/:txid/vinculo/:splitConfigId
      const vinculoUrl = `${baseUrl}/v2/gn/split/cob/${txid}/vinculo/${splitConfigId}`;
      console.log(`🔗 URL: ${vinculoUrl}`);

      const vinculoResponse = await fetch(vinculoUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        client: httpClient,
      });

      const vinculoData = await vinculoResponse.json();
      console.log('📥 Resposta vínculo:', JSON.stringify(vinculoData, null, 2));

      if (vinculoResponse.ok) {
        splitApplied = true;
        console.log('✅ Split vinculado com sucesso!');
      } else {
        console.log('⚠️ Falha ao vincular split:', vinculoData);
        console.log('⚠️ A cobrança foi criada, mas sem split');
      }
    } else {
      console.log('\n⏭️ [ETAPA 4/4] Pulando vinculação (split não configurado)');
    }

    // ═══════════════════════════════════════════════════════════
    // BUSCAR QR CODE
    // ═══════════════════════════════════════════════════════════
    const location = cobData.loc?.id || cobData.location;
    console.log(`\n🎨 Buscando QR Code... (Location ID: ${location})`);

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

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎉 COBRANÇA CRIADA COM SUCESSO!');
    console.log(`📋 TXID: ${cobData.txid}`);
    console.log(`💰 Valor: R$ ${cobData.valor?.original}`);
    console.log(`🔀 Split aplicado: ${splitApplied ? 'SIM ✅' : 'NÃO ❌'}`);
    console.log('═══════════════════════════════════════════════════════════');

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
        splitConfigId: splitConfigId,
        splitWarning: store_id && !splitApplied 
          ? 'Split não aplicado. Verifique: 1) Escopos gn.split.write/read ativos no painel EFI, 2) Conta EFI do lojista válida, 3) CPF corresponde ao titular da conta'
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
