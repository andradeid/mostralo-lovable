// Manage OpenAI Assistant - v1.0.0
// Gerencia OpenAI Assistants para o modo Inteligente v2
// Cria, atualiza e deleta Assistants com function calling

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssistantRequest {
  action: 'create' | 'update' | 'delete';
  storeId: string;
  customInstructions?: string;
}

// Definição das tools (functions) do Assistant
const ASSISTANT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Busca produtos no catálogo por nome ou termo. Use sempre que o cliente perguntar sobre um produto específico.',
      parameters: {
        type: 'object',
        properties: {
          query: { 
            type: 'string', 
            description: 'Termo de busca (nome do produto, ingrediente, etc.)' 
          },
          limit: { 
            type: 'number', 
            description: 'Quantidade máxima de resultados (padrão: 5)' 
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_stock',
      description: 'Verifica a disponibilidade e quantidade em estoque de um produto específico.',
      parameters: {
        type: 'object',
        properties: {
          product_name: { 
            type: 'string', 
            description: 'Nome do produto para verificar estoque' 
          },
        },
        required: ['product_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_product_details',
      description: 'Obtém detalhes completos de um produto específico pelo slug.',
      parameters: {
        type: 'object',
        properties: {
          slug: { 
            type: 'string', 
            description: 'Slug/identificador do produto' 
          },
        },
        required: ['slug'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_categories',
      description: 'Lista todas as categorias de produtos disponíveis na loja.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_promotions',
      description: 'Retorna produtos que estão em promoção/oferta.',
      parameters: {
        type: 'object',
        properties: {
          limit: { 
            type: 'number', 
            description: 'Quantidade máxima de resultados (padrão: 5)' 
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recommendations',
      description: 'Retorna produtos recomendados/em destaque pela loja. Use quando o cliente pedir sugestões.',
      parameters: {
        type: 'object',
        properties: {
          limit: { 
            type: 'number', 
            description: 'Quantidade máxima de resultados (padrão: 5)' 
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_store_info',
      description: 'Obtém informações da loja como endereço, horários, formas de pagamento e link de navegação.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_store_status',
      description: 'Verifica em tempo real se a loja está aberta ou fechada agora, considerando o fuso horário da loja. Use SEMPRE quando o cliente perguntar "está aberto?", "vocês estão funcionando?", "posso fazer pedido agora?" ou similares.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_current_greeting',
      description: 'Obtém a saudação correta baseada no horário atual da loja (Bom dia, Boa tarde, Boa noite ou Boa madrugada). Use SEMPRE na PRIMEIRA mensagem ao cliente para saudá-lo corretamente. Você DEVE chamar esta função antes de responder à primeira mensagem do cliente.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, storeId, customInstructions } = await req.json() as AssistantRequest;

    console.log(`[manage-openai-assistant] Action: ${action}, Store: ${storeId}`);

    // Buscar loja e configuração do bot
    const [storeRes, configRes] = await Promise.all([
      supabase
        .from('stores')
        .select(`
          id, name, slug, description, address, city, state,
          whatsapp, phone, business_hours, openai_api_key,
          delivery_fee, min_order_value,
          accepts_pix, accepts_card, accepts_cash,
          latitude, longitude,
          custom_domain, custom_domain_verified
        `)
        .eq('id', storeId)
        .single(),
      supabase
        .from('store_configurations')
        .select('delivery_zones')
        .eq('store_id', storeId)
        .maybeSingle(),
    ]);

    const store = storeRes.data;
    const storeError = storeRes.error;
    const deliveryZones = (configRes.data?.delivery_zones as any[]) || [];

    if (storeError || !store) {
      return new Response(JSON.stringify({ error: 'Loja não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar permissão
    const { data: roleCheck } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'master_admin')
      .single();

    const isMasterAdmin = !!roleCheck;
    
    const { data: storeOwnerCheck } = await supabase
      .from('stores')
      .select('owner_id')
      .eq('id', storeId)
      .single();

    if (!isMasterAdmin && storeOwnerCheck?.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar API Key OpenAI
    if (!store.openai_api_key) {
      return new Response(JSON.stringify({ 
        error: 'API Key OpenAI não configurada para esta loja' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar config do bot
    const { data: botConfig } = await supabase
      .from('store_bot_config')
      .select('*')
      .eq('store_id', storeId)
      .single();

    const botName = botConfig?.bot_name || 'Assistente Virtual';

    // Determinar base URL
    const baseUrl = store.custom_domain && store.custom_domain_verified
      ? `https://${store.custom_domain}`
      : 'https://mostralo.com.br';

    const storeLink = `${baseUrl}/loja/${store.slug}`;

    // Construir link de navegação (sem address para encurtar)
    let navigationLink = '';
    if (store.latitude && store.longitude) {
      navigationLink = `${baseUrl}/navegar?lat=${store.latitude}&lng=${store.longitude}&store=${store.slug}`;
    }

    // Formatar horários
    const formatBusinessHours = (hours: any): string => {
      if (!hours) return 'Não informado';
      if (typeof hours === 'string') return hours;
      
      try {
        const formatted: string[] = [];
        for (const [key, value] of Object.entries(hours)) {
          if (value && typeof value === 'object') {
            const dayValue = value as any;
            if (dayValue.open && dayValue.close) {
              formatted.push(`${key}: ${dayValue.open} - ${dayValue.close}`);
            } else if (dayValue.closed) {
              formatted.push(`${key}: Fechado`);
            }
          }
        }
        return formatted.length > 0 ? formatted.join('\n') : 'Não informado';
      } catch {
        return 'Não informado';
      }
    };

    // Formatar pagamentos
    const formatPaymentMethods = (): string => {
      const methods: string[] = [];
      if (store.accepts_pix !== false) methods.push('PIX');
      if (store.accepts_card !== false) methods.push('Cartão');
      if (store.accepts_cash !== false) methods.push('Dinheiro');
      return methods.length > 0 ? methods.join(', ') : 'Consulte a loja';
    };

    // Gerar prompt do Assistant
    const generateAssistantInstructions = (): string => {
      const customPart = customInstructions || botConfig?.custom_prompt_instructions || '';
      
      return `Você é ${botName}, assistente virtual da ${store.name}.

CAPACIDADES (use as funções disponíveis):
- Buscar produtos: search_products("termo")
- Verificar estoque: check_stock("nome produto")
- Ver detalhes: get_product_details("slug")
- Listar categorias: list_categories()
- Mostrar promoções: get_promotions()
- Recomendar produtos: get_recommendations()
- Informações da loja: get_store_info()
- Verificar se está aberto: check_store_status()

REGRAS IMPORTANTES:
1. SEMPRE use search_products antes de falar sobre produtos específicos
2. Se perguntarem "tem X?", use check_stock para verificar disponibilidade real
3. NÃO invente produtos - só use dados retornados pelas funções
4. SEMPRE inclua o LINK do produto nas respostas
5. Se pedirem sugestão/recomendação, use get_recommendations()
6. Se não encontrar um produto, sugira buscar com outros termos
7. Quando pedirem localização/endereço, use get_store_info() e envie o link de navegação
8. Se perguntarem "está aberto?", "vocês estão funcionando?", "posso fazer pedido agora?", SEMPRE use check_store_status() para verificar em tempo real

FORMATAÇÃO OBRIGATÓRIA DE PRODUTOS:
Ao listar produtos, use EXATAMENTE este formato limpo:

1. *Dipirona 1000mg 30cps* - R$ 37,80
   👉 https://mostralo.com.br/loja/farmacia/produto/dipirona

2. *Vitamina C 1g* - R$ 25,90
   👉 https://mostralo.com.br/loja/farmacia/produto/vitamina-c

REGRAS DE FORMATAÇÃO (OBRIGATÓRIO):
- NÃO use colchetes [ ] em nenhuma parte do texto
- NÃO use parênteses ( ) ao redor de links
- NÃO use formato markdown de link como [texto](url) ou (url)
- O link deve estar SOZINHO na linha, sem parênteses
- Use asterisco simples *nome* para negrito (não duplo **)
- Separe cada produto com uma linha em branco
- Coloque um emoji 👉 antes do link para destacar

${customPart ? `INSTRUÇÕES PERSONALIZADAS:\n${customPart}\n` : ''}
INFORMAÇÕES DA LOJA:
- Nome: ${store.name}
- Descrição: ${store.description || 'Loja de qualidade'}
- Endereço: ${store.address || 'Não informado'} - ${store.city || ''}/${store.state || ''}
- WhatsApp: ${store.whatsapp || 'Não informado'}
- Link do catálogo: ${storeLink}
${navigationLink ? `- Link de navegação: ${navigationLink}` : ''}

HORÁRIO DE FUNCIONAMENTO:
${formatBusinessHours(store.business_hours)}

FORMAS DE PAGAMENTO:
${formatPaymentMethods()}

DELIVERY:
- Taxa de entrega: ${store.delivery_fee ? `R$ ${store.delivery_fee.toFixed(2)}` : 'Consulte na loja'}
- Pedido mínimo: ${store.min_order_value ? `R$ ${store.min_order_value.toFixed(2)}` : 'Sem valor mínimo'}

INSTRUÇÕES GERAIS:
1. Responda sempre em português brasileiro
2. Seja acolhedor e prestativo
3. Quando o cliente perguntar seu nome, diga: "Meu nome é ${botName}!"
4. Na primeira mensagem, envie o link do catálogo
5. Quando pedirem localização, envie o link de navegação (cliente escolhe Google Maps, Waze ou Uber)
6. Informe horários e formas de pagamento quando perguntado`;
    };

    // ========================================
    // EXECUTAR AÇÃO
    // ========================================

    if (action === 'delete') {
      // Deletar Assistant existente
      if (!botConfig?.openai_assistant_id) {
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Nenhum Assistant para deletar' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const deleteResp = await fetch(
          `https://api.openai.com/v1/assistants/${botConfig.openai_assistant_id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${store.openai_api_key}`,
              'OpenAI-Beta': 'assistants=v2',
            },
          }
        );

        if (!deleteResp.ok && deleteResp.status !== 404) {
          const errorText = await deleteResp.text();
          console.error('Erro ao deletar Assistant:', errorText);
        }

        // Limpar ID do banco
        await supabase
          .from('store_bot_config')
          .update({ 
            openai_assistant_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('store_id', storeId);

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Assistant deletado com sucesso' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Erro ao deletar Assistant:', error);
        return new Response(JSON.stringify({ 
          error: 'Erro ao deletar Assistant' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (action === 'update') {
      // Atualizar Assistant existente
      if (!botConfig?.openai_assistant_id) {
        return new Response(JSON.stringify({ 
          error: 'Nenhum Assistant para atualizar. Crie um primeiro.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const updateResp = await fetch(
          `https://api.openai.com/v1/assistants/${botConfig.openai_assistant_id}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${store.openai_api_key}`,
              'Content-Type': 'application/json',
              'OpenAI-Beta': 'assistants=v2',
            },
            body: JSON.stringify({
              name: `${botName} - ${store.name}`,
              instructions: generateAssistantInstructions(),
              tools: ASSISTANT_TOOLS,
              model: 'gpt-4o-mini',
            }),
          }
        );

        if (!updateResp.ok) {
          const errorText = await updateResp.text();
          console.error('Erro ao atualizar Assistant:', errorText);
          return new Response(JSON.stringify({ 
            error: 'Erro ao atualizar Assistant na OpenAI' 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const assistant = await updateResp.json();

        // Atualizar instruções no banco
        await supabase
          .from('store_bot_config')
          .update({ 
            custom_prompt_instructions: customInstructions,
            updated_at: new Date().toISOString(),
          })
          .eq('store_id', storeId);

        return new Response(JSON.stringify({ 
          success: true, 
          assistantId: assistant.id,
          message: 'Assistant atualizado com sucesso' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Erro ao atualizar Assistant:', error);
        return new Response(JSON.stringify({ 
          error: 'Erro ao atualizar Assistant' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (action === 'create') {
      // Criar novo Assistant
      // Se já existe, atualizar em vez de criar
      if (botConfig?.openai_assistant_id) {
        console.log('Assistant já existe, atualizando...');
        
        try {
          const updateResp = await fetch(
            `https://api.openai.com/v1/assistants/${botConfig.openai_assistant_id}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${store.openai_api_key}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2',
              },
              body: JSON.stringify({
                name: `${botName} - ${store.name}`,
                instructions: generateAssistantInstructions(),
                tools: ASSISTANT_TOOLS,
                model: 'gpt-4o-mini',
              }),
            }
          );

          if (updateResp.ok) {
            const assistant = await updateResp.json();
            return new Response(JSON.stringify({ 
              success: true, 
              assistantId: assistant.id,
              message: 'Assistant atualizado com sucesso',
              created: false,
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          // Se falhou, tentar criar novo
          console.log('Update falhou, criando novo Assistant...');
        } catch (error) {
          console.log('Erro no update, tentando criar novo:', error);
        }
      }

      try {
        const createResp = await fetch('https://api.openai.com/v1/assistants', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${store.openai_api_key}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2',
          },
          body: JSON.stringify({
            name: `${botName} - ${store.name}`,
            instructions: generateAssistantInstructions(),
            tools: ASSISTANT_TOOLS,
            model: 'gpt-4o-mini',
          }),
        });

        if (!createResp.ok) {
          const errorText = await createResp.text();
          console.error('Erro ao criar Assistant:', errorText);
          return new Response(JSON.stringify({ 
            error: 'Erro ao criar Assistant na OpenAI',
            details: errorText,
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const assistant = await createResp.json();
        console.log('Assistant criado:', assistant.id);

        // Salvar ID no banco
        if (botConfig?.id) {
          await supabase
            .from('store_bot_config')
            .update({ 
              openai_assistant_id: assistant.id,
              bot_mode: 'assistant',
              custom_prompt_instructions: customInstructions,
              updated_at: new Date().toISOString(),
            })
            .eq('id', botConfig.id);
        } else {
          // Criar config se não existe
          await supabase
            .from('store_bot_config')
            .insert({
              store_id: storeId,
              openai_assistant_id: assistant.id,
              bot_mode: 'assistant',
              custom_prompt_instructions: customInstructions,
              enabled: false,
              bot_name: botName,
            });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          assistantId: assistant.id,
          message: 'Assistant criado com sucesso',
          created: true,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Erro ao criar Assistant:', error);
        return new Response(JSON.stringify({ 
          error: 'Erro ao criar Assistant' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ 
      error: 'Ação inválida. Use: create, update ou delete' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[manage-openai-assistant] Erro:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro interno' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
