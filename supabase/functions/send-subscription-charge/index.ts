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

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar master admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profile?.user_type !== 'master_admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { store_id, phone, contact_name, amount, description } = await req.json();

    if (!store_id || !phone || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'store_id, phone e amount são obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalizar telefone
    let normalizedPhone = phone.replace(/\D/g, '');
    if (!normalizedPhone.startsWith('55')) {
      normalizedPhone = '55' + normalizedPhone;
    }

    const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(amount));
    const firstName = contact_name?.split(' ')[0] || 'Cliente';

    console.log(`💰 [send-subscription-charge] PIX ${formattedAmount} para ${normalizedPhone} (loja: ${store_id})`);

    // Buscar dados da loja
    const { data: store } = await supabase
      .from('stores')
      .select('name, subscription_expires_at, plan_id')
      .eq('id', store_id)
      .single();

    if (!store) {
      return new Response(JSON.stringify({ error: 'Loja não encontrada' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar config WhatsApp Master
    const { data: masterConfig } = await supabase
      .from('master_whatsapp_config')
      .select('id, instance_name, evolution_instance_id, instance_phone')
      .eq('admin_user_id', user.id)
      .single();

    if (!masterConfig?.evolution_instance_id) {
      return new Response(JSON.stringify({ error: 'Instância WhatsApp master não configurada' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: uazapiConfig } = await supabase
      .from('uazapi_config')
      .select('api_url')
      .order('is_active', { ascending: false })
      .limit(1)
      .single();

    if (!uazapiConfig?.api_url) {
      return new Response(JSON.stringify({ error: 'UaZapi não configurado' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiUrl = uazapiConfig.api_url.replace(/\/$/, '');
    const token = masterConfig.evolution_instance_id;

    // Buscar config EFI para chave PIX
    const { data: paymentConfig } = await supabase
      .from('subscription_payment_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!paymentConfig?.efi_pix_key) {
      return new Response(JSON.stringify({ error: 'Chave PIX não configurada no sistema' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Enviar botão nativo /send/request-payment
    const pixKey = paymentConfig.efi_pix_key;
    const pixName = paymentConfig.efi_pix_key_name || 'Mostralo';
    const expirationSeconds = 3600;

    const requestPaymentBody: Record<string, unknown> = {
      number: normalizedPhone,
      amount: Number(amount),
      pixKey: pixKey,
      pixType: 'EVP',
      pixName: pixName,
      title: `Assinatura ${store.name || 'Mostralo'}`,
      text: `Pagamento referente à assinatura da plataforma Mostralo`,
      footer: 'Mostralo - Sua loja digital',
      itemName: `Assinatura - ${store.name}`,
    };

    console.log('📤 Enviando /send/request-payment...');

    const paymentResp = await fetch(`${apiUrl}/send/request-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': token },
      body: JSON.stringify(requestPaymentBody),
    });

    const paymentRespBody = await paymentResp.text();
    let paymentMessageId: string | null = null;
    try {
      const parsed = JSON.parse(paymentRespBody);
      paymentMessageId = parsed?.id || parsed?.messageid || parsed?.key?.id || null;
    } catch { /* ignore */ }

    console.log(`📤 /send/request-payment: ${paymentResp.ok ? '✅' : '❌'} status=${paymentResp.status}`);

    // 2. Gerar PIX Copia e Cola via EFI
    let pixCopiaECola: string | null = null;
    let efiTxid: string | null = null;

    try {
      const environment = paymentConfig.efi_environment || 'sandbox';
      const isProd = environment === 'production';
      const clientId = isProd ? paymentConfig.efi_client_id_production : paymentConfig.efi_client_id;
      const clientSecret = isProd ? paymentConfig.efi_client_secret_production : paymentConfig.efi_client_secret;
      const certificatePem = isProd ? paymentConfig.efi_certificate_pem_production : paymentConfig.efi_certificate_pem;

      if (clientId && clientSecret && certificatePem) {
        const { cert, key } = parsePemContent(certificatePem);
        const baseUrl = isProd
          ? 'https://pix.api.efipay.com.br'
          : 'https://pix-h.api.efipay.com.br';

        const httpClient = Deno.createHttpClient({ cert, key, http2: false });

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

        if (authResponse.ok && authData.access_token) {
          const txid = generateTxId();
          const descricaoCobranca = description || `Assinatura Mostralo - ${store.name}`;
          const valorFormatado = parseFloat(String(amount)).toFixed(2);

          const cobPayload = {
            calendario: { expiracao: expirationSeconds },
            valor: { original: valorFormatado },
            chave: pixKey,
            solicitacaoPagador: descricaoCobranca.substring(0, 140),
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

          if (cobResponse.ok) {
            efiTxid = cobData.txid || txid;
            console.log(`✅ Cobrança EFI criada - txid: ${efiTxid}`);

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
              }
            }

            if (!pixCopiaECola && cobData.pixCopiaECola) {
              pixCopiaECola = cobData.pixCopiaECola;
            }
          } else {
            console.error('❌ Erro criar cobrança EFI:', cobData);
          }
        }

        httpClient.close();
      }
    } catch (efiErr) {
      console.error('⚠️ Erro EFI (não-fatal):', efiErr);
    }

    // 3. Enviar instrução de pagamento
    const instructionText = `✅ *Cobrança de Assinatura - ${store.name}*\n\n` +
      `Olá ${firstName}! 👋\n\n` +
      `Segue a cobrança da assinatura no valor de *${formattedAmount}*.\n\n` +
      `Para pagar, clique em *"Copiar código Pix"* na mensagem acima e abra o app do seu banco:\n\n` +
      `1️⃣ Abra seu banco\n` +
      `2️⃣ Vá em *Pix* → *Copia e Cola*\n` +
      `3️⃣ Cole o código e confirme o pagamento\n\n` +
      `_O código expira em ${Math.round(expirationSeconds / 60)} minutos._`;

    await fetch(`${apiUrl}/send/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': token },
      body: JSON.stringify({ number: normalizedPhone, text: instructionText }),
    });

    // 4. Persistir no chat master
    const remoteJid = `${normalizedPhone}@s.whatsapp.net`;
    const now = new Date().toISOString();

    await supabase.from('master_whatsapp_chat_messages').insert({
      config_id: masterConfig.id,
      remote_jid: remoteJid,
      phone_number: normalizedPhone,
      direction: 'outgoing',
      sender_name: 'Admin',
      content: pixCopiaECola || `Cobrança Assinatura ${formattedAmount}`,
      message_type: 'payment_request',
      is_from_bot: false,
      is_read_by_admin: true,
      timestamp: now,
      evolution_message_id: paymentMessageId || null,
      metadata: {
        amount: Number(amount),
        pix_key: pixKey,
        pix_copia_e_cola: pixCopiaECola,
        txid: efiTxid,
        store_id: store_id,
        store_name: store.name,
        type: 'subscription_charge',
      },
      message_source: 'admin_chat',
    });

    // Atualizar conversa
    await supabase
      .from('master_whatsapp_conversations')
      .upsert({
        config_id: masterConfig.id,
        remote_jid: remoteJid,
        phone_number: normalizedPhone,
        last_message: `💰 Cobrança Assinatura: ${formattedAmount}`,
        last_message_at: now,
        last_message_direction: 'outgoing',
        last_message_source: 'admin_chat',
        status: 'active',
      }, {
        onConflict: 'config_id,remote_jid',
      });

    console.log('✅ Cobrança de assinatura enviada com sucesso!');

    return new Response(JSON.stringify({
      success: true,
      txid: efiTxid,
      pixCopiaECola: !!pixCopiaECola,
      amount: formattedAmount,
      phone: normalizedPhone,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[send-subscription-charge] Erro:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Erro interno',
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
