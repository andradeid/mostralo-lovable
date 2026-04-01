import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function parsePemContent(pemContent: string): { cert: string; key: string } {
  const cleanPem = pemContent.trim();
  const certMatches = cleanPem.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g);
  const cert = certMatches ? certMatches.join('\n') : '';
  const keyMatch = cleanPem.match(/-----BEGIN (RSA )?PRIVATE KEY-----[\s\S]*?-----END (RSA )?PRIVATE KEY-----/);
  const key = keyMatch ? keyMatch[0] : '';
  return { cert, key };
}

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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar fatura pelo token público
    const { data: invoice, error: invoiceError } = await supabase
      .from('subscription_invoices')
      .select('id, store_id, plan_id, amount, payment_status, pix_txid, pix_copia_cola, pix_expires_at, pix_qrcode_base64, description, contact_name, due_date')
      .eq('public_token', token)
      .single();

    if (invoiceError || !invoice) {
      return new Response(JSON.stringify({ error: 'Fatura não encontrada' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Se já está paga, retornar status
    if (invoice.payment_status === 'paid') {
      return new Response(JSON.stringify({
        status: 'paid',
        invoice_id: invoice.id,
        amount: invoice.amount,
        paid: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se PIX existente ainda é válido
    if (invoice.pix_copia_cola && invoice.pix_expires_at) {
      const expiresAt = new Date(invoice.pix_expires_at);
      if (expiresAt > new Date()) {
        // PIX ainda válido, retornar dados existentes
        return new Response(JSON.stringify({
          status: 'pending',
          invoice_id: invoice.id,
          amount: invoice.amount,
          pix_copia_cola: invoice.pix_copia_cola,
          pix_qrcode_base64: invoice.pix_qrcode_base64,
          pix_expires_at: invoice.pix_expires_at,
          description: invoice.description,
          contact_name: invoice.contact_name,
          due_date: invoice.due_date,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Gerar novo PIX via EFI
    const { data: paymentConfig } = await supabase
      .from('subscription_payment_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!paymentConfig?.efi_pix_key) {
      return new Response(JSON.stringify({ error: 'Sistema de pagamento não configurado' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar nome da loja
    const { data: store } = await supabase
      .from('stores')
      .select('name')
      .eq('id', invoice.store_id)
      .single();

    const environment = paymentConfig.efi_environment || 'sandbox';
    const isProd = environment === 'production';
    const clientId = isProd ? paymentConfig.efi_client_id_production : paymentConfig.efi_client_id;
    const clientSecret = isProd ? paymentConfig.efi_client_secret_production : paymentConfig.efi_client_secret;
    const certificatePem = isProd ? paymentConfig.efi_certificate_pem_production : paymentConfig.efi_certificate_pem;

    if (!clientId || !clientSecret || !certificatePem) {
      return new Response(JSON.stringify({ error: 'Credenciais EFI não configuradas' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { cert, key } = parsePemContent(certificatePem);
    const baseUrl = isProd
      ? 'https://pix.api.efipay.com.br'
      : 'https://pix-h.api.efipay.com.br';

    const httpClient = Deno.createHttpClient({ cert, key, http2: false });

    // Autenticar
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
      return new Response(JSON.stringify({ error: 'Erro de autenticação com gateway' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const expirationSeconds = 3600; // 1 hora
    const txid = generateTxId();
    const descricao = invoice.description || `Assinatura Mostralo - ${store?.name || 'Loja'}`;
    const valorFormatado = parseFloat(String(invoice.amount)).toFixed(2);

    const cobPayload = {
      calendario: { expiracao: expirationSeconds },
      valor: { original: valorFormatado },
      chave: paymentConfig.efi_pix_key,
      solicitacaoPagador: descricao.substring(0, 140),
    };

    const cobResponse = await fetch(`${baseUrl}/v2/cob/${txid}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cobPayload),
      client: httpClient,
    });

    const cobData = await cobResponse.json();

    if (!cobResponse.ok) {
      httpClient.close();
      console.error('❌ Erro criar cobrança EFI:', cobData);
      return new Response(JSON.stringify({ error: 'Erro ao gerar cobrança PIX' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const efiTxid = cobData.txid || txid;
    let pixCopiaECola: string | null = null;
    let pixQrcodeBase64: string | null = null;

    // Buscar QR Code
    const locationId = cobData.loc?.id;
    if (locationId) {
      const qrResponse = await fetch(`${baseUrl}/v2/loc/${locationId}/qrcode`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authData.access_token}` },
        client: httpClient,
      });

      if (qrResponse.ok) {
        const qrData = await qrResponse.json();
        pixCopiaECola = (qrData.qrcode || '')
          .replace(/[\r\n\t]/g, '')
          .replace(/[\u200B-\u200D\uFEFF]/g, '')
          .replace(/\s+/g, '')
          .trim() || null;
        pixQrcodeBase64 = qrData.imagemQrcode || null;
      }
    }

    if (!pixCopiaECola && cobData.pixCopiaECola) {
      pixCopiaECola = cobData.pixCopiaECola;
    }

    httpClient.close();

    // Calcular expiração
    const pixExpiresAt = new Date(Date.now() + expirationSeconds * 1000).toISOString();

    // Atualizar fatura com dados do PIX
    await supabase
      .from('subscription_invoices')
      .update({
        pix_txid: efiTxid,
        pix_copia_cola: pixCopiaECola,
        pix_qrcode_base64: pixQrcodeBase64,
        pix_expires_at: pixExpiresAt,
        pix_key: paymentConfig.efi_pix_key,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id);

    console.log(`✅ PIX gerado para fatura ${invoice.id} - txid: ${efiTxid}`);

    return new Response(JSON.stringify({
      status: 'pending',
      invoice_id: invoice.id,
      amount: invoice.amount,
      pix_copia_cola: pixCopiaECola,
      pix_qrcode_base64: pixQrcodeBase64,
      pix_expires_at: pixExpiresAt,
      description: invoice.description,
      contact_name: invoice.contact_name,
      due_date: invoice.due_date,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[generate-subscription-invoice-pix] Erro:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Erro interno',
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
