import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting monthly invoice generation...');

    // Buscar lojas com plano ativo
    const { data: stores, error: storesError } = await supabaseClient
      .from('stores')
      .select(`
        id,
        name,
        plan_id,
        subscription_expires_at,
        custom_monthly_price,
        billing_contact_phone,
        billing_contact_name,
        plans (
          price,
          billing_cycle
        )
      `)
      .not('plan_id', 'is', null)
      .eq('status', 'active');

    if (storesError) {
      console.error('Error fetching stores:', storesError);
      throw storesError;
    }

    if (!stores || stores.length === 0) {
      console.log('No active stores found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          invoicesCreated: 0,
          message: 'No active stores to generate invoices for' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log(`Found ${stores.length} active stores`);
    let created = 0;
    let whatsappSent = 0;

    // Buscar config WhatsApp Master e UaZapi para envio automático
    const { data: masterConfig } = await supabaseClient
      .from('master_whatsapp_config')
      .select('id, instance_name, evolution_instance_id, instance_phone, admin_user_id')
      .eq('instance_status', 'connected')
      .limit(1)
      .single();

    const { data: uazapiConfig } = await supabaseClient
      .from('uazapi_config')
      .select('api_url')
      .order('is_active', { ascending: false })
      .limit(1)
      .single();

    const { data: paymentConfig } = await supabaseClient
      .from('subscription_payment_config')
      .select('efi_pix_key, efi_pix_key_name')
      .eq('is_active', true)
      .single();

    const canSendWhatsApp = masterConfig?.evolution_instance_id && uazapiConfig?.api_url;
    const apiUrl = uazapiConfig?.api_url?.replace(/\/$/, '') || '';
    const whatsappToken = masterConfig?.evolution_instance_id || '';
    const pixKey = paymentConfig?.efi_pix_key || '';
    const pixName = paymentConfig?.efi_pix_key_name || 'Mostralo';

    if (canSendWhatsApp) {
      console.log('✅ WhatsApp Master conectado - envio automático habilitado');
    } else {
      console.log('⚠️ WhatsApp Master não conectado - apenas criação de faturas');
    }

    for (const store of stores) {
      if (!store.subscription_expires_at) {
        console.log(`Store ${store.id} has no expiration date, skipping`);
        continue;
      }

      // Verificar se já existe invoice para essa data
      const { data: existingInvoice } = await supabaseClient
        .from('subscription_invoices')
        .select('id')
        .eq('store_id', store.id)
        .eq('due_date', store.subscription_expires_at)
        .single();

      if (!existingInvoice) {
        // Criar nova invoice com o valor efetivo (customizado ou do plano)
        const planPrice = Array.isArray(store.plans) ? store.plans[0]?.price : (store.plans as any)?.price;
        const effectiveAmount = store.custom_monthly_price 
          ? Number(store.custom_monthly_price) 
          : Number(planPrice || 0);
        
        // Gerar public_token para link permanente
        const publicToken = generateToken();
        
        const { data: newInvoice, error: insertError } = await supabaseClient
          .from('subscription_invoices')
          .insert({
            store_id: store.id,
            plan_id: store.plan_id,
            amount: effectiveAmount,
            due_date: store.subscription_expires_at,
            payment_status: 'pending',
            public_token: publicToken,
            description: `Assinatura Mostralo - ${store.name}`,
            contact_phone: store.billing_contact_phone || null,
            contact_name: store.billing_contact_name || null,
          })
          .select('id, public_token')
          .single();

        if (insertError) {
          console.error(`Error creating invoice for store ${store.id}:`, insertError);
        } else {
          console.log(`Created invoice for store ${store.id} (token: ${publicToken})`);
          created++;

          // Enviar cobrança automática via WhatsApp se possível
          if (canSendWhatsApp && store.billing_contact_phone && newInvoice) {
            try {
              let normalizedPhone = store.billing_contact_phone.replace(/\D/g, '');
              if (!normalizedPhone.startsWith('55')) {
                normalizedPhone = '55' + normalizedPhone;
              }

              const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(effectiveAmount);
              const firstName = store.billing_contact_name?.split(' ')[0] || 'Cliente';
              const paymentUrl = `https://mostralo-lovable.lovable.app/pagar/${publicToken}`;

              // Enviar botão de pagamento PIX nativo
              if (pixKey) {
                const requestPaymentBody = {
                  number: normalizedPhone,
                  amount: effectiveAmount,
                  pixKey: pixKey,
                  pixType: 'EVP',
                  pixName: pixName,
                  title: `Assinatura ${store.name || 'Mostralo'}`,
                  text: `Pagamento referente à assinatura da plataforma Mostralo`,
                  footer: 'Mostralo - Sua loja digital',
                  itemName: `Assinatura - ${store.name}`,
                };

                const paymentResp = await fetch(`${apiUrl}/send/request-payment`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'token': whatsappToken },
                  body: JSON.stringify(requestPaymentBody),
                });
                console.log(`📤 request-payment store ${store.id}: ${paymentResp.ok ? '✅' : '❌'}`);
                await paymentResp.text();
              }

              // Enviar mensagem com link permanente
              const instructionText = `✅ *Cobrança de Assinatura - ${store.name}*\n\n` +
                `Olá ${firstName}! 👋\n\n` +
                `Segue a cobrança da assinatura no valor de *${formattedAmount}*.\n\n` +
                `📅 Vencimento: *${new Date(store.subscription_expires_at!).toLocaleDateString('pt-BR')}*\n\n` +
                `🔗 *Pague pelo link abaixo:*\n${paymentUrl}\n\n` +
                `O link é permanente — você pode acessar quando quiser.\n` +
                `Se o código PIX expirar, basta abrir o link novamente que um novo será gerado automaticamente! 🔄\n\n` +
                `_Ou, se preferir, use o botão "Revisar e Pagar" acima._`;

              await fetch(`${apiUrl}/send/text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'token': whatsappToken },
                body: JSON.stringify({ number: normalizedPhone, text: instructionText }),
              });

              // Persistir no chat master
              const remoteJid = `${normalizedPhone}@s.whatsapp.net`;
              const now = new Date().toISOString();

              await supabaseClient.from('master_whatsapp_chat_messages').insert({
                config_id: masterConfig!.id,
                remote_jid: remoteJid,
                phone_number: normalizedPhone,
                direction: 'outgoing',
                sender_name: 'Sistema',
                content: `[Auto] Cobrança Assinatura ${formattedAmount} - Link: ${paymentUrl}`,
                message_type: 'payment_request',
                is_from_bot: true,
                is_read_by_admin: true,
                timestamp: now,
                metadata: {
                  amount: effectiveAmount,
                  pix_key: pixKey,
                  invoice_id: newInvoice.id,
                  payment_url: paymentUrl,
                  store_id: store.id,
                  store_name: store.name,
                  type: 'auto_subscription_charge',
                },
                message_source: 'system',
              });

              await supabaseClient
                .from('master_whatsapp_conversations')
                .upsert({
                  config_id: masterConfig!.id,
                  remote_jid: remoteJid,
                  phone_number: normalizedPhone,
                  last_message: `💰 [Auto] Cobrança: ${formattedAmount}`,
                  last_message_at: now,
                  last_message_direction: 'outgoing',
                  last_message_source: 'system',
                  status: 'active',
                }, {
                  onConflict: 'config_id,remote_jid',
                });

              whatsappSent++;
              console.log(`📱 WhatsApp enviado para store ${store.id} (${normalizedPhone})`);
            } catch (whatsappError) {
              console.error(`⚠️ Erro ao enviar WhatsApp para store ${store.id}:`, whatsappError);
              // Não falha a geração da fatura por erro de WhatsApp
            }
          }
        }
      } else {
        console.log(`Invoice already exists for store ${store.id}`);
      }
    }

    console.log(`Invoice generation completed. Created: ${created}, WhatsApp sent: ${whatsappSent}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        invoicesCreated: created,
        whatsappSent: whatsappSent,
        totalStores: stores.length,
        message: `${created} invoices created, ${whatsappSent} WhatsApp charges sent` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in generate-monthly-invoices:', error);
    return new Response(
      JSON.stringify({ 
        error: (error as Error).message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
