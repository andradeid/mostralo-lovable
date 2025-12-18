import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, txid } = await req.json();

    if (!orderId || !txid) {
      console.error('[confirm-pix-payment] Missing orderId or txid');
      return new Response(
        JSON.stringify({ success: false, error: 'orderId e txid são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[confirm-pix-payment] Verificando pagamento - orderId: ${orderId}, txid: ${txid}`);

    // Criar cliente Supabase com service_role para bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar pedido para validação
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, payment_status, store_id, payment_details')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('[confirm-pix-payment] Pedido não encontrado:', orderError);
      return new Response(
        JSON.stringify({ success: false, error: 'Pedido não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se txid corresponde ao pedido
    const paymentDetails = order.payment_details as any;
    if (paymentDetails?.pix_txid !== txid) {
      console.error('[confirm-pix-payment] TXID não corresponde ao pedido');
      return new Response(
        JSON.stringify({ success: false, error: 'TXID não corresponde ao pedido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar configuração EFI da loja para verificar status na EFI
    const { data: storeConfig } = await supabase
      .from('subscription_payment_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!storeConfig) {
      console.error('[confirm-pix-payment] Configuração EFI não encontrada');
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração de pagamento não encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar status na EFI
    const isProduction = storeConfig.efi_environment === 'production';
    const clientId = isProduction ? storeConfig.efi_client_id : storeConfig.efi_sandbox_client_id;
    const clientSecret = isProduction ? storeConfig.efi_client_secret : storeConfig.efi_sandbox_client_secret;
    const certificatePem = isProduction ? storeConfig.efi_certificate_pem : storeConfig.efi_sandbox_certificate_pem;

    if (!clientId || !clientSecret || !certificatePem) {
      console.error('[confirm-pix-payment] Credenciais EFI incompletas');
      return new Response(
        JSON.stringify({ success: false, error: 'Credenciais EFI incompletas' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse PEM
    const parsePemContent = (pemContent: string) => {
      const certMatch = pemContent.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/);
      const keyMatch = pemContent.match(/-----BEGIN (RSA |EC |ENCRYPTED )?PRIVATE KEY-----[\s\S]+?-----END (RSA |EC |ENCRYPTED )?PRIVATE KEY-----/);
      return {
        cert: certMatch ? certMatch[0] : null,
        key: keyMatch ? keyMatch[0] : null,
      };
    };

    const { cert, key } = parsePemContent(certificatePem);
    if (!cert || !key) {
      console.error('[confirm-pix-payment] Certificado PEM inválido');
      return new Response(
        JSON.stringify({ success: false, error: 'Certificado inválido' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente mTLS (http2: false é necessário para a API EFI)
    const httpClient = Deno.createHttpClient({ cert, key, http2: false });

    // Obter token de acesso
    const tokenUrl = isProduction
      ? 'https://pix.api.efipay.com.br/oauth/token'
      : 'https://pix-h.api.efipay.com.br/oauth/token';

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ grant_type: 'client_credentials' }),
      client: httpClient,
    });

    if (!tokenResponse.ok) {
      console.error('[confirm-pix-payment] Erro ao obter token EFI:', await tokenResponse.text());
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao autenticar com EFI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Consultar status do PIX
    const pixUrl = isProduction
      ? `https://pix.api.efipay.com.br/v2/cob/${txid}`
      : `https://pix-h.api.efipay.com.br/v2/cob/${txid}`;

    const pixResponse = await fetch(pixUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      client: httpClient,
    });

    if (!pixResponse.ok) {
      console.error('[confirm-pix-payment] Erro ao consultar PIX:', await pixResponse.text());
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao consultar status do PIX' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pixData = await pixResponse.json();
    console.log(`[confirm-pix-payment] Status EFI: ${pixData.status}`);

    // Verificar se pagamento foi confirmado
    if (pixData.status !== 'CONCLUIDA') {
      console.log(`[confirm-pix-payment] Pagamento ainda não confirmado: ${pixData.status}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Pagamento ainda não confirmado', efiStatus: pixData.status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Pagamento confirmado! Atualizar pedido
    console.log(`[confirm-pix-payment] Pagamento CONFIRMADO! Atualizando pedido ${orderId}`);

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'entrada',
        payment_status: 'paid',
        payment_details: {
          ...paymentDetails,
          pix_confirmed_at: new Date().toISOString(),
          pix_end_to_end_id: pixData.pix?.[0]?.endToEndId || null,
        },
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('[confirm-pix-payment] Erro ao atualizar pedido:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao atualizar pedido' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[confirm-pix-payment] Pedido ${orderId} atualizado com sucesso!`);

    return new Response(
      JSON.stringify({ success: true, message: 'Pagamento confirmado e pedido atualizado' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    console.error('[confirm-pix-payment] Erro interno:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
