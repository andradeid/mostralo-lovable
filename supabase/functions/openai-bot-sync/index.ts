import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BotConfig {
  storeId: string;
  instanceName: string;
  botName: string;
  stopBotFromMe: boolean;
  listeningFromMe: boolean;
  delayMessage: number;
  expireMinutes: number;
  keywordFinish: string;
  unknownMessage: string;
  keepOpen: boolean;
  debounceTime: number;
  triggerType: string;
  triggerOperator: string;
  triggerValue: string;
  ignoreJids: string[];
  splitMessages?: boolean;
  timePerChar?: number;
}

function generateSystemPrompt(botName: string, store: any, products: any[], categories: any[]): string {
  const productList = products
    .filter(p => p.is_available)
    .map(p => `- ${p.name}: R$ ${p.price?.toFixed(2)} - ${p.description || 'Sem descrição'}`)
    .join('\n');

  const categoryList = categories
    .filter(c => c.is_active)
    .map(c => c.name)
    .join(', ');

  const storeLink = `https://mostralo.com.br/loja/${store.slug}`;

  return `Você é ${botName}, o assistente virtual da ${store.name || 'loja'}.

Quando o cliente perguntar seu nome, responda: "Meu nome é ${botName}! 😊"

INFORMAÇÕES DA LOJA:
- Nome: ${store.name || 'Loja'}
- Descrição: ${store.description || 'Delivery de qualidade'}
- Endereço: ${store.address || 'Não informado'}
- WhatsApp: ${store.whatsapp || 'Não informado'}
- Link do cardápio: ${storeLink}

CATEGORIAS DISPONÍVEIS:
${categoryList || 'Não há categorias cadastradas'}

PRODUTOS DISPONÍVEIS:
${productList || 'Não há produtos cadastrados'}

INSTRUÇÕES:
1. Seja cordial e prestativo
2. Apresente os produtos quando perguntado
3. Informe preços corretamente
4. Direcione o cliente para o cardápio online: ${storeLink}
5. Para finalizar pedido, peça para acessar o link do cardápio
6. Não invente produtos ou preços
7. Se não souber algo, direcione ao link do cardápio
8. Responda sempre em português brasileiro
9. Use emojis moderadamente para deixar a conversa mais amigável
10. Mencione promoções se houver

ENCERRAMENTO:
- Quando o cliente digitar a palavra de encerramento, agradeça e finalize
- Sempre deseje uma boa experiência ao cliente`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, config } = await req.json() as { action: string; config: BotConfig };

    // Buscar loja do usuário
    const { data: store, error: storeError } = await supabaseClient
      .from('stores')
      .select('*')
      .eq('id', config.storeId)
      .single();

    if (storeError || !store) {
      return new Response(JSON.stringify({ error: 'Loja não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se é dono da loja ou master_admin
    const isMasterAdmin = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'master_admin')
      .single();

    if (!isMasterAdmin.data && store.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar Evolution config
    const { data: evolutionConfig, error: configError } = await supabaseClient
      .from('evolution_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !evolutionConfig) {
      return new Response(JSON.stringify({ error: 'Evolution API não configurada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!evolutionConfig.openai_creds_id) {
      return new Response(JSON.stringify({ error: 'Credenciais OpenAI não configuradas' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar produtos e categorias
    const { data: products } = await supabaseClient
      .from('products')
      .select('*')
      .eq('store_id', config.storeId)
      .eq('is_available', true);

    const { data: categories } = await supabaseClient
      .from('categories')
      .select('*')
      .eq('store_id', config.storeId)
      .eq('is_active', true);

    // Gerar system prompt com botName
    const botName = config.botName || 'Assistente';
    const systemPrompt = generateSystemPrompt(botName, store, products || [], categories || []);

    const evolutionUrl = evolutionConfig.api_url.replace(/\/$/, '');

    // Buscar config existente do bot
    const { data: existingBotConfig } = await supabaseClient
      .from('store_bot_config')
      .select('*')
      .eq('store_id', config.storeId)
      .single();

    if (action === 'create' || action === 'update') {
      // Garantir que credenciais OpenAI existam para esta instância
      // Evolution API requer credenciais por instância
      console.log(`Verificando credenciais OpenAI para instância: ${config.instanceName}`);
      
      let credsId = evolutionConfig.openai_creds_id;
      
      // Verificar se credenciais já existem para esta instância
      const credsCheckResp = await fetch(`${evolutionUrl}/openai/creds/${config.instanceName}`, {
        method: 'GET',
        headers: { 'apikey': evolutionConfig.api_key },
      });
      
      if (!credsCheckResp.ok || credsCheckResp.status === 404) {
        // Criar credenciais para esta instância
        console.log(`Criando credenciais OpenAI para instância: ${config.instanceName}`);
        
        const credsPayload = {
          name: 'mostralo-openai',
          apiKey: evolutionConfig.openai_api_key,
        };
        
        const createCredsResp = await fetch(`${evolutionUrl}/openai/creds/${config.instanceName}`, {
          method: 'POST',
          headers: {
            'apikey': evolutionConfig.api_key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credsPayload),
        });
        
        if (createCredsResp.ok) {
          const credsData = await createCredsResp.json();
          credsId = credsData.id || credsData.openaiCreds?.id;
          console.log(`Credenciais criadas com ID: ${credsId}`);
        } else {
          const credsError = await createCredsResp.text();
          console.error('Erro ao criar credenciais:', credsError);
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Falha ao criar credenciais OpenAI: ${credsError}` 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        // Credenciais já existem, buscar o ID
        const existingCreds = await credsCheckResp.json();
        if (Array.isArray(existingCreds) && existingCreds.length > 0) {
          credsId = existingCreds[0].id;
          console.log(`Credenciais existentes encontradas: ${credsId}`);
        } else if (existingCreds?.id) {
          credsId = existingCreds.id;
          console.log(`Credencial existente encontrada: ${credsId}`);
        }
      }

      // Payload para criar bot na Evolution
      // Nota: splitMessages e timePerChar não são suportados pela Evolution API atual
      const botPayload: any = {
        enabled: true,
        openaiCredsId: credsId,
        botType: 'chatCompletion',
        model: evolutionConfig.openai_default_model || 'gpt-4o-mini',
        maxTokens: evolutionConfig.openai_max_tokens || 1000,
        systemMessages: [systemPrompt],
        assistantMessages: [],
        userMessages: [],
        triggerType: config.triggerType || 'all',
        triggerOperator: config.triggerOperator || 'contains',
        triggerValue: config.triggerValue || '',
        expire: config.expireMinutes || 20,
        keywordFinish: config.keywordFinish || '#SAIR',
        delayMessage: config.delayMessage || 1500,
        unknownMessage: config.unknownMessage || 'Desculpe, não entendi. Digite #SAIR para encerrar ou acesse nosso cardápio online.',
        listeningFromMe: config.listeningFromMe || false,
        stopBotFromMe: config.stopBotFromMe !== undefined ? config.stopBotFromMe : true,
        keepOpen: config.keepOpen || false,
        debounceTime: config.debounceTime || 10,
        ignoreJids: config.ignoreJids || [],
      };

      let botId = existingBotConfig?.evolution_bot_id;

      // Estratégia delete+create para garantir que model seja persistido
      // Se existe bot, deletar primeiro
      if (botId) {
        console.log(`Deletando bot existente: ${botId}`);
        try {
          const deleteResp = await fetch(`${evolutionUrl}/openai/delete/${botId}/${config.instanceName}`, {
            method: 'DELETE',
            headers: {
              'apikey': evolutionConfig.api_key,
            },
          });
          console.log(`Resposta delete: ${deleteResp.status}`);
        } catch (e) {
          console.log('Erro ao deletar bot (continuando):', e);
        }
        botId = null;
      }

      // Criar novo bot (garantindo que model seja persistido)
      console.log(`Criando bot para instância: ${config.instanceName}`);
      console.log(`Payload:`, JSON.stringify(botPayload, null, 2));
      
      const response = await fetch(`${evolutionUrl}/openai/create/${config.instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': evolutionConfig.api_key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(botPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro Evolution:', errorText);
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Falha na Evolution API: ${errorText}` 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const botData = await response.json();
      console.log('Resposta criação bot:', JSON.stringify(botData));
      botId = botData.id || botData.openaiBot?.id;

      // Salvar no banco
      const botConfigData = {
        store_id: config.storeId,
        whatsapp_instance_id: null,
        enabled: true,
        bot_name: config.botName,
        stop_bot_from_me: config.stopBotFromMe,
        listening_from_me: config.listeningFromMe,
        delay_message: config.delayMessage,
        expire_minutes: config.expireMinutes,
        keyword_finish: config.keywordFinish,
        unknown_message: config.unknownMessage,
        keep_open: config.keepOpen,
        debounce_time: config.debounceTime,
        trigger_type: config.triggerType,
        trigger_operator: config.triggerOperator,
        trigger_value: config.triggerValue,
        ignore_jids: config.ignoreJids,
        bot_split_messages: config.splitMessages !== undefined ? config.splitMessages : true,
        bot_time_per_char: config.timePerChar || 0,
        evolution_bot_id: botId,
        evolution_bot_status: 'active',
        updated_at: new Date().toISOString(),
      };

      if (existingBotConfig) {
        await supabaseClient
          .from('store_bot_config')
          .update(botConfigData)
          .eq('id', existingBotConfig.id);
      } else {
        await supabaseClient
          .from('store_bot_config')
          .insert(botConfigData);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Bot sincronizado com sucesso!',
        botId 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      if (existingBotConfig?.evolution_bot_id) {
        // Deletar da Evolution (URL correta: /delete/{botId}/{instanceName})
        await fetch(`${evolutionUrl}/openai/delete/${existingBotConfig.evolution_bot_id}/${config.instanceName}`, {
          method: 'DELETE',
          headers: {
            'apikey': evolutionConfig.api_key,
          },
        });
      }

      // Atualizar banco
      await supabaseClient
        .from('store_bot_config')
        .update({
          enabled: false,
          evolution_bot_id: null,
          evolution_bot_status: 'deleted',
          updated_at: new Date().toISOString(),
        })
        .eq('store_id', config.storeId);

      return new Response(JSON.stringify({ success: true, message: 'Bot removido!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
