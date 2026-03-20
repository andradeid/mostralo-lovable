import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    } = body;

    if (!remoteJid || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'remoteJid e amount são obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const phoneNumber = remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '');
    const valorFormatado = parseFloat(amount).toFixed(2);
    const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(amount));

    console.log(`💰 [master-pix-send] Gerando PIX EFI: ${formattedAmount} para ${phoneNumber}`);

    // ========== 1. Buscar config EFI ==========
    const { data: config, error: configError } = await supabase
      .from('subscription_payment_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      return new Response(JSON.stringify({ error: 'Configuração EFI não encontrada' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const environment = config.efi_environment || 'sandbox';
    const isProd = environment === 'production';
    const clientId = isProd ? config.efi_client_id_production : config.efi_client_id;
    const clientSecret = isProd ? config.efi_client_secret_production : config.efi_client_secret;
    const certificatePem = isProd ? config.efi_certificate_pem_production : config.efi_certificate_pem;
    const pixKey = config.efi_pix_key;

    if (!clientId || !clientSecret || !certificatePem || !pixKey) {
      return new Response(JSON.stringify({ error: `Credenciais EFI incompletas para ambiente ${environment}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { cert, key } = parsePemContent(certificatePem);
    if (!cert || !key) {
      return new Response(JSON.stringify({ error: 'Certificado PEM inválido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const baseUrl = isProd
      ? 'https://pix.api.efipay.com.br'
      : 'https://pix-h.api.efipay.com.br';

    console.log(`🌐 Ambiente EFI: ${environment}`);

    // ========== 2. Autenticar na EFI ==========
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
    if (!authResponse.ok || !authData.access_token) {
      httpClient.close();
      console.error('❌ Falha auth EFI:', authData);
      return new Response(JSON.stringify({ error: 'Falha na autenticação EFI' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Autenticado na EFI');

    // ========== 3. Criar cobrança PIX ==========
    const txid = generateTxId();
    const descricaoCobranca = description || `Cobrança Mostralo - ${contactName || phoneNumber}`;

    const cobPayload = {
      calendario: { expiracao: expirationSeconds },
      valor: { original: valorFormatado },
      chave: pixKey,
      solicitacaoPagador: descricaoCobranca.substring(0, 140),
    };

    console.log(`📤 Criando cobrança PIX (txid: ${txid})...`);

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
      console.error('❌ Erro criar cobrança:', cobData);
      return new Response(JSON.stringify({
        error: cobData.mensagem || 'Erro ao criar cobrança PIX',
        details: cobData,
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Cobrança PIX criada!');

    // ========== 4. Buscar QR Code ==========
    const locationId = cobData.loc?.id;
    let pixCopiaECola: string | null = null;
    let qrCodeBase64: string | null = null;

    if (locationId) {
      const qrResponse = await fetch(`${baseUrl}/v2/loc/${locationId}/qrcode`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authData.access_token}` },
        client: httpClient,
      });

      if (qrResponse.ok) {
        const qrData = await qrResponse.json();
        // SEMPRE preferir qrData.qrcode — é o código definitivo que o QR image codifica
        pixCopiaECola = qrData.qrcode || null;
        if (qrData.imagemQrcode) {
          qrCodeBase64 = String(qrData.imagemQrcode).trim().startsWith('data:')
            ? String(qrData.imagemQrcode).trim()
            : `data:image/png;base64,${String(qrData.imagemQrcode).trim()}`;
        }
        console.log('✅ QR Code gerado!');
        console.log(`📋 Fonte do pixCopiaECola: qrData.qrcode (${pixCopiaECola?.substring(0, 40)}...)`);
      } else {
        const errText = await qrResponse.text().catch(() => '');
        console.log('⚠️ Erro QR Code:', errText);
      }
    }

    // Fallback para cobData.pixCopiaECola somente se QR endpoint falhou
    if (!pixCopiaECola && cobData.pixCopiaECola) {
      pixCopiaECola = cobData.pixCopiaECola;
      console.log('⚠️ Usando pixCopiaECola do cobData (fallback)');
    }

    httpClient.close();

    if (!pixCopiaECola) {
      return new Response(JSON.stringify({ error: 'PIX Copia e Cola não gerado pela EFI' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📋 PIX Copia e Cola gerado com sucesso');

    // ========== 5. Enviar via WhatsApp (UaZapi) ==========
    const { data: masterConfig } = await supabase
      .from('master_whatsapp_config')
      .select('id, instance_name, evolution_instance_id, instance_phone')
      .eq('admin_user_id', user.id)
      .single();

    if (!masterConfig?.evolution_instance_id) {
      return new Response(JSON.stringify({
        error: 'Instância WhatsApp master não configurada',
        pixCopiaECola,
        txid: cobData.txid,
      }), {
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
      return new Response(JSON.stringify({
        error: 'UaZapi não configurado',
        pixCopiaECola,
        txid: cobData.txid,
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiUrl = uazapiConfig.api_url.replace(/\/$/, '');
    const token = masterConfig.evolution_instance_id;

    // Enviar mensagem introdutória
    const introMessage = `💰 *Cobrança PIX - ${formattedAmount}*\n\n` +
      `📝 ${descricaoCobranca}\n` +
      `⏱️ Válido por ${Math.round(expirationSeconds / 60)} minutos\n\n` +
      `📋 A próxima mensagem contém o *PIX Copia e Cola* puro para você copiar sem erros.\n\n` +
      `_Se preferir, você também pode pagar pelo QR Code enviado abaixo._`;

    const introResp = await fetch(`${apiUrl}/send/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': token },
      body: JSON.stringify({ number: phoneNumber, text: introMessage }),
    });
    const introRespBody = await introResp.text();

    const textResp = await fetch(`${apiUrl}/send/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': token },
      body: JSON.stringify({ number: phoneNumber, text: pixCopiaECola }),
    });

    const textRespBody = await textResp.text();
    let textEvolutionId: string | null = null;
    try {
      const parsed = JSON.parse(textRespBody);
      textEvolutionId = parsed?.id || parsed?.key?.id || null;
    } catch { /* ignore */ }

    console.log(`📤 Mensagem introdutória enviada: ${introResp.ok ? '✅' : '❌'}`);
    if (!introResp.ok) {
      console.log('⚠️ Falha envio intro:', introRespBody);
    }
    console.log(`📤 Mensagem PIX puro enviada: ${textResp.ok ? '✅' : '❌'}`);

    // Enviar QR Code como documento/imagem sem compressão (se disponível)
    let qrEvolutionId: string | null = null;
    if (qrCodeBase64) {
      const base64Data = qrCodeBase64.replace(/^data:image\/png;base64,/, '');
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const filePath = `master/pix_qr_${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from('whatsapp-chat-media')
        .upload(filePath, binaryData, { contentType: 'image/png', cacheControl: '3600' });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('whatsapp-chat-media')
          .getPublicUrl(filePath);

        const qrResp = await fetch(`${apiUrl}/send/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'token': token },
          body: JSON.stringify({
            number: phoneNumber,
            type: 'document',
            file: urlData.publicUrl,
            text: `QR Code PIX sem compressão - ${formattedAmount}`,
            docName: `pix-${cobData.txid}.png`,
          }),
        });

        const qrRespBody = await qrResp.text();
        try {
          const qrParsed = JSON.parse(qrRespBody);
          qrEvolutionId = qrParsed?.id || qrParsed?.key?.id || null;
        } catch {
          console.log('⚠️ Resposta QR não-JSON:', qrRespBody);
        }

        console.log(`📤 QR Code enviado como documento: ${qrResp.ok ? '✅' : '❌'}`);
        if (!qrResp.ok) {
          console.log('⚠️ Falha envio QR:', qrRespBody);
        }
      } else {
        console.log('⚠️ Erro upload QR:', uploadError);
      }
    }

    // ========== 6. Persistir mensagem no chat ==========
    const now = new Date().toISOString();

    await supabase.from('master_whatsapp_chat_messages').insert({
      config_id: masterConfig.id,
      remote_jid: remoteJid,
      phone_number: phoneNumber,
      direction: 'outgoing',
      sender_name: 'Admin',
      content: pixCopiaECola,
      message_type: 'payment_request',
      is_from_bot: false,
      is_read_by_admin: true,
      timestamp: now,
      evolution_message_id: textEvolutionId || null,
      metadata: {
        amount: Number(amount),
        pix_copia_e_cola: pixCopiaECola,
        txid: cobData.txid,
        efi_environment: environment,
        description: descricaoCobranca,
        expiration_seconds: expirationSeconds,
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
      txid: cobData.txid,
      pixCopiaECola,
      amount: formattedAmount,
      environment,
      messageId: textEvolutionId,
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
