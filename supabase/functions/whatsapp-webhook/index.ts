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
    if (todayConfig && todayConfig.closed !== true) {
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
      
      if (nextDayConfig && nextDayConfig.closed !== true) {
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

      // ========== DETECTAR MENSAGEM DE LOCALIZAÇÃO ==========
      const locationMessage = message.message?.locationMessage;
      if (locationMessage && !message.key?.fromMe) {
        const latitude = locationMessage.degreesLatitude;
        const longitude = locationMessage.degreesLongitude;
        console.log(`📍 Localização recebida de ${senderPhone}: lat=${latitude}, lng=${longitude}`);

        // Buscar instância
        const { data: locInstance } = await supabase
          .from('whatsapp_instances')
          .select('store_id')
          .eq('instance_name', instanceName)
          .eq('status', 'connected')
          .single();

        if (locInstance) {
          // Salvar localização no contexto da sessão
          const { error: ctxError } = await supabase
            .from('whatsapp_session_context')
            .upsert({
              store_id: locInstance.store_id,
              remote_jid: remoteJid,
              customer_latitude: latitude,
              customer_longitude: longitude,
              last_message_at: new Date().toISOString(),
            }, {
              onConflict: 'store_id,remote_jid',
            });

          if (ctxError) {
            console.log('⚠️ Erro ao salvar localização no contexto:', ctxError.message);
          } else {
            console.log('✅ Localização salva no contexto da sessão');
          }
        }
      }
      
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
          // === SALVAR MENSAGEM ENVIADA NO CHAT ===
          const outgoingContent = message.message?.conversation || 
                                  message.message?.extendedTextMessage?.text || 
                                  message.message?.imageMessage?.caption || 
                                  message.message?.videoMessage?.caption || 
                                  message.message?.documentMessage?.caption || '';
          const outgoingType = message.message?.imageMessage ? 'image' : 
                               message.message?.audioMessage ? 'audio' :
                               message.message?.videoMessage ? 'video' :
                               message.message?.documentMessage ? 'document' :
                               message.message?.stickerMessage ? 'sticker' : 'text';
          
          // Extrair URL de mídia do payload
          const outgoingMediaUrl = message.message?.imageMessage?.url ||
                                   message.message?.videoMessage?.url ||
                                   message.message?.audioMessage?.url ||
                                   message.message?.documentMessage?.url ||
                                   message.message?.stickerMessage?.url || null;
          const outgoingMediaFilename = message.message?.documentMessage?.fileName || null;
          const outgoingMediaMimetype = message.message?.imageMessage?.mimetype ||
                                        message.message?.videoMessage?.mimetype ||
                                        message.message?.audioMessage?.mimetype ||
                                        message.message?.documentMessage?.mimetype || null;
          
          if (outgoingContent || outgoingType !== 'text') {
            await supabase.from('whatsapp_chat_messages').insert({
              store_id: instance.store_id,
              remote_jid: remoteJid,
              phone_number: senderPhone,
              direction: 'outgoing',
              sender_name: 'Loja',
              content: outgoingContent || null,
              message_type: outgoingType,
              media_url: outgoingMediaUrl,
              media_filename: outgoingMediaFilename,
              media_mimetype: outgoingMediaMimetype,
              evolution_message_id: message.key?.id || null,
              is_from_bot: false,
              is_read_by_attendant: true,
              timestamp: new Date().toISOString(),
            }).then(({ error }) => {
              if (error) console.log('⚠️ Erro ao salvar msg outgoing no chat:', error.message);
              else console.log('✅ Msg outgoing salva no chat');
            });

            // Atualizar conversa
            await supabase.from('whatsapp_conversations').upsert({
              store_id: instance.store_id,
              remote_jid: remoteJid,
              phone_number: senderPhone,
              last_message: (outgoingContent || '[mídia]').slice(0, 200),
              last_message_at: new Date().toISOString(),
              last_message_direction: 'outgoing',
            }, { onConflict: 'store_id,remote_jid' });
          }

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

      // === CAPTURA AUTOMÁTICA DO LEAD/CONTATO ===
      const captureContact = async () => {
        try {
          // Verificar se telefone é válido (não é grupo)
          if (remoteJid.includes('@g.us')) return;
          
          const phoneNormalized = senderPhone.replace(/\D/g, '');
          if (phoneNormalized.length < 10 || phoneNormalized.length > 15) return;
          
          // Upsert na tabela whatsapp_contacts
          const { error: contactError } = await supabase
            .from('whatsapp_contacts')
            .upsert({
              store_id: instance.store_id,
              phone_number: phoneNormalized,
              push_name: senderName,
              name: senderName,
              is_whatsapp_valid: true,
              source: 'chat',
              last_synced_at: new Date().toISOString(),
            }, {
              onConflict: 'store_id,phone_number',
              ignoreDuplicates: false,
            });
          
          if (contactError) {
            console.log('⚠️ Erro ao salvar contato:', contactError.message);
          } else {
            console.log(`📇 Lead capturado: ${phoneNormalized} (${senderName})`);
          }
        } catch (e) {
          console.log('⚠️ Erro na captura de contato:', e);
        }
      };

      // Executar captura em background (não bloqueia resposta)
      captureContact();

      // === SALVAR MENSAGEM RECEBIDA NO CHAT (whatsapp_chat_messages) ===
      const incomingContent = message.message?.conversation || 
                              message.message?.extendedTextMessage?.text || 
                              message.message?.imageMessage?.caption ||
                              message.message?.videoMessage?.caption ||
                              message.message?.documentMessage?.caption ||
                              (locationMessage ? `📍 Localização: ${locationMessage?.degreesLatitude}, ${locationMessage?.degreesLongitude}` : '');
      const incomingType = message.message?.imageMessage ? 'image' : 
                           message.message?.audioMessage ? 'audio' :
                           message.message?.videoMessage ? 'video' :
                           message.message?.documentMessage ? 'document' :
                           message.message?.stickerMessage ? 'sticker' :
                           locationMessage ? 'location' : 'text';

      // Extrair URL de mídia do payload
      const incomingMediaUrl = message.message?.imageMessage?.url ||
                               message.message?.videoMessage?.url ||
                               message.message?.audioMessage?.url ||
                               message.message?.documentMessage?.url ||
                               message.message?.stickerMessage?.url || null;
      const incomingMediaFilename = message.message?.documentMessage?.fileName || null;
      const incomingMediaMimetype = message.message?.imageMessage?.mimetype ||
                                    message.message?.videoMessage?.mimetype ||
                                    message.message?.audioMessage?.mimetype ||
                                    message.message?.documentMessage?.mimetype || null;

      const saveChatMessage = async () => {
        try {
          // Salvar mensagem
          await supabase.from('whatsapp_chat_messages').insert({
            store_id: instance.store_id,
            remote_jid: remoteJid,
            phone_number: senderPhone,
            direction: 'incoming',
            sender_name: senderName,
            content: incomingContent || null,
            message_type: incomingType,
            media_url: incomingMediaUrl,
            media_filename: incomingMediaFilename,
            media_mimetype: incomingMediaMimetype,
            evolution_message_id: message.key?.id || null,
            is_from_bot: false,
            is_read_by_attendant: false,
            timestamp: new Date().toISOString(),
          });

          // Upsert conversa com incremento de unread
          const { data: existingConv } = await supabase
            .from('whatsapp_conversations')
            .select('id, unread_count')
            .eq('store_id', instance.store_id)
            .eq('remote_jid', remoteJid)
            .maybeSingle();

          if (existingConv) {
            await supabase.from('whatsapp_conversations')
              .update({
                contact_name: senderName !== 'Cliente' ? senderName : undefined,
                last_message: (incomingContent || '[mídia]').slice(0, 200),
                last_message_at: new Date().toISOString(),
                last_message_direction: 'incoming',
                unread_count: (existingConv.unread_count || 0) + 1,
              })
              .eq('id', existingConv.id);
          } else {
            await supabase.from('whatsapp_conversations').insert({
              store_id: instance.store_id,
              remote_jid: remoteJid,
              phone_number: senderPhone,
              contact_name: senderName !== 'Cliente' ? senderName : null,
              last_message: (incomingContent || '[mídia]').slice(0, 200),
              last_message_at: new Date().toISOString(),
              last_message_direction: 'incoming',
              unread_count: 1,
            });
          }

          console.log('✅ Msg incoming salva no chat');
        } catch (e) {
          console.log('⚠️ Erro ao salvar msg incoming no chat:', e);
        }
      };
      saveChatMessage();

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

    // Evento: Status da mensagem atualizado (delivered/read)
    if (body.event === 'messages.update') {
      const updateData = body.data;
      const instanceName = body.instance;
      
      console.log('📬 Evento de atualização de status:', JSON.stringify(updateData, null, 2));
      
      // Extrair informações do status
      const messageId = updateData.id || updateData.key?.id;
      const remoteJid = updateData.remoteJid || updateData.key?.remoteJid;
      const newStatus = updateData.status;
      
      if (!messageId) {
        console.log('⚠️ ID da mensagem não encontrado no evento de update');
        return new Response(JSON.stringify({ success: true, skipped: 'no_message_id' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`📨 Atualizando status da mensagem ${messageId}: ${newStatus}`);

      // Mapear status da Evolution API para nosso sistema
      // DELIVERY_ACK = entregue (dois ticks)
      // READ = lida (dois ticks azuis)
      // PLAYED = mídia reproduzida
      
      if (newStatus === 'DELIVERY_ACK' || newStatus === 3) {
        // Mensagem entregue
        const { data, error } = await supabase
          .from('whatsapp_messages')
          .update({ 
            status: 'delivered', 
            delivered_at: new Date().toISOString() 
          })
          .eq('evolution_message_id', messageId)
          .select('id, campaign_id');

        if (error) {
          console.log('⚠️ Erro ao atualizar status delivered:', error);
        } else if (data && data.length > 0) {
          console.log(`✅ Mensagem ${messageId} marcada como entregue`);
          
          // Incrementar contador de delivered na campanha
          if (data[0].campaign_id) {
            const { error: rpcError } = await supabase.rpc('increment_campaign_counter', { 
              p_campaign_id: data[0].campaign_id, 
              p_counter_name: 'delivered_count' 
            });
            if (rpcError) console.log('⚠️ Erro ao incrementar delivered_count:', rpcError);
          }
        } else {
          console.log(`ℹ️ Mensagem ${messageId} não encontrada no banco`);
        }
      }
      
      if (newStatus === 'READ' || newStatus === 4) {
        // Mensagem lida
        const { data, error } = await supabase
          .from('whatsapp_messages')
          .update({ 
            status: 'read', 
            read_at: new Date().toISOString() 
          })
          .eq('evolution_message_id', messageId)
          .select('id, campaign_id');

        if (error) {
          console.log('⚠️ Erro ao atualizar status read:', error);
        } else if (data && data.length > 0) {
          console.log(`✅ Mensagem ${messageId} marcada como lida`);
          
          // Incrementar contador de read na campanha
          if (data[0].campaign_id) {
            const { error: rpcError } = await supabase.rpc('increment_campaign_counter', { 
              p_campaign_id: data[0].campaign_id, 
              p_counter_name: 'read_count' 
            });
            if (rpcError) console.log('⚠️ Erro ao incrementar read_count:', rpcError);
          }
        } else {
          console.log(`ℹ️ Mensagem ${messageId} não encontrada no banco`);
        }
      }

      if (newStatus === 'PLAYED' || newStatus === 5) {
        // Mídia reproduzida (também conta como lida)
        const { data, error } = await supabase
          .from('whatsapp_messages')
          .update({ 
            status: 'read', 
            read_at: new Date().toISOString() 
          })
          .eq('evolution_message_id', messageId)
          .select('id, campaign_id');

        if (error) {
          console.log('⚠️ Erro ao atualizar status played:', error);
        } else if (data && data.length > 0) {
          console.log(`✅ Mensagem ${messageId} mídia reproduzida (lida)`);
          
          if (data[0].campaign_id) {
            const { error: rpcError } = await supabase.rpc('increment_campaign_counter', { 
              p_campaign_id: data[0].campaign_id, 
              p_counter_name: 'read_count' 
            });
            if (rpcError) console.log('⚠️ Erro ao incrementar read_count:', rpcError);
          }
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        event: 'messages.update',
        messageId,
        newStatus 
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
