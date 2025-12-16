import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normaliza telefone para busca no banco (remove DDI e variações do 9º dígito)
function normalizePhoneForSearch(phone: string): string[] {
  const digits = phone.replace(/\D/g, '');
  const variants: string[] = [];
  
  // Telefone original
  variants.push(digits);
  
  // Sem DDI 55
  if (digits.startsWith('55')) {
    const withoutDDI = digits.slice(2);
    variants.push(withoutDDI);
    
    // Com/sem 9º dígito (números celulares brasileiros)
    if (withoutDDI.length === 11 && withoutDDI[2] === '9') {
      // Remove 9º dígito: 61999999999 -> 6199999999
      variants.push(withoutDDI.slice(0, 2) + withoutDDI.slice(3));
    } else if (withoutDDI.length === 10) {
      // Adiciona 9º dígito: 6199999999 -> 61999999999
      variants.push(withoutDDI.slice(0, 2) + '9' + withoutDDI.slice(2));
    }
  }
  
  return [...new Set(variants)];
}

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

      // Buscar instância e loja associada (com timezone)
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

      // Buscar timezone da loja
      const { data: storeData } = await supabase
        .from('stores')
        .select('timezone')
        .eq('id', instance.store_id)
        .single();
      
      const timezone = storeData?.timezone || 'America/Sao_Paulo';
      
      // Calcular horário atual no timezone da loja
      const now = new Date();
      let currentTime = '';
      let greeting = 'Olá';
      
      try {
        const formatter = new Intl.DateTimeFormat('pt-BR', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        currentTime = formatter.format(now);
        const hour = parseInt(currentTime.split(':')[0]);
        
        if (hour >= 5 && hour < 12) greeting = 'Bom dia';
        else if (hour >= 12 && hour < 18) greeting = 'Boa tarde';
        else greeting = 'Boa noite';
        
        console.log(`🕐 Horário da loja (${timezone}): ${currentTime} - Saudação: ${greeting}`);
      } catch (e) {
        console.log('⚠️ Erro ao calcular horário:', e);
      }

      console.log(`🏪 Loja encontrada: ${instance.store_id}`);

      // ========== BUSCAR CLIENTE PELO TELEFONE ==========
      const phoneVariants = normalizePhoneForSearch(senderPhone);
      console.log(`🔍 Buscando cliente com variantes: ${phoneVariants.join(', ')}`);

      // Buscar cliente pelo telefone (com variantes)
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id, name, phone')
        .in('phone', phoneVariants)
        .limit(1)
        .maybeSingle();

      let customerStoreData = null;
      let isKnownCustomer = false;

      if (customer) {
        isKnownCustomer = true;
        console.log(`✅ Cliente encontrado: ${customer.name} (ID: ${customer.id})`);

        // Buscar dados específicos da relação com a loja
        const { data: storeRelation, error: storeRelationError } = await supabase
          .from('customer_stores')
          .select('last_order_at, total_orders, total_spent')
          .eq('customer_id', customer.id)
          .eq('store_id', instance.store_id)
          .maybeSingle();

        if (storeRelation) {
          customerStoreData = storeRelation;
          console.log(`📊 Dados do cliente na loja: ${customerStoreData.total_orders} pedidos, R$ ${customerStoreData.total_spent}, último: ${customerStoreData.last_order_at}`);
        } else {
          console.log(`ℹ️ Cliente conhecido, mas sem histórico nesta loja`);
        }
      } else {
        console.log(`👤 Novo visitante (não encontrado no banco)`);
      }

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
        
        // Chamar whatsapp-auto-send para enviar saudação (agora com dados do cliente e horário)
        const { data: sendResult, error: sendError } = await supabase.functions.invoke('whatsapp-auto-send', {
          body: {
            storeId: instance.store_id,
            eventType: 'greeting',
            phoneNumber: senderPhone,
            customerName: customer?.name || senderName,
            // NOVOS DADOS para saudação inteligente:
            isKnownCustomer: isKnownCustomer,
            customerData: customerStoreData ? {
              lastOrderAt: customerStoreData.last_order_at,
              totalOrders: customerStoreData.total_orders,
              totalSpent: customerStoreData.total_spent
            } : null,
            // CONTEXTO DE HORÁRIO para o bot
            timeContext: {
              currentTime,
              greeting,
              timezone
            }
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
        isKnownCustomer,
        senderPhone,
        senderName: customer?.name || senderName
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
