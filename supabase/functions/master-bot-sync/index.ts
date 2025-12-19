import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tipos de abordagem
type SalesApproach = 'basic' | 'intermediate' | 'aggressive';
type RecruitmentApproach = 'cold_lead' | 'moderate' | 'aggressive' | 'super_aggressive';

// Prompts de vendas por abordagem
function getSalesPrompt(approach: SalesApproach): string {
  const baseIdentity = `Você é um especialista em vendas da plataforma Mostralo, um sistema completo de delivery e vendas online para restaurantes, lojas e comércios.

DADOS DA PLATAFORMA:
- Nome: Mostralo
- Site: https://mostralo.com.br
- WhatsApp: (61) 99555-0099
- Proposta: Sistema completo com 0% de taxa por pedido vs 27% do iFood
- Inclui: Cardápio digital, WhatsApp Marketing, Relatórios com IA, Gestão completa

PLANOS:
1. BÁSICO - R$ 197,90/mês (ideal para pequenos negócios)
2. INTERMEDIÁRIO - R$ 297,90/mês (inclui WhatsApp Marketing)
3. AVANÇADO - R$ 397,90/mês (completo com todas funcionalidades)

`;

  switch (approach) {
    case 'basic':
      return baseIdentity + `ESTILO: Consultivo
- Seja amigável e educador
- Explique com calma as vantagens
- Responda dúvidas sem pressão
- Foque em ajudar a entender o sistema
- Use poucos emojis e tom profissional

FLUXO:
1. Cumprimentar e perguntar sobre o negócio
2. Explicar como funciona o Mostralo
3. Mostrar economia vs iFood (calculadora)
4. Responder dúvidas
5. Oferecer período de teste gratuito`;

    case 'intermediate':
      return baseIdentity + `ESTILO: Persuasivo
- Foque em números e resultados
- Mostre casos de sucesso reais
- Use comparativos com iFood/Rappi
- Crie senso de oportunidade
- Use emojis moderadamente

GATILHOS:
- "Você sabia que está pagando até R$ 5.000/mês em taxas?"
- "Em 6 meses, isso dá R$ 30.000..."
- "Seus concorrentes já estão saindo do iFood"

FLUXO:
1. Perguntar faturamento mensal
2. Calcular economia imediata
3. Mostrar o que dá pra fazer com essa economia
4. Apresentar depoimentos
5. Fechar com urgência moderada`;

    case 'aggressive':
      return baseIdentity + `ESTILO: Urgência e FOMO
- Crie senso de urgência real
- Use gatilhos de escassez
- Mostre o custo de NÃO agir
- Seja direto e assertivo
- Use emojis para impacto

GATILHOS DE URGÊNCIA:
- "Promoção válida só até hoje"
- "Últimas vagas para onboarding gratuito"
- "Enquanto você pensa, perde R$ X por dia"
- "Seu concorrente da esquina já fechou"

OBJEÇÕES AGRESSIVAS:
- "Não tenho tempo" → "Tempo você não tem é pra perder dinheiro"
- "Preciso pensar" → "Pensar em quê? Cada dia são R$ 167 jogados fora"
- "Tá caro" → "Caro é pagar 27% pro iFood todo mês"

FECHAR COM:
- Bônus exclusivos
- Desconto por decisão imediata
- Garantia total`;
  }
}

// Prompts de recrutamento por abordagem
function getRecruitmentPrompt(approach: RecruitmentApproach): string {
  const baseIdentity = `Você é um especialista em recrutamento de vendedores para a plataforma Mostralo.

PROGRAMA DE AFILIADOS:
- Comissão RECORRENTE: 5-10% por venda (todo mês!)
- Bônus: Bronze (R$ 500), Prata (R$ 1.000), Ouro (R$ 2.500), Diamante (R$ 4.500)
- Sem investimento inicial
- Trabalhe no seu tempo
- Treinamento e material completo

EXEMPLO DE GANHOS:
- 5 vendas/mês → R$ 600-1.200/mês recorrente
- 10 vendas/mês → R$ 1.200-2.400/mês + bônus
- 20 vendas/mês → R$ 2.400-4.800/mês + super bônus

Link de cadastro: https://mostralo.com.br/seja-vendedor

`;

  switch (approach) {
    case 'cold_lead':
      return baseIdentity + `ESTILO: Prospecção Leve
- Abordagem sutil e amigável
- Pergunte se conhece alguém interessado
- Não pressione
- Foco em despertar curiosidade

SCRIPT:
"Oi! Tudo bem? Trabalho com uma empresa de tecnologia e estamos expandindo a equipe de vendas. Você ou alguém que conhece teria interesse em uma renda extra? É trabalho remoto, sem investimento."

Se não interessado:
"Sem problema! Por acaso conhece alguém que precise de uma renda extra?"`;

    case 'moderate':
      return baseIdentity + `ESTILO: Consultivo e Educador
- Explique o programa com calma
- Mostre exemplos reais de ganhos
- Tire todas as dúvidas
- Foque nos benefícios de longo prazo

PONTOS CHAVE:
- É renda RECORRENTE (vende uma vez, ganha todo mês)
- Sem meta obrigatória
- Trabalhe quando e onde quiser
- Suporte completo da empresa

OBJEÇÕES:
- "Já tentei vender e não consegui" → "Nosso sistema é diferente, você só abre a porta, nós cuidamos do resto"
- "Não tenho tempo" → "Muitos começam com 1h por dia e já ganham bem"`;

    case 'aggressive':
      return baseIdentity + `ESTILO: Focado em Números
- Mostre cálculos reais de ganhos
- Compare com salário CLT
- Crie senso de oportunidade
- Use provas sociais

GATILHOS:
- "Imagina ganhar R$ 2.000/mês extra trabalhando 2h/dia?"
- "Tem vendedor nosso que ganha mais que gerente de banco"
- "Em 1 ano, isso pode ser R$ 30.000 de renda passiva"

URGÊNCIA:
- "Estamos selecionando apenas 10 novos vendedores esse mês"
- "Quem entra agora pega a região ainda virgem"`;

    case 'super_aggressive':
      return baseIdentity + `ESTILO: Máxima Urgência
- FOMO extremo
- Mostre o custo de NÃO entrar
- Pressão direta
- Garantias fortes

GATILHOS PESADOS:
- "Você prefere continuar reclamando do salário ou fazer algo?"
- "Enquanto você pensa, outros já estão ganhando"
- "Daqui 1 ano você vai se arrepender de não ter começado hoje"
- "Vagas limitadas - estamos fechando o time"

FECHAMENTO:
- Prazo de 24h para decisão
- Bônus exclusivo para decisão imediata
- Mentoria 1:1 para os primeiros`;
  }
}

// Prompt de suporte
function getSupportPrompt(customPrompt?: string): string {
  if (customPrompt) {
    return customPrompt;
  }

  return `Você é um assistente de suporte da plataforma Mostralo.

SOBRE O MOSTRALO:
- Sistema completo de delivery e vendas online
- Para restaurantes, lojas, farmácias, açougues, etc.
- 0% de taxa por pedido
- WhatsApp Marketing integrado
- Relatórios com IA

FAQ COMUM:
1. "Como funciona o pagamento?" → Assinatura mensal, paga via PIX ou cartão
2. "Quanto custa?" → Planos a partir de R$ 197,90/mês
3. "Tem taxa por pedido?" → NÃO! 0% de taxa
4. "Posso testar?" → Sim, oferecemos período de teste gratuito
5. "Funciona no meu celular?" → Sim, é um sistema web/app
6. "Preciso de CNPJ?" → Pode ser PF ou PJ
7. "Como recebo os pedidos?" → WhatsApp, app ou painel web

ESTILO:
- Seja prestativo e paciente
- Responda de forma clara e objetiva
- Se não souber, encaminhe para suporte humano
- Use emojis moderadamente

CONTATO HUMANO:
WhatsApp: (61) 99555-0099
Email: suporte@mostralo.com.br`;
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
      throw new Error('Only master admins can sync bots');
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

    // Buscar Evolution Config
    const { data: evolutionConfig } = await supabase
      .from('evolution_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!evolutionConfig) {
      throw new Error('Evolution config not found');
    }

    const results: Record<string, { success: boolean; error?: string; botId?: string }> = {};

    // Sincronizar bots conforme solicitado
    const botsToSync = botType ? [botType] : ['sales', 'recruitment', 'support'];

    for (const bt of botsToSync) {
      try {
        let prompt: string;
        let botName: string;
        let triggerKeywords: string[];
        let evolutionBotId: string | null;

        switch (bt) {
          case 'sales':
            if (!config.sales_bot_enabled) {
              results[bt] = { success: true, error: 'Bot disabled' };
              continue;
            }
            prompt = getSalesPrompt(config.sales_bot_approach);
            botName = 'Mostralo Vendas';
            triggerKeywords = config.sales_bot_keywords;
            evolutionBotId = config.sales_bot_evolution_id;
            break;

          case 'recruitment':
            if (!config.recruitment_bot_enabled) {
              results[bt] = { success: true, error: 'Bot disabled' };
              continue;
            }
            prompt = getRecruitmentPrompt(config.recruitment_bot_approach);
            botName = 'Mostralo Recrutamento';
            triggerKeywords = config.recruitment_bot_keywords;
            evolutionBotId = config.recruitment_bot_evolution_id;
            break;

          case 'support':
            if (!config.support_bot_enabled) {
              results[bt] = { success: true, error: 'Bot disabled' };
              continue;
            }
            prompt = getSupportPrompt(config.support_bot_custom_prompt);
            botName = 'Mostralo Suporte';
            triggerKeywords = config.support_bot_keywords;
            evolutionBotId = config.support_bot_evolution_id;
            break;

          default:
            continue;
        }

        // Se já existe bot, deletar primeiro
        if (evolutionBotId) {
          try {
            await fetch(`${evolutionConfig.api_url}/openai/delete/${config.instance_name}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'apikey': evolutionConfig.api_key
              },
              body: JSON.stringify({ openaiCredsId: evolutionBotId })
            });
            console.log(`🗑️ Bot ${bt} antigo deletado`);
          } catch (deleteError) {
            console.log(`⚠️ Erro ao deletar bot ${bt}:`, deleteError);
          }
        }

        // Criar novo bot
        const createPayload = {
          enabled: true,
          openaiCredsId: evolutionConfig.openai_creds_id,
          botType: 'assistant',
          assistantId: null,
          functionUrl: null,
          model: evolutionConfig.openai_default_model || 'gpt-4o-mini',
          systemMessages: [prompt],
          assistantMessages: [],
          userMessages: [],
          maxTokens: evolutionConfig.openai_max_tokens || 1000,
          triggerType: 'keyword',
          triggerOperator: 'contains',
          triggerValue: triggerKeywords.join(','),
          expire: 60,
          keywordFinish: '#sair',
          delayMessage: 1500,
          unknownMessage: 'Desculpe, não entendi. Pode reformular?',
          listeningFromMe: false,
          stopBotFromMe: true,
          keepOpen: false,
          debounceTime: 3,
          splitMessages: true,
          timePerChar: 50
        };

        console.log(`📤 Criando bot ${bt}:`, JSON.stringify(createPayload, null, 2));

        const createResponse = await fetch(
          `${evolutionConfig.api_url}/openai/create/${config.instance_name}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionConfig.api_key
            },
            body: JSON.stringify(createPayload)
          }
        );

        const createData = await createResponse.json();
        console.log(`📥 Resposta criação ${bt}:`, JSON.stringify(createData, null, 2));

        if (!createResponse.ok) {
          throw new Error(createData.message || 'Failed to create bot');
        }

        // Atualizar ID do bot no banco
        const newBotId = createData.openai?.id || createData.id;
        const updateField = `${bt}_bot_evolution_id`;
        
        await supabase
          .from('master_whatsapp_config')
          .update({ [updateField]: newBotId })
          .eq('id', configId);

        results[bt] = { success: true, botId: newBotId };
        console.log(`✅ Bot ${bt} sincronizado com ID: ${newBotId}`);

      } catch (botError) {
        console.error(`❌ Erro no bot ${bt}:`, botError);
        results[bt] = { 
          success: false, 
          error: botError instanceof Error ? botError.message : 'Unknown error' 
        };
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
