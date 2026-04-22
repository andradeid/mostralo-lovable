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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Autenticar usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid token');
    }

    // Verificar se é master admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profile?.user_type !== 'master_admin') {
      throw new Error('Only master admins can delete bots');
    }

    const { configId } = await req.json();
    
    if (!configId) {
      throw new Error('configId is required');
    }

    // Buscar configuração
    const { data: config, error: configError } = await supabase
      .from('master_whatsapp_config')
      .select('unified_openai_assistant_id, openai_api_key')
      .eq('id', configId)
      .single();

    if (configError || !config) {
      throw new Error('Config not found');
    }

    let deletedFromOpenAI = false;

    // Deletar Assistant na OpenAI diretamente
    if (config.unified_openai_assistant_id && config.openai_api_key) {
      try {
        console.log(`🗑️ Deletando Assistant ${config.unified_openai_assistant_id} da OpenAI...`);
        
        const deleteResp = await fetch(
          `https://api.openai.com/v1/assistants/${config.unified_openai_assistant_id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${config.openai_api_key}`,
              'OpenAI-Beta': 'assistants=v2',
            },
          }
        );
        
        const deleteText = await deleteResp.text();
        console.log(`📥 Resposta delete: ${deleteResp.status} - ${deleteText.substring(0, 200)}`);
        
        deletedFromOpenAI = deleteResp.ok || deleteResp.status === 404;
      } catch (e) {
        console.error('⚠️ Erro ao deletar Assistant da OpenAI:', e);
      }
    }

    // Limpar IDs no banco
    const { error: updateError } = await supabase
      .from('master_whatsapp_config')
      .update({
        unified_openai_assistant_id: null,
        sales_bot_evolution_id: null,
        recruitment_bot_evolution_id: null,
        support_bot_evolution_id: null,
        sales_openai_assistant_id: null,
        recruitment_openai_assistant_id: null,
        support_openai_assistant_id: null,
      })
      .eq('id', configId);

    if (updateError) {
      console.error('❌ Erro ao atualizar config:', updateError);
      throw new Error('Failed to update config');
    }

    console.log(`✅ Assistente IA Master deletado com sucesso`);

    return new Response(JSON.stringify({ 
      success: true, 
      deletedFromOpenAI,
      message: 'Assistente IA Master removido com sucesso'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
