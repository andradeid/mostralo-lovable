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

    const { configId, botType, evolutionBotId } = await req.json();
    
    if (!configId || !botType) {
      throw new Error('configId and botType are required');
    }

    console.log(`🗑️ Deletando bot ${botType} com Evolution ID: ${evolutionBotId}`);

    // Buscar configuração
    const { data: config, error: configError } = await supabase
      .from('master_whatsapp_config')
      .select('*')
      .eq('id', configId)
      .single();

    if (configError || !config) {
      throw new Error('Config not found');
    }

    // Buscar Evolution Config
    const { data: evolutionConfig } = await supabase
      .from('evolution_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!evolutionConfig) {
      throw new Error('Evolution config not found');
    }

    const evolutionUrl = evolutionConfig.api_url.replace(/\/$/, '');
    const instanceName = config.instance_name;

    if (!instanceName) {
      throw new Error('Instance name not configured');
    }

    // Deletar bot na Evolution API
    let deletedFromEvolution = false;
    
    if (evolutionBotId) {
      try {
        console.log(`🔄 Deletando bot ${evolutionBotId} da instância ${instanceName}...`);
        
        const deleteResp = await fetch(`${evolutionUrl}/openai/delete/${instanceName}/${evolutionBotId}`, {
          method: 'DELETE',
          headers: { 'apikey': evolutionConfig.api_key },
        });
        
        const deleteText = await deleteResp.text();
        console.log(`📥 Resposta delete: ${deleteResp.status} - ${deleteText}`);
        
        deletedFromEvolution = deleteResp.ok || deleteResp.status === 404;
      } catch (e) {
        console.error('⚠️ Erro ao deletar bot da Evolution:', e);
      }
    }

    // Limpar ID do bot no banco
    const updateField = `${botType}_bot_evolution_id`;
    
    const { error: updateError } = await supabase
      .from('master_whatsapp_config')
      .update({ [updateField]: null })
      .eq('id', configId);

    if (updateError) {
      console.error('❌ Erro ao atualizar config:', updateError);
      throw new Error('Failed to update config');
    }

    console.log(`✅ Bot ${botType} deletado com sucesso`);

    return new Response(JSON.stringify({ 
      success: true, 
      deletedFromEvolution,
      message: `Bot ${botType} removido com sucesso`
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
