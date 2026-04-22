import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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

    const { storeId } = await req.json();

    if (!storeId) {
      return new Response(JSON.stringify({ success: false, error: 'storeId é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calcular timestamp de 24h atrás
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    console.log(`🔄 Buscando conversas inativas > 24h para store ${storeId} (cutoff: ${cutoff})`);

    // Buscar conversas abertas com updated_at > 24h
    const { data: staleConversations, error: fetchError } = await supabase
      .from('whatsapp_conversations')
      .select('id, remote_jid, contact_name, phone_number, updated_at')
      .eq('store_id', storeId)
      .neq('status', 'closed')
      .lt('updated_at', cutoff);

    if (fetchError) {
      console.error('❌ Erro ao buscar conversas:', fetchError);
      return new Response(JSON.stringify({ success: false, error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!staleConversations || staleConversations.length === 0) {
      console.log('✅ Nenhuma conversa inativa encontrada');
      return new Response(JSON.stringify({ success: true, closedCount: 0, message: 'Nenhuma conversa inativa encontrada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📋 ${staleConversations.length} conversas para finalizar`);

    const ids = staleConversations.map(c => c.id);

    // Fechar todas de uma vez
    const { error: updateError } = await supabase
      .from('whatsapp_conversations')
      .update({ status: 'closed', is_bot_active: true })
      .in('id', ids);

    if (updateError) {
      console.error('❌ Erro ao fechar conversas:', updateError);
      return new Response(JSON.stringify({ success: false, error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Reativar contatos pausados dessas conversas
    const remoteJids = staleConversations.map(c => c.remote_jid);
    await supabase
      .from('whatsapp_paused_contacts')
      .update({ status: 'reactivated' })
      .eq('store_id', storeId)
      .eq('status', 'paused')
      .in('remote_jid', remoteJids);

    console.log(`✅ ${staleConversations.length} conversas finalizadas com sucesso`);

    return new Response(JSON.stringify({
      success: true,
      closedCount: staleConversations.length,
      conversations: staleConversations.map(c => ({
        id: c.id,
        name: c.contact_name || c.phone_number,
        updatedAt: c.updated_at,
      })),
    }), {
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
