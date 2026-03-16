import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { 
      action, // 'pause' | 'reactivate' | 'permanent_pause' | 'remove_permanent_pause'
      storeId, 
      instanceName, 
      remoteJid, 
      customerName,
      autoReactivateMinutes 
    } = body;

    console.log(`🤖 Bot Pause/Reactivate - Action: ${action}, Store: ${storeId}, JID: ${remoteJid}`);

    if (action === 'pause') {
      // 1. Atualizar is_bot_active no banco (UaZapi webhook verifica este campo)
      await supabase
        .from('whatsapp_conversations')
        .update({ is_bot_active: false })
        .eq('store_id', storeId)
        .eq('remote_jid', remoteJid);
      console.log(`✅ is_bot_active=false para ${remoteJid}`);

      // 2. Atualizar banco de dados (paused_contacts)
      let autoReactivateAt: string | null = null;
      if (autoReactivateMinutes && autoReactivateMinutes > 0) {
        const reactivateDate = new Date();
        reactivateDate.setMinutes(reactivateDate.getMinutes() + autoReactivateMinutes);
        autoReactivateAt = reactivateDate.toISOString();
      }

      const { data: existing } = await supabase
        .from('whatsapp_paused_contacts')
        .select('id')
        .eq('store_id', storeId)
        .eq('remote_jid', remoteJid)
        .eq('status', 'paused')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('whatsapp_paused_contacts')
          .update({
            paused_at: new Date().toISOString(),
            auto_reactivate_at: autoReactivateAt,
            customer_name: customerName,
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('whatsapp_paused_contacts')
          .insert({
            store_id: storeId,
            instance_name: instanceName,
            remote_jid: remoteJid,
            customer_name: customerName,
            paused_by: 'manual_reply',
            auto_reactivate_at: autoReactivateAt,
            status: 'paused',
          });
      }

      return new Response(JSON.stringify({ 
        success: true,
        action: 'paused',
        remoteJid,
        autoReactivateAt,
        message: autoReactivateAt 
          ? `Bot pausado. Reativará em ${autoReactivateMinutes} min.`
          : 'Bot pausado. Reativação manual necessária.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'reactivate') {
      // 1. Atualizar is_bot_active no banco
      await supabase
        .from('whatsapp_conversations')
        .update({ is_bot_active: true })
        .eq('store_id', storeId)
        .eq('remote_jid', remoteJid);
      console.log(`✅ is_bot_active=true para ${remoteJid}`);

      // 2. Atualizar banco de dados
      await supabase
        .from('whatsapp_paused_contacts')
        .update({
          status: 'reactivated',
          reactivated_at: new Date().toISOString(),
        })
        .eq('store_id', storeId)
        .eq('remote_jid', remoteJid)
        .eq('status', 'paused');

      return new Response(JSON.stringify({ 
        success: true,
        action: 'reactivated',
        remoteJid,
        message: 'Bot reativado!'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'permanent_pause') {
      // 1. Desativar bot na conversa
      await supabase
        .from('whatsapp_conversations')
        .update({ is_bot_active: false })
        .eq('store_id', storeId)
        .eq('remote_jid', remoteJid);
      console.log(`🚫 is_bot_active=false PERMANENTE para ${remoteJid}`);

      // 2. Criar/atualizar registro como permanently_paused
      const { data: existing } = await supabase
        .from('whatsapp_paused_contacts')
        .select('id, status')
        .eq('store_id', storeId)
        .eq('remote_jid', remoteJid)
        .in('status', ['paused', 'permanently_paused'])
        .maybeSingle();

      if (existing) {
        await supabase
          .from('whatsapp_paused_contacts')
          .update({
            status: 'permanently_paused',
            paused_at: new Date().toISOString(),
            auto_reactivate_at: null,
            customer_name: customerName,
            paused_by: 'manual_permanent',
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('whatsapp_paused_contacts')
          .insert({
            store_id: storeId,
            instance_name: instanceName,
            remote_jid: remoteJid,
            customer_name: customerName,
            paused_by: 'manual_permanent',
            auto_reactivate_at: null,
            status: 'permanently_paused',
          });
      }

      return new Response(JSON.stringify({ 
        success: true,
        action: 'permanently_paused',
        remoteJid,
        message: 'IA bloqueada permanentemente para este contato.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'remove_permanent_pause') {
      // 1. Reativar bot na conversa
      await supabase
        .from('whatsapp_conversations')
        .update({ is_bot_active: true })
        .eq('store_id', storeId)
        .eq('remote_jid', remoteJid);
      console.log(`✅ Bloqueio permanente removido para ${remoteJid}`);

      // 2. Atualizar registro
      await supabase
        .from('whatsapp_paused_contacts')
        .update({
          status: 'reactivated',
          reactivated_at: new Date().toISOString(),
        })
        .eq('store_id', storeId)
        .eq('remote_jid', remoteJid)
        .eq('status', 'permanently_paused');

      return new Response(JSON.stringify({ 
        success: true,
        action: 'permanent_pause_removed',
        remoteJid,
        message: 'Bloqueio permanente removido. IA reativada.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Invalid action' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Error:', errorMessage);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
