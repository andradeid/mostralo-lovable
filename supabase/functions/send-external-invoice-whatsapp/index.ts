import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is master_admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.user_type !== 'master_admin') {
      console.error('User is not master_admin:', profile?.user_type);
      return new Response(
        JSON.stringify({ error: 'Permissão negada. Apenas administradores podem enviar mensagens.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { invoice_id, phone_number, custom_message }: SendInvoiceWhatsAppRequest = await req.json();

    if (!invoice_id || !phone_number) {
      console.error('Missing required fields:', { invoice_id, phone_number });
      return new Response(
        JSON.stringify({ error: 'invoice_id e phone_number são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching invoice:', invoice_id);

    // Fetch invoice with client and service
    const { data: invoice, error: invoiceError } = await supabase
      .from('external_invoices')
      .select(`
        *,
        client:external_clients(*),
        service:external_services(*)
      `)
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      console.error('Invoice not found:', invoiceError);
      return new Response(
        JSON.stringify({ error: 'Fatura não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Invoice found:', invoice.invoice_number);

    // Fetch Evolution config
    const { data: evolutionConfig, error: evolutionError } = await supabase
      .from('evolution_config')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (evolutionError || !evolutionConfig) {
      console.error('Evolution config not found:', evolutionError);
      return new Response(
        JSON.stringify({ error: 'Configuração da Evolution API não encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch WhatsApp Master config
    const { data: whatsappConfig, error: whatsappError } = await supabase
      .from('master_whatsapp_config')
      .select('*')
      .limit(1)
      .single();

    if (whatsappError || !whatsappConfig) {
      console.error('WhatsApp Master config not found:', whatsappError);
      return new Response(
        JSON.stringify({ error: 'Configuração do WhatsApp Master não encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (whatsappConfig.instance_status !== 'connected') {
      console.error('WhatsApp Master not connected:', whatsappConfig.instance_status);
      return new Response(
        JSON.stringify({ error: 'WhatsApp Master não está conectado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build payment link
    const baseUrl = 'https://mostralo-lovable.lovable.app';
    const paymentLink = `${baseUrl}/external-invoice/${invoice.id}`;

    // Format due date
    const dueDate = new Date(invoice.due_date);
    const formattedDueDate = dueDate.toLocaleDateString('pt-BR');

    // Format amount
    const formattedAmount = invoice.amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

    // Build message
    const clientName = invoice.client?.name || 'Cliente';
    const serviceDescription = invoice.service?.name || invoice.description;

    const defaultMessage = `Olá${clientName ? ` ${clientName.split(' ')[0]}` : ''}! 👋

Sua fatura está disponível:

👤 Cliente: ${clientName}
📋 Serviço: ${serviceDescription}
💰 Valor: ${formattedAmount}
📅 Vencimento: ${formattedDueDate}

💳 Pague agora pelo link:
${paymentLink}

O QR Code PIX será gerado automaticamente! 🚀`;

    const messageToSend = custom_message || defaultMessage;

    // Normalize phone number
    let normalizedPhone = phone_number.replace(/\D/g, '');
    if (!normalizedPhone.startsWith('55')) {
      normalizedPhone = '55' + normalizedPhone;
    }

    console.log('Sending message to:', normalizedPhone);

    // Send via Evolution API
    const evolutionUrl = `${evolutionConfig.api_url}/message/sendText/${whatsappConfig.instance_name}`;
    
    const evolutionResponse = await fetch(evolutionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionConfig.api_key,
      },
      body: JSON.stringify({
        number: normalizedPhone,
        text: messageToSend,
      }),
    });

    const evolutionResult = await evolutionResponse.json();

    if (!evolutionResponse.ok) {
      console.error('Evolution API error:', evolutionResult);
      return new Response(
        JSON.stringify({ error: 'Erro ao enviar mensagem via WhatsApp', details: evolutionResult }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Message sent successfully:', evolutionResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Link de pagamento enviado com sucesso!',
        messageId: evolutionResult.key?.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Internal server error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
