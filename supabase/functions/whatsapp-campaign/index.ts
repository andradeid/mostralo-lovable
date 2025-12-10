import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para substituir variáveis no template
function replaceVariables(template: string, customer: any, store: any): string {
  const now = new Date();
  const lastOrderDate = customer.last_order_at ? new Date(customer.last_order_at) : null;
  const daysInactive = lastOrderDate 
    ? Math.floor((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return template
    .replace(/{nome}/g, customer.name || 'Cliente')
    .replace(/{primeiro_nome}/g, (customer.name || 'Cliente').split(' ')[0])
    .replace(/{telefone}/g, customer.phone || '')
    .replace(/{email}/g, customer.email || '')
    .replace(/{total_pedidos}/g, String(customer.total_orders || 0))
    .replace(/{total_gasto}/g, (customer.total_spent || 0).toFixed(2).replace('.', ','))
    .replace(/{dias_inativo}/g, String(daysInactive))
    .replace(/{ultimo_pedido}/g, lastOrderDate ? lastOrderDate.toLocaleDateString('pt-BR') : 'nunca')
    .replace(/{loja}/g, store?.name || '')
    .replace(/{link_loja}/g, store?.slug ? `https://mostralo.com.br/loja/${store.slug}` : '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, campaignId, storeId } = await req.json();
    console.log(`[whatsapp-campaign] Action: ${action}, Campaign: ${campaignId}`);

    switch (action) {
      case 'preview': {
        // Buscar campanha
        const { data: campaign, error: campaignError } = await supabase
          .from('whatsapp_campaigns')
          .select(`
            *,
            template:whatsapp_templates(*)
          `)
          .eq('id', campaignId)
          .single();

        if (campaignError || !campaign) {
          return new Response(JSON.stringify({ error: 'Campanha não encontrada' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Buscar clientes que atendem aos filtros
        let query = supabase
          .from('customer_stores')
          .select(`
            customer:customers(*)
          `)
          .eq('store_id', campaign.store_id);

        // Aplicar filtros de segmentação
        if (campaign.filter_min_orders) {
          query = query.gte('total_orders', campaign.filter_min_orders);
        }
        if (campaign.filter_max_orders) {
          query = query.lte('total_orders', campaign.filter_max_orders);
        }
        if (campaign.filter_min_spent) {
          query = query.gte('total_spent', campaign.filter_min_spent);
        }
        if (campaign.filter_max_spent) {
          query = query.lte('total_spent', campaign.filter_max_spent);
        }
        if (campaign.filter_last_order_after) {
          query = query.gte('last_order_at', campaign.filter_last_order_after);
        }
        if (campaign.filter_last_order_before) {
          query = query.lte('last_order_at', campaign.filter_last_order_before);
        }

        const { data: customerStores, error: customersError } = await query;

        if (customersError) {
          console.error('[whatsapp-campaign] Erro ao buscar clientes:', customersError);
          return new Response(JSON.stringify({ error: 'Erro ao buscar clientes' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Filtrar por dias inativos (não pode ser feito diretamente no SQL)
        let filteredCustomers = customerStores?.map(cs => cs.customer).filter(Boolean) || [];
        
        if (campaign.filter_days_inactive) {
          const now = new Date();
          filteredCustomers = filteredCustomers.filter((customer: any) => {
            if (!customer.last_order_at) return true; // Cliente que nunca comprou
            const lastOrder = new Date(customer.last_order_at);
            const daysInactive = Math.floor((now.getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24));
            return daysInactive >= campaign.filter_days_inactive;
          });
        }

        return new Response(JSON.stringify({
          success: true,
          totalRecipients: filteredCustomers.length,
          sampleRecipients: filteredCustomers.slice(0, 5).map((c: any) => ({
            name: c.name,
            phone: c.phone,
            total_orders: c.total_orders,
            last_order_at: c.last_order_at,
          })),
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'start': {
        // Buscar campanha com template
        const { data: campaign, error: campaignError } = await supabase
          .from('whatsapp_campaigns')
          .select(`
            *,
            template:whatsapp_templates(*)
          `)
          .eq('id', campaignId)
          .single();

        if (campaignError || !campaign) {
          return new Response(JSON.stringify({ error: 'Campanha não encontrada' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!campaign.template) {
          return new Response(JSON.stringify({ error: 'Template não encontrado' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Buscar loja
        const { data: store } = await supabase
          .from('stores')
          .select('*')
          .eq('id', campaign.store_id)
          .single();

        // Buscar clientes (mesma lógica do preview)
        let query = supabase
          .from('customer_stores')
          .select(`
            customer:customers(*)
          `)
          .eq('store_id', campaign.store_id);

        if (campaign.filter_min_orders) {
          query = query.gte('total_orders', campaign.filter_min_orders);
        }
        if (campaign.filter_max_orders) {
          query = query.lte('total_orders', campaign.filter_max_orders);
        }
        if (campaign.filter_min_spent) {
          query = query.gte('total_spent', campaign.filter_min_spent);
        }
        if (campaign.filter_max_spent) {
          query = query.lte('total_spent', campaign.filter_max_spent);
        }
        if (campaign.filter_last_order_after) {
          query = query.gte('last_order_at', campaign.filter_last_order_after);
        }
        if (campaign.filter_last_order_before) {
          query = query.lte('last_order_at', campaign.filter_last_order_before);
        }

        const { data: customerStores } = await query;
        let filteredCustomers = customerStores?.map(cs => cs.customer).filter(Boolean) || [];

        if (campaign.filter_days_inactive) {
          const now = new Date();
          filteredCustomers = filteredCustomers.filter((customer: any) => {
            if (!customer.last_order_at) return true;
            const lastOrder = new Date(customer.last_order_at);
            const daysInactive = Math.floor((now.getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24));
            return daysInactive >= campaign.filter_days_inactive;
          });
        }

        console.log(`[whatsapp-campaign] Iniciando campanha com ${filteredCustomers.length} destinatários`);

        // Criar mensagens pendentes para cada cliente
        const now = new Date();
        const messages = filteredCustomers.map((customer: any, index: number) => {
          const scheduledTime = new Date(now.getTime() + (index * (campaign.message_interval_seconds || 30) * 1000));
          const finalContent = replaceVariables(campaign.template.content, customer, store);

          return {
            store_id: campaign.store_id,
            campaign_id: campaignId,
            customer_id: customer.id,
            template_id: campaign.template_id,
            phone_number: customer.phone?.replace(/\D/g, ''),
            customer_name: customer.name,
            message_type: campaign.template.message_type,
            content: finalContent,
            media_url: campaign.template.media_url,
            status: 'pending',
            scheduled_for: scheduledTime.toISOString(),
          };
        });

        // Inserir mensagens
        if (messages.length > 0) {
          const { error: insertError } = await supabase
            .from('whatsapp_messages')
            .insert(messages);

          if (insertError) {
            console.error('[whatsapp-campaign] Erro ao criar mensagens:', insertError);
            return new Response(JSON.stringify({ error: 'Erro ao criar mensagens' }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        // Atualizar campanha
        await supabase
          .from('whatsapp_campaigns')
          .update({
            status: 'running',
            started_at: new Date().toISOString(),
            total_recipients: messages.length,
          })
          .eq('id', campaignId);

        return new Response(JSON.stringify({
          success: true,
          totalMessages: messages.length,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'process': {
        // Processar mensagens pendentes (chamado por cron ou manualmente)
        console.log('[whatsapp-campaign] Processando mensagens pendentes...');

        // Buscar configuração da Evolution API
        const { data: evolutionConfig } = await supabase
          .from('evolution_config')
          .select('*')
          .eq('is_active', true)
          .single();

        if (!evolutionConfig) {
          return new Response(JSON.stringify({ error: 'Evolution API não configurada' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Buscar mensagens pendentes que já passaram do horário agendado
        const { data: pendingMessages, error: fetchError } = await supabase
          .from('whatsapp_messages')
          .select(`
            *,
            campaign:whatsapp_campaigns(store_id, start_hour, end_hour, daily_limit)
          `)
          .eq('status', 'pending')
          .lte('scheduled_for', new Date().toISOString())
          .limit(10); // Processar em lotes

        if (fetchError || !pendingMessages) {
          console.log('[whatsapp-campaign] Nenhuma mensagem pendente');
          return new Response(JSON.stringify({ processed: 0 }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        let processed = 0;
        let failed = 0;

        for (const message of pendingMessages) {
          try {
            // Verificar horário permitido
            const currentHour = new Date().getHours();
            const startHour = message.campaign?.start_hour || 9;
            const endHour = message.campaign?.end_hour || 21;

            if (currentHour < startHour || currentHour >= endHour) {
              console.log(`[whatsapp-campaign] Fora do horário (${currentHour}h, permitido ${startHour}-${endHour}h)`);
              continue;
            }

            // Buscar instância
            const { data: instance } = await supabase
              .from('whatsapp_instances')
              .select('*')
              .eq('store_id', message.store_id)
              .eq('status', 'connected')
              .single();

            if (!instance) {
              await supabase
                .from('whatsapp_messages')
                .update({
                  status: 'failed',
                  error_message: 'WhatsApp não conectado',
                  failed_at: new Date().toISOString(),
                })
                .eq('id', message.id);
              failed++;
              continue;
            }

            // Enviar mensagem
            const endpoint = message.message_type === 'text'
              ? `${evolutionConfig.api_url}/message/sendText/${instance.instance_name}`
              : `${evolutionConfig.api_url}/message/sendMedia/${instance.instance_name}`;

            const payload: any = { number: message.phone_number };
            if (message.message_type === 'text') {
              payload.text = message.content;
            } else {
              payload.mediatype = message.message_type;
              payload.media = message.media_url;
              payload.caption = message.content;
            }

            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': evolutionConfig.api_key,
              },
              body: JSON.stringify(payload),
            });

            const responseData = await response.json();

            if (response.ok) {
              await supabase
                .from('whatsapp_messages')
                .update({
                  status: 'sent',
                  evolution_message_id: responseData.key?.id,
                  sent_at: new Date().toISOString(),
                })
                .eq('id', message.id);

              // Atualizar contador da campanha
              if (message.campaign_id) {
                await supabase
                  .from('whatsapp_campaigns')
                  .update({ messages_sent: (message.campaign as any)?.messages_sent + 1 || 1 })
                  .eq('id', message.campaign_id);
              }

              processed++;
            } else {
              await supabase
                .from('whatsapp_messages')
                .update({
                  status: 'failed',
                  error_message: JSON.stringify(responseData),
                  failed_at: new Date().toISOString(),
                })
                .eq('id', message.id);
              failed++;
            }

            // Aguardar um pouco entre mensagens para não sobrecarregar
            await new Promise(resolve => setTimeout(resolve, 1000));

          } catch (err) {
            console.error(`[whatsapp-campaign] Erro ao processar mensagem ${message.id}:`, err);
            failed++;
          }
        }

        console.log(`[whatsapp-campaign] Processadas: ${processed}, Falhas: ${failed}`);

        return new Response(JSON.stringify({ processed, failed }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'pause': {
        await supabase
          .from('whatsapp_campaigns')
          .update({ status: 'paused' })
          .eq('id', campaignId);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'resume': {
        await supabase
          .from('whatsapp_campaigns')
          .update({ status: 'running' })
          .eq('id', campaignId);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'cancel': {
        // Cancelar mensagens pendentes
        await supabase
          .from('whatsapp_messages')
          .update({ status: 'failed', error_message: 'Campanha cancelada' })
          .eq('campaign_id', campaignId)
          .eq('status', 'pending');

        await supabase
          .from('whatsapp_campaigns')
          .update({ status: 'cancelled' })
          .eq('id', campaignId);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Ação inválida' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error: any) {
    console.error('[whatsapp-campaign] Erro:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
