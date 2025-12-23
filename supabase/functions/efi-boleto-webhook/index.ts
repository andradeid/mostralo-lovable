import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📨 WEBHOOK BOLETO EFI RECEBIDO');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`📍 Method: ${req.method}`);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // A Efí envia POST com token de notificação
    const body = await req.text();
    console.log('📥 Body recebido:', body);

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(body);
    } catch {
      // A Efí pode enviar x-www-form-urlencoded
      const formData = new URLSearchParams(body);
      payload = Object.fromEntries(formData.entries());
    }

    console.log('📦 Payload parseado:', JSON.stringify(payload, null, 2));

    // Extrair token de notificação
    const notificationToken = payload.notification as string;
    
    if (!notificationToken) {
      console.log('⚠️ Nenhum token de notificação recebido');
      return new Response(
        JSON.stringify({ success: true, message: 'Webhook recebido sem token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔑 Token de notificação: ${notificationToken}`);

    // Buscar configuração ativa do payment gateway
    const { data: config, error: configError } = await supabase
      .from('subscription_payment_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      console.error('❌ Configuração EFI não encontrada:', configError);
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração não encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const environment = config.efi_environment || 'sandbox';
    const isProd = environment === 'production';

    const clientId = isProd ? config.efi_client_id_production : config.efi_client_id;
    const clientSecret = isProd ? config.efi_client_secret_production : config.efi_client_secret;
    const certificatePem = isProd ? config.efi_certificate_pem_production : config.efi_certificate_pem;

    if (!clientId || !clientSecret || !certificatePem) {
      console.error('❌ Credenciais incompletas');
      return new Response(
        JSON.stringify({ success: false, error: 'Credenciais incompletas' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { cert, key } = parsePemContent(certificatePem);
    if (!cert || !key) {
      return new Response(
        JSON.stringify({ success: false, error: 'Certificado inválido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const baseUrl = isProd 
      ? 'https://cobrancas.api.efipay.com.br'
      : 'https://cobrancas-h.api.efipay.com.br';

    console.log(`🌐 Ambiente: ${environment}`);

    // Criar cliente mTLS
    const httpClient = Deno.createHttpClient({
      cert: cert,
      key: key,
      http2: false,
    });

    // Autenticar na API Efí
    console.log('🔐 Autenticando na API Efí...');
    const authResponse = await fetch(`${baseUrl}/v1/authorize`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ grant_type: 'client_credentials' }),
      client: httpClient,
    });

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    if (!authResponse.ok || !accessToken) {
      httpClient.close();
      console.error('❌ Falha na autenticação:', authData);
      return new Response(
        JSON.stringify({ success: false, error: 'Falha na autenticação' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      );
    }

    console.log('✅ Autenticado com sucesso!');

    // Consultar detalhes da notificação
    console.log(`📡 Consultando notificação: ${notificationToken}`);
    const notificationResponse = await fetch(`${baseUrl}/v1/notification/${notificationToken}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      client: httpClient,
    });

    const notificationData = await notificationResponse.json();
    console.log('📋 Dados da notificação:', JSON.stringify(notificationData, null, 2));

    httpClient.close();

    if (!notificationResponse.ok || !notificationData.data) {
      console.error('❌ Erro ao consultar notificação:', notificationData);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao consultar notificação' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Processar cada notificação (pode ter múltiplas)
    const notifications = Array.isArray(notificationData.data) 
      ? notificationData.data 
      : [notificationData.data];

    for (const notification of notifications) {
      const chargeId = notification.identifiers?.charge_id || notification.charge_id;
      const status = notification.status?.current || notification.status;
      const customId = notification.custom_id;

      console.log(`🔍 Processando: charge_id=${chargeId}, status=${status}, custom_id=${customId}`);

      // Se o status for "paid", atualizar a fatura
      if (status === 'paid' || status === 'settled') {
        console.log(`✅ Pagamento confirmado para charge_id: ${chargeId}`);

        // Buscar fatura pelo boleto_charge_id ou custom_id (que é o invoice_id)
        let invoiceQuery = supabase
          .from('external_invoices')
          .select('id, payment_status')
          .eq('payment_status', 'pending');

        if (chargeId) {
          invoiceQuery = invoiceQuery.eq('boleto_charge_id', chargeId.toString());
        } else if (customId) {
          invoiceQuery = invoiceQuery.eq('id', customId);
        }

        const { data: invoices, error: invoiceError } = await invoiceQuery;

        if (invoiceError) {
          console.error('❌ Erro ao buscar fatura:', invoiceError);
          continue;
        }

        if (!invoices || invoices.length === 0) {
          console.log(`⚠️ Nenhuma fatura pendente encontrada para charge_id: ${chargeId}`);
          continue;
        }

        for (const invoice of invoices) {
          console.log(`💾 Atualizando fatura ${invoice.id} para pago...`);
          
          const { error: updateError } = await supabase
            .from('external_invoices')
            .update({
              payment_status: 'paid',
              paid_at: new Date().toISOString(),
              payment_method: 'boleto',
            })
            .eq('id', invoice.id);

          if (updateError) {
            console.error(`❌ Erro ao atualizar fatura ${invoice.id}:`, updateError);
          } else {
            console.log(`✅ Fatura ${invoice.id} atualizada para PAGO!`);
          }
        }
      } else {
        console.log(`ℹ️ Status "${status}" não requer ação`);
      }
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ WEBHOOK PROCESSADO COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════════');

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processado' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro interno' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
