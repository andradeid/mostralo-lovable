import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extrair certificado e chave privada do PEM
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
    // Auth
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

    const body = await req.json();
    const {
      remoteJid,
      amount,
      description,
      expirationSeconds = 3600,
      contactName,
      // Campos do /send/request-payment
      pixKey,
      pixType = 'EVP',
      pixName,
      title,
      text,
      footer,
      itemName,
      invoiceNumber,
      generateEfiPix = true,
    } = body;

    if (!remoteJid || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'remoteJid e amount são obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!pixKey) {
      return new Response(JSON.stringify({ error: 'pixKey é obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const phoneNumber = remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '');
    const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(amount));

    console.log(`💰 [master-pix-send] PIX ${formattedAmount} para ${phoneNumber} | EFI: ${generateEfiPix}`);

    // ========== 1. Buscar config WhatsApp Master + UaZapi ==========
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

    // ========== 2. Enviar botão nativo via /send/request-payment ==========
    const requestPaymentBody: Record<string, unknown> = {
      number: phoneNumber,
      amount: Number(amount),
      pixKey: pixKey,
      pixType: pixType,
    };

    if (pixName) requestPaymentBody.pixName = pixName;
    if (title) requestPaymentBody.title = title;
    if (text) requestPaymentBody.text = text;
    if (footer) requestPaymentBody.footer = footer;
    if (itemName) requestPaymentBody.itemName = itemName;
    if (invoiceNumber) requestPaymentBody.invoiceNumber = invoiceNumber;

    console.log('📤 Enviando /send/request-payment:', JSON.stringify(requestPaymentBody));

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
    if (!paymentResp.ok) {
      console.log('⚠️ Resposta request-payment:', paymentRespBody);
    }

    // ========== 3. (Opcional) Gerar PIX Copia e Cola via EFI ==========
    let pixCopiaECola: string | null = null;
    let qrCodeBase64: string | null = null;
    let efiTxid: string | null = null;

    if (generateEfiPix) {
      try {
        const { data: config, error: configError } = await supabase
          .from('subscription_payment_config')
          .select('*')
          .eq('is_active', true)
          .single();

        if (configError || !config) {
          console.log('⚠️ Config EFI não encontrada, prosseguindo sem Copia e Cola');
        } else {
          const environment = config.efi_environment || 'sandbox';
          const isProd = environment === 'production';
          const clientId = isProd ? config.efi_client_id_production : config.efi_client_id;
          const clientSecret = isProd ? config.efi_client_secret_production : config.efi_client_secret;
          const certificatePem = isProd ? config.efi_certificate_pem_production : config.efi_certificate_pem;
          const efiPixKey = config.efi_pix_key;

          if (clientId && clientSecret && certificatePem && efiPixKey) {
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

            if (authResponse.ok && authData.access_token) {
              const txid = generateTxId();
              const descricaoCobranca = description || `Cobrança Mostralo - ${contactName || phoneNumber}`;
              const valorFormatado = parseFloat(String(amount)).toFixed(2);

              const cobPayload = {
                calendario: { expiracao: expirationSeconds },
                valor: { original: valorFormatado },
                chave: efiPixKey,
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
                console.log(`✅ Cobrança EFI criada - txid local: ${txid}, txid EFI: ${cobData.txid}, loc: ${cobData.loc?.id}`);

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
                    const rawQrCode = qrData.qrcode || '';
                    pixCopiaECola = rawQrCode
                      .replace(/[\r\n\t]/g, '')
                      .replace(/[\u200B-\u200D\uFEFF]/g, '')
                      .replace(/\s+/g, '')
                      .trim() || null;

                    if (qrData.imagemQrcode) {
                      qrCodeBase64 = String(qrData.imagemQrcode).trim().startsWith('data:')
                        ? String(qrData.imagemQrcode).trim()
                        : `data:image/png;base64,${String(qrData.imagemQrcode).trim()}`;
                    }
                    console.log(`✅ QR Code EFI: len=${pixCopiaECola?.length}`);
                  } else {
                    const errText = await qrResponse.text().catch(() => '');
                    console.log('⚠️ Erro QR Code:', errText);
                  }
                }

                // Fallback
                if (!pixCopiaECola && cobData.pixCopiaECola) {
                  pixCopiaECola = cobData.pixCopiaECola;
                }
              } else {
                console.error('❌ Erro criar cobrança EFI:', cobData);
              }
            } else {
              console.error('❌ Falha auth EFI:', authData);
            }

            httpClient.close();
          }
        }
      } catch (efiErr) {
        console.error('⚠️ Erro EFI (não-fatal):', efiErr);
      }

      // Enviar instrução de pagamento (o botão nativo já tem "Copiar código Pix")
      await fetch(`${apiUrl}/send/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'token': token },
        body: JSON.stringify({
          number: phoneNumber,
          text: `✅ *Pagamento de ${formattedAmount}*\n\n` +
            `Para pagar, clique em *"Copiar código Pix"* na mensagem acima e abra o app do seu banco:\n\n` +
            `1️⃣ Abra seu banco\n` +
            `2️⃣ Vá em *Pix* → *Copia e Cola*\n` +
            `3️⃣ Cole o código e confirme o pagamento\n\n` +
            `_O código expira em ${Math.round(expirationSeconds / 60)} minutos._`,
        }),
      }).then(r => r.text());
    }

    // ========== 4. Persistir mensagem no chat ==========
    const now = new Date().toISOString();
    const messageContent = pixCopiaECola || `Cobrança PIX ${formattedAmount}`;

    await supabase.from('master_whatsapp_chat_messages').insert({
      config_id: masterConfig.id,
      remote_jid: remoteJid,
      phone_number: phoneNumber,
      direction: 'outgoing',
      sender_name: 'Admin',
      content: messageContent,
      message_type: 'payment_request',
      is_from_bot: false,
      is_read_by_admin: true,
      timestamp: now,
      evolution_message_id: paymentMessageId || null,
      metadata: {
        amount: Number(amount),
        pix_key: pixKey,
        pix_type: pixType,
        pix_copia_e_cola: pixCopiaECola,
        txid: efiTxid,
        description: description,
        generate_efi: generateEfiPix,
      },
      message_source: 'admin_chat',
    });

    // Atualizar conversa
    await supabase
      .from('master_whatsapp_conversations')
      .upsert({
        config_id: masterConfig.id,
        remote_jid: remoteJid,
        phone_number: phoneNumber,
        last_message: `💰 Cobrança PIX: ${formattedAmount}`,
        last_message_at: now,
        last_message_direction: 'outgoing',
        last_message_source: 'admin_chat',
        status: 'active',
      }, {
        onConflict: 'config_id,remote_jid',
      });

    // Pausar bot
    await supabase
      .from('master_whatsapp_sessions')
      .update({
        bot_paused: true,
        paused_at: now,
        paused_reason: 'admin_pix_payment',
      })
      .eq('config_id', masterConfig.id)
      .eq('phone_number', phoneNumber)
      .eq('bot_paused', false);

    console.log('✅ Tudo concluído!');

    return new Response(JSON.stringify({
      success: true,
      txid: efiTxid,
      pixCopiaECola,
      amount: formattedAmount,
      paymentMessageId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[master-pix-send] Erro:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Erro interno',
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
