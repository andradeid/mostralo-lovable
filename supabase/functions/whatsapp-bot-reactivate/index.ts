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

    console.log('🔄 CRON: Verificando contatos para reativação automática...');

    const now = new Date().toISOString();
    const { data: contactsToReactivate, error: fetchError } = await supabase
      .from('whatsapp_paused_contacts')
      .select('*')
      .eq('status', 'paused')
      .not('auto_reactivate_at', 'is', null)
      .lte('auto_reactivate_at', now);

    if (fetchError) {
      console.error('❌ Erro ao buscar contatos:', fetchError);
      return new Response(JSON.stringify({ success: false, error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!contactsToReactivate || contactsToReactivate.length === 0) {
      console.log('✅ Nenhum contato para reativar');
      return new Response(JSON.stringify({ success: true, message: 'No contacts to reactivate', reactivatedCount: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📋 ${contactsToReactivate.length} contatos para reativar`);

    const { data: evolutionConfig, error: configError } = await supabase
      .from('evolution_config')
      .select('api_url, api_key')
      .eq('is_active', true)
      .single();

    if (configError || !evolutionConfig) {
      console.error('❌ Evolution config não encontrada');
      return new Response(JSON.stringify({ success: false, error: 'Evolution config not found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const evolutionUrl = evolutionConfig.api_url.replace(/\/$/, '');
    const evolutionApiKey = evolutionConfig.api_key;

    let reactivatedCount = 0;
    let errorCount = 0;
    const results: any[] = [];

    for (const contact of contactsToReactivate) {
      try {
        const instanceName = contact.instance_name;
        console.log(`🔄 Reativando: ${contact.remote_jid} (${instanceName})`);

        // 1. changeStatus opened via Evolution API
        try {
          const resp = await fetch(`${evolutionUrl}/openai/changeStatus/${instanceName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionApiKey,
            },
            body: JSON.stringify({ remoteJid: contact.remote_jid, status: 'opened' }),
          });
          console.log(`📡 changeStatus opened: ${resp.status}`);
        } catch (e) {
          console.error('⚠️ changeStatus falhou:', e);
        }

        // 2. Atualizar status no banco
        await supabase
          .from('whatsapp_paused_contacts')
          .update({ status: 'reactivated', reactivated_at: new Date().toISOString() })
          .eq('id', contact.id);

        // 3. Atualizar is_bot_active na conversa
        await supabase
          .from('whatsapp_conversations')
          .update({ is_bot_active: true })
          .eq('store_id', contact.store_id)
          .eq('remote_jid', contact.remote_jid);

        reactivatedCount++;
        results.push({ id: contact.id, remoteJid: contact.remote_jid, status: 'reactivated' });
        console.log(`✅ Reativado: ${contact.remote_jid}`);

        // Pequeno delay para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (contactError) {
        errorCount++;
        const errorMsg = contactError instanceof Error ? contactError.message : 'Unknown error';
        results.push({ id: contact.id, remoteJid: contact.remote_jid, status: 'error', error: errorMsg });
        console.error(`❌ Erro ao processar ${contact.remote_jid}:`, errorMsg);
      }
    }

    console.log(`📊 Resultado: ${reactivatedCount} reativados, ${errorCount} erros`);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Processed ${contactsToReactivate.length} contacts`,
      reactivatedCount,
      errorCount,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ CRON Error:', errorMessage);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
