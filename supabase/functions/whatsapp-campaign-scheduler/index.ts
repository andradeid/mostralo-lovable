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

    console.log('🕐 Verificando campanhas agendadas...');

    // Buscar campanhas agendadas que devem iniciar agora
    const now = new Date().toISOString();
    
    const { data: scheduledCampaigns, error: fetchError } = await supabase
      .from('whatsapp_campaigns')
      .select('id, name, store_id, scheduled_start_at')
      .eq('status', 'scheduled')
      .lte('scheduled_start_at', now);

    if (fetchError) {
      console.error('❌ Erro ao buscar campanhas:', fetchError);
      throw fetchError;
    }

    if (!scheduledCampaigns || scheduledCampaigns.length === 0) {
      console.log('ℹ️ Nenhuma campanha agendada para iniciar agora');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Nenhuma campanha para iniciar',
        checked_at: now 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📋 ${scheduledCampaigns.length} campanha(s) para iniciar`);

    const results = [];

    for (const campaign of scheduledCampaigns) {
      console.log(`🚀 Iniciando campanha: ${campaign.name} (${campaign.id})`);

      try {
        // Chamar função de campanha para iniciar
        const { data: startResult, error: startError } = await supabase.functions.invoke('whatsapp-campaign', {
          body: { 
            action: 'start', 
            campaignId: campaign.id, 
            storeId: campaign.store_id 
          }
        });

        if (startError) {
          console.error(`❌ Erro ao iniciar campanha ${campaign.id}:`, startError);
          results.push({ 
            campaignId: campaign.id, 
            success: false, 
            error: startError.message 
          });
        } else {
          console.log(`✅ Campanha ${campaign.name} iniciada com sucesso`);
          results.push({ 
            campaignId: campaign.id, 
            success: true, 
            result: startResult 
          });
        }
      } catch (err: any) {
        console.error(`❌ Exceção ao iniciar campanha ${campaign.id}:`, err);
        results.push({ 
          campaignId: campaign.id, 
          success: false, 
          error: err.message 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`📊 Resultado: ${successCount} sucesso(s), ${failCount} falha(s)`);

    return new Response(JSON.stringify({ 
      success: true, 
      total: scheduledCampaigns.length,
      started: successCount,
      failed: failCount,
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Scheduler error:', errorMessage);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
