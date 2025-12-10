import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Iniciando processamento da fila de mensagens...');

    // Buscar mensagens pendentes (com limite de tentativas)
    const { data: pendingMessages, error: fetchError } = await supabase
      .from('whatsapp_message_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error('❌ Erro ao buscar mensagens:', fetchError);
      throw fetchError;
    }

    console.log(`📬 Mensagens pendentes: ${pendingMessages?.length || 0}`);

    const results = [];

    for (const msg of pendingMessages || []) {
      console.log(`📤 Processando mensagem ${msg.id} (${msg.event_type})...`);

      // Marcar como processando
      await supabase
        .from('whatsapp_message_queue')
        .update({ 
          status: 'processing', 
          attempts: msg.attempts + 1 
        })
        .eq('id', msg.id);

      try {
        // Enviar mensagem via whatsapp-auto-send
        const { data: sendResult, error: sendError } = await supabase.functions.invoke('whatsapp-auto-send', {
          body: {
            storeId: msg.store_id,
            eventType: msg.event_type,
            orderId: msg.order_id,
            phoneNumber: msg.phone_number,
            customerName: msg.customer_name
          }
        });

        if (sendError) {
          throw sendError;
        }

        // Verificar se foi realmente enviado ou apenas ignorado (desabilitado)
        const wasActuallySent = sendResult?.success && !sendResult?.skipped;

        // Atualizar status para enviado
        await supabase
          .from('whatsapp_message_queue')
          .update({ 
            status: wasActuallySent ? 'sent' : 'skipped',
            processed_at: new Date().toISOString(),
            last_error: sendResult?.skipped ? 'Message type disabled' : null
          })
          .eq('id', msg.id);

        console.log(`✅ Mensagem ${msg.id} processada:`, wasActuallySent ? 'enviada' : 'ignorada');
        results.push({ id: msg.id, success: true, sent: wasActuallySent });

      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`❌ Erro ao processar mensagem ${msg.id}:`, errorMessage);

        // Atualizar status para falha (ou manter pendente se ainda tem tentativas)
        const newStatus = msg.attempts + 1 >= 3 ? 'failed' : 'pending';
        
        await supabase
          .from('whatsapp_message_queue')
          .update({ 
            status: newStatus,
            last_error: errorMessage,
            processed_at: newStatus === 'failed' ? new Date().toISOString() : null
          })
          .eq('id', msg.id);

        results.push({ id: msg.id, success: false, error: errorMessage });
      }
    }

    console.log(`🏁 Processamento concluído. Resultados:`, results);

    return new Response(JSON.stringify({ 
      success: true, 
      processed: results.length,
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Queue processing error:', errorMessage);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
