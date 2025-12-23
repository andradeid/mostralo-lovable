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

    const authUrl = `${baseUrl}/v1/authorize`;
    console.log(`🔗 URL autenticação: ${authUrl}`);

    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ grant_type: 'client_credentials' }),
      client: httpClient,
    });

    const authText = await authResponse.text();
    console.log(`📥 Resposta autenticação (HTTP ${authResponse.status}): ${authText?.slice(0, 500)}`);

    let authData: Record<string, unknown> = {};
    try {
      authData = authText ? JSON.parse(authText) : {};
    } catch {
      authData = { raw: authText };
    }

    const accessToken = typeof authData.access_token === 'string' ? authData.access_token : null;

    if (!authResponse.ok || !accessToken) {
      httpClient.close();
      console.error('❌ Falha na autenticação:', authData);

      const hint = authResponse.status === 404 || (authText || '').includes('Not Found')
        ? 'Dica: esse 404 no /v1/authorize geralmente indica credenciais de um app que NÃO está com o escopo da API Cobranças/Boletos habilitado (ou ambiente produção/homologação invertido). Verifique na Efí: API → Aplicações → habilitar "Cobranças" no ambiente correto.'
        : null;

      return new Response(
        JSON.stringify({
          success: false,
          error: `Falha na autenticação: ${(
            (authData as any)?.error_description ||
            (authData as any)?.error ||
            authResponse.statusText ||
            'Erro desconhecido'
          )}`,
          upstream_status: authResponse.status,
          hint,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      );
    }

    console.log('✅ Autenticado com sucesso!');

    // ETAPA 2: CRIAR COBRANÇA (sem boleto ainda)
    console.log('\n📤 [ETAPA 2/3] Criando cobrança...');
    
    // Montar dados do customer (schema em inglês conforme documentação EFI)
    const customer: Record<string, unknown> = {
      name: cliente.nome.substring(0, 100),
    };

    // CPF ou CNPJ
    if (cliente.cnpj) {
      customer.juridical_person = {
        corporate_name: cliente.nome.substring(0, 100),
        cnpj: cliente.cnpj.replace(/\D/g, ''),
      };
      delete customer.name; // Para PJ usa juridical_person
    } else if (cliente.cpf) {
      customer.cpf = cliente.cpf.replace(/\D/g, '');
    } else {
      // CPF genérico para teste em sandbox
      customer.cpf = isProd ? null : '94271564656';
    }

    // Endereço (obrigatório para boleto) - schema em inglês
    if (cliente.endereco) {
      customer.address = {
        street: (cliente.endereco.logradouro || 'Não informado').substring(0, 200),
        number: (cliente.endereco.numero || 'S/N').substring(0, 10),
        neighborhood: (cliente.endereco.bairro || 'Centro').substring(0, 60),
        city: (cliente.endereco.cidade || 'São Paulo').substring(0, 60),
        state: (cliente.endereco.uf || 'SP').substring(0, 2).toUpperCase(),
        zipcode: (cliente.endereco.cep?.replace(/\D/g, '') || '01310100').substring(0, 8),
        complement: '',
      };
    } else {
      // Endereço padrão para sandbox
      customer.address = {
        street: 'Av Paulista',
        number: '1000',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zipcode: '01310100',
        complement: '',
      };
    }

    // Log leve (sem dados sensíveis) para confirmar schema enviado
    console.log(`🧾 Customer keys: ${Object.keys(customer).join(', ')}`);
    const address = (customer as Record<string, unknown>).address;
    if (address && typeof address === 'object') {
      console.log(`🏠 Customer.address keys: ${Object.keys(address as Record<string, unknown>).join(', ')}`);
    }

    // URL base do webhook para notificações de pagamento
    const webhookBaseUrl = 'https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/efi-boleto-webhook';

    // Criar cobrança com notification_url para receber callbacks
    const cobrancaPayload = {
      items: [{
        name: descricao.substring(0, 100),
        value: valorCentavos,
        amount: 1,
      }],
    };

    console.log('📦 Payload cobrança:', JSON.stringify(cobrancaPayload, null, 2));
    console.log('🔔 Webhook URL:', webhookBaseUrl);

    const cobrancaResponse = await fetch(`${baseUrl}/v1/charge/one-step`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...cobrancaPayload,
        metadata: {
          notification_url: webhookBaseUrl,
          custom_id: invoice_id,
        },
        payment: {
          banking_billet: {
            customer: customer,
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

    // Log dos links retornados para debug
    console.log('🔗 Links do boleto:', {
      pdf: boletoData.pdf?.charge,
      link: boletoData.link,
      billet_link: boletoData.billet_link,
      barcode: boletoData.barcode
    });

    // Extrair dados do boleto
    // O código de barras vem formatado com espaços, vamos limpar (só números)
    const codigoBarras = (boletoData.barcode || '').replace(/\D/g, '');
    
    // A linha digitável é o barcode formatado (com espaços para exibição)
    const linhaDigitavel = boletoData.barcode || '';
    
    // Links separados:
    // - viewUrl: billet_link (página HTML da Efí para visualização) - EX: https://visualizacao.gerencianet.com.br/emissao/...
    // - pdfUrl: pdf.charge (link direto para download do PDF) - EX: https://download.sejaefi.com.br/...pdf
    const viewUrl = boletoData.billet_link || boletoData.link || '';
    const pdfUrl = boletoData.pdf?.charge || boletoData.link || viewUrl;
    const chargeId = boletoData.charge_id;

    console.log('📋 Dados extraídos do boleto:', {
      codigoBarras: codigoBarras.substring(0, 20) + '...',
      linhaDigitavel: linhaDigitavel.substring(0, 30) + '...',
      viewUrl,
      pdfUrl,
    });

    // Calcular data de expiração do boleto
    const boletoExpiresAt = vencimento;

    // Salvar dados do boleto na fatura (agora com campos separados + charge_id para webhook)
    console.log(`\n💾 Salvando dados do boleto na fatura ${invoice_id}...`);
    console.log(`📌 Charge ID: ${chargeId}`);
    const { error: updateError } = await supabase
      .from('external_invoices')
      .update({
        boleto_codigo_barras: codigoBarras,
        boleto_linha_digitavel: linhaDigitavel,
        boleto_pdf_url: pdfUrl,
        boleto_view_url: viewUrl,
        boleto_expires_at: boletoExpiresAt,
        boleto_charge_id: chargeId?.toString() || null, // Salvar charge_id para webhook
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

    // Retornar com campos separados para o frontend
    return new Response(
      JSON.stringify({
        success: true,
        charge_id: chargeId,
        codigo_barras: codigoBarras,
        linha_digitavel: linhaDigitavel,
        view_url: viewUrl,
        pdf_url: pdfUrl,
        expires_at: boletoExpiresAt,
        // Mantém billet_link para compatibilidade
        billet_link: viewUrl,
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
