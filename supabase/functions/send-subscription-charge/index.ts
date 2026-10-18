import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function sanitizeStoreName(storeName?: string | null): string {
  const normalizedName = storeName?.trim().replace(/\s+/g, ' ');
  return normalizedName && normalizedName.length > 0 ? normalizedName : 'Mostralo';
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

    // 1. Reaproveitar fatura em aberto (pending/overdue) ou criar nova
    const { data: openInvoice } = await supabase
      .from('subscription_invoices')
      .select('id, public_token, amount, due_date')
      .eq('store_id', store_id)
      .in('payment_status', ['pending', 'overdue'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let invoiceId: string;
    let publicToken: string;
    let invoiceAmount: number;
    let invoiceDueDate: string; // YYYY-MM-DD (data pura, fuso de Brasília)
    let reused = false;

    if (openInvoice) {
      // Já existe fatura em aberto: reenviar o link dela, sem duplicar
      invoiceId = openInvoice.id;
      publicToken = openInvoice.public_token;
      invoiceAmount = Number(openInvoice.amount);
      invoiceDueDate = openInvoice.due_date;
      reused = true;
      console.log(`♻️ Fatura em aberto reaproveitada: ${invoiceId} (venc. ${invoiceDueDate})`);
    } else {
      publicToken = generateToken();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // Vencimento em 7 dias
      // Data de Brasília (America/Sao_Paulo), não UTC
      invoiceDueDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(dueDate);
      invoiceAmount = Number(amount);

      const { data: invoice, error: invoiceError } = await supabase
        .from('subscription_invoices')
        .insert({
          store_id,
          plan_id: store.plan_id,
          amount: invoiceAmount,
          due_date: invoiceDueDate,
          payment_status: 'pending',
          description: description || `Assinatura Mostralo - ${store.name}`,
          contact_phone: normalizedPhone,
          contact_name: contact_name || null,
          public_token: publicToken,
        })
        .select('id, public_token')
        .single();

      if (invoiceError || !invoice) {
        console.error('❌ Erro ao criar fatura:', invoiceError);
        return new Response(JSON.stringify({ error: 'Erro ao criar fatura' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      invoiceId = invoice.id;
      console.log(`📄 Fatura criada: ${invoiceId} (token: ${publicToken})`);
    }

    const formattedInvoiceAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoiceAmount);
    // Formatar vencimento como data pura em America/Sao_Paulo
    const [dueYear, dueMonth, dueDay] = invoiceDueDate.split('-');
    const formattedDueDate = `${dueDay}/${dueMonth}/${dueYear}`;

    // 2. Gerar URL pública de pagamento
    const paymentUrl = `https://mostralo.com.br/pagar/${publicToken}`;

    // Buscar config PIX
    const { data: paymentConfig } = await supabase
      .from('subscription_payment_config')
      .select('efi_pix_key, account_holder_name')
      .eq('is_active', true)
      .single();

    const pixKey = paymentConfig?.efi_pix_key || '';
    const pixName = paymentConfig?.account_holder_name || 'Mostralo';
    const sanitizedStoreName = sanitizeStoreName(store.name);

    // === ORDEM: 1) Mensagem de cobrança → 2) PIX request-payment → 3) Mensagem com link ===

    // PASSO 1: Enviar mensagem de cobrança (texto)
    const chargeText = `✅ *Cobrança de Assinatura - ${sanitizedStoreName}*\n\n` +
      `Olá ${firstName}! 👋\n\n` +
      `Segue a cobrança da assinatura no valor de *${formattedInvoiceAmount}*.\n\n` +
      `📅 Vencimento: ${formattedDueDate}\n\n` +
      `Veja abaixo as opções de pagamento:`;

    console.log('📤 [1/3] Enviando mensagem de cobrança...');
    const chargeResp = await fetch(`${apiUrl}/send/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': token },
      body: JSON.stringify({ number: normalizedPhone, text: chargeText }),
    });
    console.log(`📤 [1/3] Mensagem de cobrança: ${chargeResp.ok ? '✅' : '❌'} status=${chargeResp.status}`);
    await chargeResp.text();

    // Pequena pausa para garantir ordem no WhatsApp
    await new Promise(r => setTimeout(r, 1500));

    // PASSO 2: Enviar botão nativo /send/request-payment (WhatsApp Pay / PIX)
    if (pixKey) {
      const requestPaymentBody = {
        number: normalizedPhone,
        amount: invoiceAmount,
        pixKey: pixKey,
        pixType: 'EVP',
        pixName: pixName,
        title: `Assinatura ${sanitizedStoreName}`,
        text: `Pagamento referente à assinatura da plataforma Mostralo`,
        footer: 'Mostralo - Sua loja digital',
        itemName: `Assinatura - ${sanitizedStoreName}`,
      };

      console.log('📤 [2/3] Enviando /send/request-payment (PIX)...');
      const paymentResp = await fetch(`${apiUrl}/send/request-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'token': token },
        body: JSON.stringify(requestPaymentBody),
      });
      const paymentRespBody = await paymentResp.text();
      console.log(`📤 [2/3] /send/request-payment: ${paymentResp.ok ? '✅' : '❌'} status=${paymentResp.status} body=${paymentRespBody}`);

      // Pausa para garantir ordem
      await new Promise(r => setTimeout(r, 1500));
    } else {
      console.log('⚠️ [2/3] PIX key não configurada, pulando request-payment');
    }

    // PASSO 3: Enviar mensagem com link de pagamento
    const linkText = `🔗 *Pague pelo link abaixo:*\n${paymentUrl}\n\n` +
      `O link é permanente — você pode acessar quando quiser.\n` +
      `Se o código PIX expirar, basta abrir o link novamente que um novo será gerado automaticamente! 🔄\n\n` +
      `_Ou, se preferir, use o botão "Revisar e Pagar" acima._`;

    console.log('📤 [3/3] Enviando mensagem com link...');
    const linkResp = await fetch(`${apiUrl}/send/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': token },
      body: JSON.stringify({ number: normalizedPhone, text: linkText }),
    });
    console.log(`📤 [3/3] Mensagem com link: ${linkResp.ok ? '✅' : '❌'} status=${linkResp.status}`);
    await linkResp.text();

    // 5. Persistir no chat master
    const remoteJid = `${normalizedPhone}@s.whatsapp.net`;
    const now = new Date().toISOString();

    await supabase.from('master_whatsapp_chat_messages').insert({
      config_id: masterConfig.id,
      remote_jid: remoteJid,
      phone_number: normalizedPhone,
      direction: 'outgoing',
      sender_name: 'Admin',
      content: `Cobrança Assinatura ${formattedAmount} - Link: ${paymentUrl}`,
      message_type: 'payment_request',
      is_from_bot: false,
      is_read_by_admin: true,
      timestamp: now,
      metadata: {
        amount: Number(amount),
        pix_key: pixKey,
        invoice_id: invoice.id,
        payment_url: paymentUrl,
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

    console.log('✅ Cobrança de assinatura enviada com sucesso (com link permanente)!');

    return new Response(JSON.stringify({
      success: true,
      invoice_id: invoice.id,
      payment_url: paymentUrl,
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
