import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendPaymentNotificationRequest {
  store_id: string;
  invoice_id?: string;
  amount: number;
  expiration_date: string;
  type: 'payment_confirmed' | 'subscription_activated';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse do body
    const { store_id, invoice_id, amount, expiration_date, type }: SendPaymentNotificationRequest = await req.json();

    if (!store_id || !amount || !expiration_date) {
      return new Response(
        JSON.stringify({ error: 'store_id, amount e expiration_date são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📱 Enviando notificação de ${type} para loja ${store_id}`);

    // Buscar dados da loja e do dono
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select(`
        id,
        name,
        owner_id,
        profiles:owner_id (
          full_name,
          phone
        )
      `)
      .eq('id', store_id)
      .single();

    if (storeError || !store) {
      console.error('❌ Loja não encontrada:', storeError);
      return new Response(
        JSON.stringify({ error: 'Loja não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const profile = store.profiles as any;
    const ownerPhone = profile?.phone;

    if (!ownerPhone) {
      console.log('⚠️ Dono da loja não tem telefone cadastrado');
      return new Response(
        JSON.stringify({ error: 'Telefone do dono não encontrado', skipped: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar configuração do Evolution API
    const { data: evolutionConfig, error: evolutionError } = await supabase
      .from('evolution_config')
      .select('api_url, api_key')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (evolutionError || !evolutionConfig) {
      console.error('❌ Evolution API não configurada:', evolutionError);
      return new Response(
        JSON.stringify({ error: 'Evolution API não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar configuração do WhatsApp Master
    const { data: masterConfig, error: masterError } = await supabase
      .from('master_whatsapp_config')
      .select('instance_name, instance_status')
      .limit(1)
      .single();

    if (masterError || !masterConfig) {
      console.error('❌ WhatsApp Master não configurado:', masterError);
      return new Response(
        JSON.stringify({ error: 'WhatsApp Master não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (masterConfig.instance_status !== 'connected') {
      console.error('❌ WhatsApp Master não está conectado:', masterConfig.instance_status);
      return new Response(
        JSON.stringify({ error: 'WhatsApp Master não está conectado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preparar dados para a mensagem
    const firstName = profile?.full_name?.split(' ')[0] || 'Lojista';
    const storeName = store.name || 'Sua loja';
    const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
    const formattedDate = new Date(expiration_date).toLocaleDateString('pt-BR');

    // Gerar link do recibo se tiver invoice_id
    const appUrl = 'https://mostralo.lovable.app';
    const receiptLink = invoice_id ? `${appUrl}/receipt/${invoice_id}` : null;

    // Montar mensagem de confirmação
    let message = `✅ *Pagamento Confirmado!* 🎉

Olá ${firstName}!

Seu pagamento de *${formattedAmount}* para a loja "*${storeName}*" foi recebido com sucesso!

📅 *Sua assinatura está ativa até:* ${formattedDate}`;

    // Adicionar link do recibo se disponível
    if (receiptLink) {
      message += `

🧾 *Acesse seu recibo:*
${receiptLink}`;
    }

    message += `

Obrigado por usar o Mostralo! 🚀

Dúvidas? Responda esta mensagem.`;

    // Normalizar telefone para WhatsApp
    let normalizedPhone = ownerPhone.replace(/\D/g, '');
    if (!normalizedPhone.startsWith('55')) {
      normalizedPhone = '55' + normalizedPhone;
    }

    console.log(`📤 Enviando mensagem de confirmação para ${normalizedPhone}`);

    // Enviar via Evolution API
    const evolutionUrl = `${evolutionConfig.api_url}/message/sendText/${masterConfig.instance_name}`;
    
    const response = await fetch(evolutionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionConfig.api_key,
      },
      body: JSON.stringify({
        number: normalizedPhone,
        text: message,
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ Erro ao enviar mensagem:', responseData);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao enviar mensagem via WhatsApp',
          details: responseData 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Notificação de pagamento enviada com sucesso:', responseData);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Notificação de pagamento enviada por WhatsApp!',
        phone: normalizedPhone,
        store_id: store.id,
        evolution_response: responseData
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro interno:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
