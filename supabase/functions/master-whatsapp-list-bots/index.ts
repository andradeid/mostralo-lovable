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

    // Get master whatsapp config
    const { data: masterConfig } = await supabase
      .from('master_whatsapp_config')
      .select('unified_openai_assistant_id, openai_api_key, instance_name, updated_at')
      .eq('admin_user_id', user.id)
      .single();

    if (!masterConfig) {
      return new Response(JSON.stringify({ assistant: null, message: 'Configuração não encontrada' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const assistantId = masterConfig.unified_openai_assistant_id;
    const openaiApiKey = masterConfig.openai_api_key;

    if (!assistantId || !openaiApiKey) {
      return new Response(JSON.stringify({ 
        assistant: null, 
        message: 'Assistente não configurado. Sincronize primeiro.',
        instanceName: masterConfig.instance_name,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar status do Assistant na OpenAI
    console.log(`🔍 Verificando Assistant ${assistantId}...`);
    
    let assistantData: any = null;
    try {
      const resp = await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      });

      if (resp.ok) {
        const data = await resp.json();
        assistantData = {
          id: data.id,
          name: data.name,
          model: data.model,
          tools_count: (data.tools || []).length,
          created_at: data.created_at ? new Date(data.created_at * 1000).toISOString() : null,
        };
        console.log(`✅ Assistant ativo: ${data.name} (${data.model})`);
      } else {
        const errText = await resp.text();
        console.log(`⚠️ Assistant não encontrado: ${resp.status} - ${errText.substring(0, 100)}`);
      }
    } catch (e) {
      console.error('⚠️ Erro ao verificar Assistant:', e);
    }

    return new Response(JSON.stringify({ 
      assistant: assistantData,
      instanceName: masterConfig.instance_name,
      lastSync: masterConfig.updated_at,
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
