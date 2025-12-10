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

    const body = await req.json();
    
    console.log('📥 Webhook received:', JSON.stringify(body, null, 2));

    // Evento: Nova mensagem recebida
    if (body.event === 'messages.upsert') {
      const message = body.data;
      const instanceName = body.instance;
      
      // Ignorar mensagens enviadas por nós
      if (message.key?.fromMe) {
        console.log('📤 Mensagem enviada por nós, ignorando');
        return new Response(JSON.stringify({ success: true, ignored: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Extrair telefone do remetente
      const remoteJid = message.key?.remoteJid || '';
      const senderPhone = remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '');
      const senderName = message.pushName || 'Cliente';
      
      console.log(`📱 Mensagem de: ${senderPhone} (${senderName})`);

      // Buscar instância e loja associada
      const { data: instance, error: instanceError } = await supabase
        .from('whatsapp_instances')
        .select('store_id, id')
        .eq('instance_name', instanceName)
        .eq('status', 'connected')
        .single();

      if (instanceError || !instance) {
        console.log('❌ Instância não encontrada ou não conectada:', instanceName);
        return new Response(JSON.stringify({ success: false, error: 'Instance not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`🏪 Loja encontrada: ${instance.store_id}`);

      // Verificar se já enviamos mensagem para este número (evitar saudação repetida)
      const { count, error: countError } = await supabase
        .from('whatsapp_messages')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', instance.store_id)
        .eq('phone_number', senderPhone)
        .eq('direction', 'outgoing');

      if (countError) {
        console.log('⚠️ Erro ao verificar histórico:', countError);
      }

      console.log(`📊 Mensagens anteriores enviadas para este número: ${count || 0}`);

      // Se é primeiro contato (não enviamos mensagens antes), disparar saudação
      if (count === 0 || count === null) {
        console.log('👋 Primeiro contato! Disparando saudação automática...');
        
        // Chamar whatsapp-auto-send para enviar saudação
        const { data: sendResult, error: sendError } = await supabase.functions.invoke('whatsapp-auto-send', {
          body: {
            storeId: instance.store_id,
            eventType: 'greeting',
            phoneNumber: senderPhone,
            customerName: senderName
          }
        });

        if (sendError) {
          console.log('❌ Erro ao enviar saudação:', sendError);
        } else {
          console.log('✅ Saudação enviada:', sendResult);
        }
      } else {
        console.log('ℹ️ Contato existente, saudação não necessária');
      }

      return new Response(JSON.stringify({ 
        success: true, 
        isNewContact: count === 0 || count === null,
        senderPhone,
        senderName
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Outros eventos podem ser processados aqui futuramente
    console.log('ℹ️ Evento não processado:', body.event);
    
    return new Response(JSON.stringify({ success: true, event: body.event }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Webhook error:', errorMessage);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
