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

    const systemPrompt = `Você é um especialista em engenharia de prompts para assistentes virtuais de WhatsApp Business. 
Sua tarefa é reestruturar e otimizar o prompt fornecido, mantendo TODAS as informações e regras originais, mas melhorando:

1. **Estrutura**: Organize em seções claras com headers ## e sub-headers ###
2. **Clareza**: Reescreva instruções ambíguas de forma mais direta e acionável
3. **Consolidação**: Agrupe regras relacionadas, eliminando repetições
4. **Exemplos**: Adicione 3-4 exemplos práticos de fluxo de atendimento baseados nas regras
5. **Output Format**: Adicione uma seção descrevendo o formato esperado das respostas
6. **Lembrete final**: Adicione um lembrete reforçando as regras mais críticas

REGRAS IMPORTANTES:
- MANTENHA todas as informações da loja (endereço, horários, áreas de entrega, taxas, etc.) EXATAMENTE como estão
- MANTENHA todos os links e URLs exatamente como estão
- MANTENHA todas as regras e restrições sem alterar o significado
- MANTENHA o nome do assistente e personalidade
- MANTENHA as ferramentas (tools) listadas com seus nomes exatos
- NÃO invente informações novas
- NÃO remova informações existentes
- NUNCA use a palavra "cardápio" ou "cardápio digital". Substitua SEMPRE por "loja", "catálogo" ou "produtos". A plataforma atende diversos nichos de negócio, não apenas restaurantes.
- Responda APENAS com o prompt otimizado, sem explicações adicionais
- Use formatação Markdown limpa
- Para horários repetitivos (todos os dias iguais), simplifique para "Todos os dias, HH:MM-HH:MM"
- Para áreas de entrega, mantenha a lista completa mas em formato mais compacto se possível`;

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
          { role: 'user', content: `Reestruture e otimize este prompt de assistente virtual:\n\n${rawPrompt}` },
        ],
        temperature: 0.3,
        max_tokens: 8000,
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
    const optimizedPrompt = data.choices?.[0]?.message?.content;

    if (!optimizedPrompt) {
      return new Response(JSON.stringify({ error: 'Resposta vazia da OpenAI' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
