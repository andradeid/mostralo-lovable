// Optimize Bot Prompt - Usa a OpenAI da loja para reestruturar e otimizar o prompt do assistente
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { storeId, rawPrompt } = await req.json();

    if (!storeId || !rawPrompt) {
      return new Response(JSON.stringify({ error: 'storeId e rawPrompt são obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar OpenAI API key da loja
    const { data: store, error: storeErr } = await supabaseClient
      .from('stores')
      .select('openai_api_key, name')
      .eq('id', storeId)
      .single();

    if (storeErr || !store?.openai_api_key) {
      return new Response(JSON.stringify({ error: 'Chave OpenAI não configurada na loja' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[optimize-bot-prompt] 🧠 Otimizando prompt para loja ${store.name} (${rawPrompt.length} chars)`);

    const systemPrompt = `Você é um engenheiro de prompts sênior especializado em assistentes de WhatsApp Business com OpenAI Assistants API.

Sua tarefa: transformar o prompt bruto abaixo em um prompt PROFISSIONAL, ENXUTO e de ALTA PERFORMANCE para um assistente de IA.

## FORMATO DE SAÍDA OBRIGATÓRIO

O prompt otimizado DEVE seguir esta estrutura exata (adapte o conteúdo):

---
## 🤖 IDENTIDADE
Você é [NOME], assistente virtual da [LOJA]. [1 frase sobre personalidade e tom].

## 🎯 MISSÃO
[1-2 frases objetivas sobre o papel do assistente]

## 🗣️ ESTILO DE COMUNICAÇÃO
- **Tom**: [descrever em 1 linha]
- **Emojis**: [nível de uso]
- **Formato**: Respostas curtas e diretas, máximo 3 parágrafos por mensagem

## 📍 DADOS DA LOJA
- **Nome**: [nome]
- **Endereço**: [endereço completo]
- **WhatsApp**: [número]
- **Link da loja**: [URL]
- **Google Maps**: [URL]
- **Horário**: [horários compactos]
- **Pagamento**: [formas aceitas em 1 linha]

## 🚚 DELIVERY
[Tabela compacta ou lista das áreas com taxas - agrupar valores iguais quando possível]
- Pedido mínimo: [valor]

## 📋 REGRAS DE ATENDIMENTO
1. [regra direta e acionável]
2. [regra direta e acionável]
[máximo 8-10 regras, sem repetições]

## 🔧 USO DE FERRAMENTAS
- Use \`search_products\` para buscar produtos no catálogo
- Use \`check_stock\` para verificar preço e disponibilidade
[listar APENAS as ferramentas que existem no prompt original]

## ❌ PROIBIÇÕES
- NUNCA invente produtos, preços ou informações
- NUNCA responda sobre assuntos fora do contexto da loja
- [outras proibições relevantes do original]

## 💬 FLUXO DE ATENDIMENTO
1. Saudação → Identificar necessidade
2. Buscar produto → Apresentar com link
3. Se não encontrar → Sugerir alternativas ou direcionar ao link da loja
4. Encerrar com cordialidade
---

## REGRAS DE OTIMIZAÇÃO

### PRESERVAR (copiar exatamente):
- Todos os URLs, links e números de telefone
- Nome do assistente e da loja
- Endereço completo e coordenadas GPS
- Todas as áreas de entrega com seus valores exatos
- Nomes de ferramentas (tools) exatamente como estão

### MELHORAR:
- Eliminar redundâncias e repetições (muitos prompts repetem a mesma regra 3-4 vezes)
- Transformar parágrafos longos em bullets objetivos
- Agrupar áreas de entrega com mesmo valor (ex: "Céu Azul, São Bernardo, Campus 2: R$ 10 / R$ 15 noturno")
- Simplificar horários repetitivos (ex: "24h todos os dias" ao invés de listar cada dia)
- Regras devem ser diretas: "Faça X" ou "Nunca faça Y" — sem explicações desnecessárias

### REMOVER:
- Seções vazias ou sem conteúdo útil
- Instruções óbvias que qualquer LLM já sabe (ex: "responda em português")
- Repetições de uma mesma regra em diferentes seções

## ⚠️ TERMINOLOGIA PROIBIDA
A palavra "cardápio" é PROIBIDA. Esta plataforma atende farmácias, pet shops, lojas de roupa, etc.
- "cardápio" → "loja online" ou "catálogo"
- "link do cardápio" → "link da loja"
- "ver o cardápio" → "ver nossos produtos" ou "acessar a loja"

## QUALIDADE ESPERADA
O prompt final deve ser:
- ≤60% do tamanho original (eliminar gordura)
- Claro o suficiente para qualquer LLM seguir sem ambiguidade
- Profissional mas mantendo a personalidade definida
- Pronto para uso imediato no OpenAI Assistants API

Responda APENAS com o prompt otimizado. Sem explicações, sem comentários, sem "aqui está o prompt".`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${store.openai_api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: rawPrompt },
        ],
        temperature: 0.2,
        max_tokens: 6000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[optimize-bot-prompt] ❌ OpenAI error: ${response.status} ${errText.substring(0, 200)}`);
      return new Response(JSON.stringify({ error: `Erro da OpenAI: ${response.status}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    let optimizedPrompt = data.choices?.[0]?.message?.content;

    if (!optimizedPrompt) {
      return new Response(JSON.stringify({ error: 'Resposta vazia da OpenAI' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Pós-processamento: remover qualquer "cardápio" que a IA tenha deixado passar
    optimizedPrompt = optimizedPrompt
      .replace(/link\s+do\s+cardápio\s+(digital|online)?/gi, 'link da loja online')
      .replace(/cardápio\s+digital/gi, 'loja online')
      .replace(/cardápio\s+online/gi, 'loja online')
      .replace(/cardápio/gi, 'loja online');

    console.log(`[optimize-bot-prompt] ✅ Prompt otimizado: ${rawPrompt.length} → ${optimizedPrompt.length} chars`);

    return new Response(JSON.stringify({ 
      optimizedPrompt,
      originalLength: rawPrompt.length,
      optimizedLength: optimizedPrompt.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[optimize-bot-prompt] ❌ Erro:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
