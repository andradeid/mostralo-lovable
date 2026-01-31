import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BotPromptInfo {
  prompt: string | null;
  model: string | null;
  botId: string | null;
  exists: boolean;
  botName: string | null;
}

interface FetchPromptsResponse {
  success: boolean;
  prompts: {
    sales: BotPromptInfo;
    recruitment: BotPromptInfo;
    support: BotPromptInfo;
  };
  error?: string;
}

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
      throw new Error('Only master admins can fetch bot prompts');
    }

    const { configId, botType } = await req.json();
    
    if (!configId) {
      throw new Error('configId is required');
    }

    // Buscar configuração
    const { data: config, error: configError } = await supabase
      .from('master_whatsapp_config')
      .select('*')
      .eq('id', configId)
      .single();

    if (configError || !config) {
      throw new Error('Config not found');
    }

    if (!config.instance_name) {
      throw new Error('Instance name not configured');
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

    // Buscar bots existentes na Evolution
    console.log('🔍 Buscando bots na Evolution para instância:', config.instance_name);
    
    let existingBots: any[] = [];
    try {
      const findResp = await fetch(`${evolutionUrl}/openai/find/${config.instance_name}`, {
        method: 'GET',
        headers: { 'apikey': evolutionConfig.api_key },
      });

      if (findResp.ok) {
        const data = await findResp.json();
        existingBots = Array.isArray(data) ? data : (data?.bots || data?.data || []);
        console.log('📋 Bots encontrados:', existingBots.length);
      } else {
        console.log('⚠️ Falha ao buscar bots:', findResp.status);
      }
    } catch (e) {
      console.log('⚠️ Erro ao buscar bots:', e);
    }

    // Mapear bots por ID armazenado no config
    const botMapping: Record<string, BotPromptInfo> = {
      sales: { prompt: null, model: null, botId: null, exists: false, botName: null },
      recruitment: { prompt: null, model: null, botId: null, exists: false, botName: null },
      support: { prompt: null, model: null, botId: null, exists: false, botName: null },
    };

    // IDs salvos no banco
    const botIds = {
      sales: config.sales_bot_evolution_id,
      recruitment: config.recruitment_bot_evolution_id,
      support: config.support_bot_evolution_id,
    };

    // Procurar cada bot pelo ID
    for (const [type, evolutionId] of Object.entries(botIds)) {
      if (!evolutionId) continue;

      const foundBot = existingBots.find((bot: any) => bot.id === evolutionId);
      
      if (foundBot) {
        const systemMessages = foundBot.systemMessages || [];
        const prompt = Array.isArray(systemMessages) && systemMessages.length > 0 
          ? systemMessages[0] 
          : (typeof systemMessages === 'string' ? systemMessages : null);

        botMapping[type] = {
          prompt,
          model: foundBot.model || null,
          botId: foundBot.id,
          exists: true,
          botName: foundBot.botType === 'assistant' 
            ? `Assistant (${foundBot.assistantId || 'N/A'})` 
            : foundBot.description || 'Bot OpenAI',
        };
        
        console.log(`✅ Bot ${type} encontrado:`, foundBot.id, '- Model:', foundBot.model);
      } else {
        console.log(`⚠️ Bot ${type} com ID ${evolutionId} não encontrado na Evolution`);
      }
    }

    // Também tentar encontrar por nome do bot (fallback)
    const botNames = {
      sales: 'Mostralo Vendas',
      recruitment: 'Mostralo Recrutamento',
      support: 'Mostralo Suporte',
    };

    for (const [type, name] of Object.entries(botNames)) {
      if (botMapping[type].exists) continue; // Já encontrado por ID

      const foundByName = existingBots.find((bot: any) => 
        bot.description === name || bot.name === name
      );

      if (foundByName) {
        const systemMessages = foundByName.systemMessages || [];
        const prompt = Array.isArray(systemMessages) && systemMessages.length > 0 
          ? systemMessages[0] 
          : (typeof systemMessages === 'string' ? systemMessages : null);

        botMapping[type] = {
          prompt,
          model: foundByName.model || null,
          botId: foundByName.id,
          exists: true,
          botName: name,
        };
        
        console.log(`✅ Bot ${type} encontrado por nome:`, foundByName.id);
      }
    }

    const response: FetchPromptsResponse = {
      success: true,
      prompts: {
        sales: botMapping.sales,
        recruitment: botMapping.recruitment,
        support: botMapping.support,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        prompts: {
          sales: { prompt: null, model: null, botId: null, exists: false, botName: null },
          recruitment: { prompt: null, model: null, botId: null, exists: false, botName: null },
          support: { prompt: null, model: null, botId: null, exists: false, botName: null },
        }
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
