import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendInvoiceWhatsAppRequest {
  invoice_id: string;
  phone_number: string;
  custom_message?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se é master_admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'master_admin')
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Apenas master_admin pode enviar mensagens' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse do body
    const { invoice_id, phone_number, custom_message }: SendInvoiceWhatsAppRequest = await req.json();

    if (!invoice_id || !phone_number) {
      return new Response(
        JSON.stringify({ error: 'invoice_id e phone_number são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📱 Enviando link da fatura ${invoice_id} para ${phone_number}`);

    // Buscar dados da fatura
    const { data: invoice, error: invoiceError } = await supabase
      .from('subscription_invoices')
      .select(`
        id,
        amount,
        due_date,
        payment_status,
        stores (
          id,
          name,
          owner_id,
          profiles:owner_id (
            full_name,
            phone
          )
        ),
        plans (
          name
        )
      `)
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      console.error('❌ Fatura não encontrada:', invoiceError);
      return new Response(
        JSON.stringify({ error: 'Fatura não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        JSON.stringify({ error: 'WhatsApp Master não está conectado. Conecte primeiro.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preparar dados para a mensagem
    const store = invoice.stores as any;
    const profile = store?.profiles;
    const plan = invoice.plans as any;
    
    const firstName = profile?.full_name?.split(' ')[0] || 'Lojista';
    const storeName = store?.name || 'Sua loja';
    const planName = plan?.name || 'Plano';
    const amount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.amount);
    const dueDate = new Date(invoice.due_date).toLocaleDateString('pt-BR');
    
    // Gerar link de pagamento
    const baseUrl = Deno.env.get('SITE_URL') || 'https://mostralo.com.br';
    const paymentLink = `${baseUrl}/invoice-payment/${invoice.id}`;

    // Montar mensagem
    const message = custom_message || `Olá ${firstName}! 👋

Sua fatura do Mostralo está disponível:

🏪 *Loja:* ${storeName}
📋 *Plano:* ${planName}
💰 *Valor:* ${amount}
📅 *Vencimento:* ${dueDate}

💳 *Pague agora pelo link:*
${paymentLink}

O QR Code PIX será gerado automaticamente quando você acessar! 🚀

Dúvidas? Responda esta mensagem.`;

    // Normalizar telefone para WhatsApp
    let normalizedPhone = phone_number.replace(/\D/g, '');
    if (!normalizedPhone.startsWith('55')) {
      normalizedPhone = '55' + normalizedPhone;
    }

    console.log(`📤 Enviando mensagem via Evolution API para ${normalizedPhone}`);

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

    console.log('✅ Mensagem enviada com sucesso:', responseData);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Link de pagamento enviado por WhatsApp com sucesso!',
        phone: normalizedPhone,
        invoice_id: invoice.id,
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
