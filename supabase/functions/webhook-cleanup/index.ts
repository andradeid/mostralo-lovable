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
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se é master_admin
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'master_admin')
      .limit(1)
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { action, webhook_types, days_to_keep } = body;

    const keepDays = days_to_keep || 7;

    switch (action) {
      case 'cleanup': {
        // Limpar logs de tipos específicos ou todos
        let query = supabase
          .from('webhook_logs')
          .delete()
          .lt('created_at', new Date(Date.now() - keepDays * 24 * 60 * 60 * 1000).toISOString());

        if (webhook_types && webhook_types.length > 0) {
          query = query.in('webhook_type', webhook_types);
        }

        const { error, count } = await query;
        if (error) throw error;

        console.log(`[webhook-cleanup] Removidos logs com mais de ${keepDays} dias`);
        return new Response(JSON.stringify({ success: true, message: `Logs antigos removidos com sucesso` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'cleanup_all': {
        // Limpar TODOS os logs dos tipos especificados
        let query = supabase.from('webhook_logs').delete();
        
        if (webhook_types && webhook_types.length > 0) {
          query = query.in('webhook_type', webhook_types);
        } else {
          // Precisa de um filtro, limpar tudo com gt created_at epoch
          query = query.gt('created_at', '1970-01-01T00:00:00Z');
        }

        const { error } = await query;
        if (error) throw error;

        console.log(`[webhook-cleanup] Todos os logs removidos`);
        return new Response(JSON.stringify({ success: true, message: 'Todos os logs foram removidos' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Ação não reconhecida' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('[webhook-cleanup] Erro:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro interno' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
