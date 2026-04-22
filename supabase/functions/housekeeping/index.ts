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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const results: Record<string, { deleted: number; error?: string }> = {};

    // 1. Limpar webhook_logs com mais de 30 dias
    const webhookCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error: webhookError, count: webhookCount } = await supabase
      .from('webhook_logs')
      .delete({ count: 'exact' })
      .lt('created_at', webhookCutoff);

    results.webhook_logs = {
      deleted: webhookCount || 0,
      ...(webhookError && { error: webhookError.message }),
    };

    // 2. Limpar page_visits com mais de 90 dias
    const visitsCutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { error: visitsError, count: visitsCount } = await supabase
      .from('page_visits')
      .delete({ count: 'exact' })
      .lt('created_at', visitsCutoff);

    results.page_visits = {
      deleted: visitsCount || 0,
      ...(visitsError && { error: visitsError.message }),
    };

    // 3. Limpar booking_notification_logs com mais de 60 dias
    const notifCutoff = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const { error: notifError, count: notifCount } = await supabase
      .from('booking_notification_logs')
      .delete({ count: 'exact' })
      .lt('created_at', notifCutoff);

    results.booking_notification_logs = {
      deleted: notifCount || 0,
      ...(notifError && { error: notifError.message }),
    };

    // 4. Limpar customer_tokens expirados
    const { error: tokenError, count: tokenCount } = await supabase
      .from('customer_tokens')
      .delete({ count: 'exact' })
      .lt('expires_at', now.toISOString());

    results.customer_tokens = {
      deleted: tokenCount || 0,
      ...(tokenError && { error: tokenError.message }),
    };

    // 5. Limpar booking_tokens expirados
    const { error: bTokenError, count: bTokenCount } = await supabase
      .from('booking_tokens')
      .delete({ count: 'exact' })
      .lt('expires_at', now.toISOString());

    results.booking_tokens = {
      deleted: bTokenCount || 0,
      ...(bTokenError && { error: bTokenError.message }),
    };

    const totalDeleted = Object.values(results).reduce((sum, r) => sum + r.deleted, 0);
    const hasErrors = Object.values(results).some(r => r.error);

    console.log(`[housekeeping] Concluído: ${totalDeleted} registros removidos`, JSON.stringify(results));

    return new Response(JSON.stringify({
      success: !hasErrors,
      total_deleted: totalDeleted,
      details: results,
      executed_at: now.toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[housekeeping] Erro:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
