import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendExternalReceiptWhatsAppRequest {
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
    const { invoice_id, phone_number, custom_message }: SendExternalReceiptWhatsAppRequest = await req.json();

    if (!invoice_id || !phone_number) {
      return new Response(
        JSON.stringify({ error: 'invoice_id e phone_number são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📱 Enviando recibo da fatura externa ${invoice_id} para ${phone_number}`);

    // Buscar dados da fatura externa
    const { data: invoice, error: invoiceError } = await supabase
      .from('external_invoices')
      .select(`
        id,
        amount,
        description,
        due_date,
        paid_at,
        payment_status,
        invoice_number,
        external_clients (
          id,
          name,
          phone,
          email
        ),
        external_services (
          id,
          name
        )
      `)
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      console.error('❌ Fatura externa não encontrada:', invoiceError);
      return new Response(
        JSON.stringify({ error: 'Fatura externa não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se a fatura está paga
    if (invoice.payment_status !== 'paid') {
      console.error('❌ Fatura não está paga:', invoice.payment_status);
      return new Response(
        JSON.stringify({ error: 'Apenas faturas pagas podem ter o recibo enviado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
    const client = invoice.external_clients as any;
    const service = invoice.external_services as any;
    
    const clientName = client?.name || 'Cliente';
    const serviceName = service?.name || invoice.description || 'Serviço';
    const amount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.amount);
    const paidDate = invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString('pt-BR') : 'N/A';
    const invoiceNumber = invoice.invoice_number || invoice.id.slice(0, 8).toUpperCase();
    
    // Gerar link do recibo
    const baseUrl = Deno.env.get('SITE_URL') || 'https://mostralo.com.br';
    const receiptLink = `${baseUrl}/external-receipt/${invoice.id}`;

    // Montar mensagem de recibo
    const message = custom_message || `✅ *Recibo de Pagamento - Mostralo*

Pagamento confirmado! 🎉

📄 *Recibo:* #${invoiceNumber}
👤 *Cliente:* ${clientName}
📋 *Serviço:* ${serviceName}
💰 *Valor:* ${amount}
📅 *Pago em:* ${paidDate}

📄 *Ver recibo completo:*
${receiptLink}

Obrigado pela confiança!`;

    // Normalizar telefone para WhatsApp
    let normalizedPhone = phone_number.replace(/\D/g, '');
    if (!normalizedPhone.startsWith('55')) {
      normalizedPhone = '55' + normalizedPhone;
    }

    console.log(`📤 Enviando recibo via Evolution API para ${normalizedPhone}`);

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

    console.log('✅ Recibo enviado com sucesso:', responseData);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Recibo enviado por WhatsApp com sucesso!',
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
