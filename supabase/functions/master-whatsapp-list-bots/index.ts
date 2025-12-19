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
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify user is master admin
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check master admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profile?.user_type !== 'master_admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get Evolution config
    const { data: evolutionConfig, error: configError } = await supabase
      .from('evolution_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !evolutionConfig) {
      return new Response(JSON.stringify({ error: 'Evolution API não configurada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get master whatsapp config to get instance name
    const { data: masterConfig } = await supabase
      .from('master_whatsapp_config')
      .select('instance_name')
      .eq('admin_user_id', user.id)
      .single();

    if (!masterConfig?.instance_name) {
      return new Response(JSON.stringify({ error: 'Instância não configurada', bots: [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const instanceName = masterConfig.instance_name;
    console.log(`Buscando bots para instância: ${instanceName}`);

    // Fetch bots from Evolution API
    const response = await fetch(
      `${evolutionConfig.api_url}/openai/find/${instanceName}`,
      {
        method: 'GET',
        headers: {
          'apikey': evolutionConfig.api_key,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro Evolution API:', response.status, errorText);
      
      // Se for 404, significa que não tem bots criados
      if (response.status === 404) {
        return new Response(JSON.stringify({ bots: [], message: 'Nenhum bot encontrado' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ error: `Erro na Evolution API: ${response.status}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const evolutionData = await response.json();
    console.log('Resposta Evolution:', JSON.stringify(evolutionData, null, 2));

    // Normalize response - can be array or single object
    let bots: any[] = [];
    if (Array.isArray(evolutionData)) {
      bots = evolutionData;
    } else if (evolutionData && typeof evolutionData === 'object') {
      // Single bot object
      bots = [evolutionData];
    }

    // Map to friendly format
    const mappedBots = bots.map((bot: any) => ({
      id: bot.id || bot.openaiCredsId,
      enabled: bot.enabled ?? true,
      model: bot.model || bot.openaiCredsId || 'gpt-4o-mini',
      triggerType: bot.triggerType || 'keyword',
      triggerValue: bot.triggerValue || bot.triggerOperator || '',
      triggerOperator: bot.triggerOperator || 'contains',
      expire: bot.expire || 0,
      keywordFinish: bot.keywordFinish || '#sair',
      stopBotFromMe: bot.stopBotFromMe ?? true,
      keepOpen: bot.keepOpen ?? false,
      debounceTime: bot.debounceTime || 10,
      createdAt: bot.createdAt || null,
      updatedAt: bot.updatedAt || null,
      // Info adicional
      delayMessage: bot.delayMessage || 1000,
      splitMessages: bot.splitMessages ?? false,
      timePerChar: bot.timePerChar || 0,
      listeningFromMe: bot.listeningFromMe ?? false,
    }));

    console.log(`Encontrados ${mappedBots.length} bots`);

    return new Response(JSON.stringify({ 
      bots: mappedBots,
      instanceName,
      total: mappedBots.length
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
