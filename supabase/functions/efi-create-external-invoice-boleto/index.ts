import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateBoletoRequest {
  invoice_id: string;
  valor: string;
  descricao: string;
  vencimento: string; // YYYY-MM-DD
  cliente: {
    nome: string;
    cpf?: string;
    cnpj?: string;
    email?: string;
    telefone?: string;
    endereco?: {
      logradouro: string;
      numero: string;
      bairro: string;
      cidade: string;
      uf: string;
      cep: string;
    };
  };
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { invoice_id, valor, descricao, vencimento, cliente }: CreateBoletoRequest = await req.json();

    if (!invoice_id || !valor || !vencimento || !cliente?.nome) {
      return new Response(
        JSON.stringify({ success: false, error: 'invoice_id, valor, vencimento e cliente.nome são obrigatórios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Formatar valor para centavos (inteiro)
    const valorCentavos = Math.round(parseFloat(valor) * 100);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📄 CRIANDO BOLETO PARA FATURA EXTERNA');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📄 Invoice ID: ${invoice_id}`);
    console.log(`💵 Valor: R$ ${(valorCentavos / 100).toFixed(2)}`);
    console.log(`📝 Descrição: ${descricao}`);
    console.log(`📅 Vencimento: ${vencimento}`);
    console.log(`👤 Cliente: ${cliente.nome}`);

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

    if (!clientId || !clientSecret || !certificatePem) {
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

    // API base para cobranças/boletos (domínio EFI)
    const baseUrl = isProd 
      ? 'https://cobrancas.api.efipay.com.br'
      : 'https://cobrancas-h.api.efipay.com.br';

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

    // ETAPA 2: CRIAR COBRANÇA (sem boleto ainda)
    console.log('\n📤 [ETAPA 2/3] Criando cobrança...');
    
    // Montar dados do pagador
    const pagador: any = {
      nome: cliente.nome.substring(0, 100),
    };

    // CPF ou CNPJ
    if (cliente.cnpj) {
      pagador.cnpj = cliente.cnpj.replace(/\D/g, '');
    } else if (cliente.cpf) {
      pagador.cpf = cliente.cpf.replace(/\D/g, '');
    } else {
      // CPF genérico para teste em sandbox
      pagador.cpf = isProd ? null : '94271564656';
    }

    // Endereço (obrigatório para boleto)
    if (cliente.endereco) {
      pagador.endereco = {
        logradouro: cliente.endereco.logradouro || 'Não informado',
        numero: cliente.endereco.numero || 'S/N',
        bairro: cliente.endereco.bairro || 'Centro',
        cidade: cliente.endereco.cidade || 'São Paulo',
        estado: cliente.endereco.uf || 'SP',
        cep: cliente.endereco.cep?.replace(/\D/g, '') || '01310100',
      };
    } else {
      // Endereço padrão para sandbox
      pagador.endereco = {
        logradouro: 'Av Paulista',
        numero: '1000',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01310100',
      };
    }

    // Criar cobrança
    const cobrancaPayload = {
      items: [{
        name: descricao.substring(0, 100),
        value: valorCentavos,
        amount: 1,
      }],
    };

    console.log('📦 Payload cobrança:', JSON.stringify(cobrancaPayload, null, 2));

    const cobrancaResponse = await fetch(`${baseUrl}/v1/charge/one-step`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...cobrancaPayload,
        payment: {
          banking_billet: {
            customer: pagador,
            expire_at: vencimento,
            message: descricao.substring(0, 80),
          },
        },
      }),
      client: httpClient,
    });

    const cobrancaData = await cobrancaResponse.json();
    console.log('📥 Resposta cobrança:', JSON.stringify(cobrancaData, null, 2));

    if (!cobrancaResponse.ok || !cobrancaData.data) {
      httpClient.close();
      console.error('❌ Erro ao criar cobrança:', cobrancaData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: cobrancaData.message || cobrancaData.error_description || 'Erro ao criar boleto',
          details: cobrancaData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const boletoData = cobrancaData.data;
    console.log('✅ Boleto criado com sucesso!');

    httpClient.close();

    // Extrair dados do boleto
    const codigoBarras = boletoData.barcode || '';
    const linhaDigitavel = boletoData.pix?.qrcode || boletoData.billet_link?.split('/').pop() || '';
    const pdfUrl = boletoData.pdf?.charge || boletoData.billet_link || '';
    const chargeId = boletoData.charge_id;

    // Calcular data de expiração do boleto
    const boletoExpiresAt = vencimento;

    // Salvar dados do boleto na fatura
    console.log(`\n💾 Salvando dados do boleto na fatura ${invoice_id}...`);
    const { error: updateError } = await supabase
      .from('external_invoices')
      .update({
        boleto_codigo_barras: codigoBarras,
        boleto_linha_digitavel: linhaDigitavel || boletoData.link || pdfUrl,
        boleto_pdf_url: pdfUrl,
        boleto_expires_at: boletoExpiresAt,
      })
      .eq('id', invoice_id);

    if (updateError) {
      console.error('⚠️ Erro ao salvar boleto na fatura:', updateError);
    } else {
      console.log('✅ Dados do boleto salvos na fatura!');
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ BOLETO PARA FATURA EXTERNA CRIADO COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════════');

    return new Response(
      JSON.stringify({
        success: true,
        charge_id: chargeId,
        codigo_barras: codigoBarras,
        linha_digitavel: linhaDigitavel || boletoData.link || pdfUrl,
        pdf_url: pdfUrl,
        expires_at: boletoExpiresAt,
        billet_link: boletoData.billet_link || pdfUrl,
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
