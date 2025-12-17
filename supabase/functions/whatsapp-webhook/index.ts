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

// ========== VERIFICAÇÃO DE STATUS DA LOJA EM TEMPO REAL ==========
function isStoreOpenNow(businessHours: any, timezone: string): boolean {
  if (!businessHours) return true; // Se não há horário configurado, assume aberto
  
  // Verificar pausa manual
  if (businessHours.is_paused) return false;
  
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: timezone,
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(now);
    const weekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() || '';
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
    const currentMinutes = hour * 60 + minute;
    
    // Mapear dia da semana
    const dayMap: Record<string, string> = {
      'domingo': 'sunday',
      'segunda-feira': 'monday',
      'terça-feira': 'tuesday',
      'quarta-feira': 'wednesday',
      'quinta-feira': 'thursday',
      'sexta-feira': 'friday',
      'sábado': 'saturday'
    };
    
    const dayKey = dayMap[weekday] || 'monday';
    const dayConfig = businessHours[dayKey];
    
    if (!dayConfig || dayConfig.closed === true) return false;
    
    // Verificar se está dentro do horário
    const [openHour, openMin] = (dayConfig.open || '08:00').split(':').map(Number);
    const [closeHour, closeMin] = (dayConfig.close || '22:00').split(':').map(Number);
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;
    
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  } catch (e) {
    console.log('⚠️ Erro ao verificar horário de funcionamento:', e);
    return true; // Em caso de erro, assume aberto
  }
}

function getNextOpeningTime(businessHours: any, timezone: string): string | null {
  if (!businessHours) return null;
  
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: timezone,
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(now);
    const currentWeekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() || '';
    const currentHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const currentMinute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
    const currentMinutes = currentHour * 60 + currentMinute;
    
    const dayMap: Record<string, string> = {
      'domingo': 'sunday',
      'segunda-feira': 'monday',
      'terça-feira': 'tuesday',
      'quarta-feira': 'wednesday',
      'quinta-feira': 'thursday',
      'sexta-feira': 'friday',
      'sábado': 'saturday'
    };
    
    const daysOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const daysPortuguese: Record<string, string> = {
      'sunday': 'domingo',
      'monday': 'segunda',
      'tuesday': 'terça',
      'wednesday': 'quarta',
      'thursday': 'quinta',
      'friday': 'sexta',
      'saturday': 'sábado'
    };
    
    const currentDayKey = dayMap[currentWeekday] || 'monday';
    const currentDayIndex = daysOrder.indexOf(currentDayKey);
    
    // Verificar se abre ainda hoje
    const todayConfig = businessHours[currentDayKey];
    if (todayConfig?.enabled) {
      const [openHour, openMin] = (todayConfig.open || '08:00').split(':').map(Number);
      const openMinutes = openHour * 60 + openMin;
      
      if (currentMinutes < openMinutes) {
        // Abre ainda hoje
        const hoursUntil = Math.floor((openMinutes - currentMinutes) / 60);
        const minutesUntil = (openMinutes - currentMinutes) % 60;
        
        if (hoursUntil < 2) {
          return `em ${hoursUntil > 0 ? `${hoursUntil}h` : ''}${minutesUntil > 0 ? `${minutesUntil}min` : ''}, às ${todayConfig.open}`;
        }
        return `ainda hoje, às ${todayConfig.open}`;
      }
    }
    
    // Procurar próximo dia que abre
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (currentDayIndex + i) % 7;
      const nextDayKey = daysOrder[nextDayIndex];
      const nextDayConfig = businessHours[nextDayKey];
      
      if (nextDayConfig?.enabled) {
        const dayName = daysPortuguese[nextDayKey];
        if (i === 1) {
          return `amanhã às ${nextDayConfig.open}`;
        }
        return `${dayName} às ${nextDayConfig.open}`;
      }
    }
    
    return null;
  } catch (e) {
    console.log('⚠️ Erro ao calcular próxima abertura:', e);
    return null;
  }
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
      
      // Extrair remoteJid antes de qualquer coisa
      const remoteJid = message.key?.remoteJid || '';
      const senderPhone = remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '');
      const senderName = message.pushName || 'Cliente';
      
      // DETECTAR RESPOSTA MANUAL DA LOJA → PAUSAR BOT
      if (message.key?.fromMe) {
        console.log('📤 Loja respondeu manualmente, verificando se deve pausar bot...');
        
        // Buscar instância e config do bot
        const { data: instance } = await supabase
          .from('whatsapp_instances')
          .select('store_id')
          .eq('instance_name', instanceName)
          .eq('status', 'connected')
          .single();

        if (instance) {
          // Buscar config de reativação automática
          const { data: botConfig } = await supabase
            .from('store_bot_config')
            .select('auto_reactivate_minutes, stop_bot_from_me')
            .eq('store_id', instance.store_id)
            .single();

          // Se stop_bot_from_me está ativo, pausar permanentemente
          if (botConfig?.stop_bot_from_me !== false) {
            console.log(`⏸️ Pausando bot para ${remoteJid} (reativação em ${botConfig?.auto_reactivate_minutes || 0} min)`);
            
            // Chamar edge function para pausar bot permanentemente
            const { data: pauseResult, error: pauseError } = await supabase.functions.invoke('whatsapp-bot-pause', {
              body: {
                action: 'pause',
                storeId: instance.store_id,
                instanceName: instanceName,
                remoteJid: remoteJid,
                customerName: senderName,
                autoReactivateMinutes: botConfig?.auto_reactivate_minutes || 0
              }
            });

            if (pauseError) {
              console.error('❌ Erro ao pausar bot:', pauseError);
            } else {
              console.log('✅ Bot pausado:', pauseResult);
            }
          }
        }
        
        return new Response(JSON.stringify({ success: true, botPaused: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

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

      // Buscar timezone e business_hours da loja
      const { data: storeData } = await supabase
        .from('stores')
        .select('timezone, business_hours')
        .eq('id', instance.store_id)
        .single();
      
      const timezone = storeData?.timezone || 'America/Sao_Paulo';
      const businessHours = storeData?.business_hours;
      
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
      
      // ========== VERIFICAR STATUS EM TEMPO REAL ==========
      const isOpen = isStoreOpenNow(businessHours, timezone);
      const nextOpening = !isOpen ? getNextOpeningTime(businessHours, timezone) : null;
      
      console.log(`🏪 Status da loja: ${isOpen ? '✅ ABERTA' : '❌ FECHADA'}${nextOpening ? ` - Abre ${nextOpening}` : ''}`);
      
      // Verificar se está em pausa manual
      const isPaused = businessHours?.is_paused || false;

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
            // CONTEXTO DE HORÁRIO E STATUS para o bot
            timeContext: {
              currentTime,
              greeting,
              timezone,
              isOpen,
              nextOpening,
              isPaused
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
