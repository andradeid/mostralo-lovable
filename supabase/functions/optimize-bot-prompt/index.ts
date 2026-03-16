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

    const { storeId, rawPrompt, nicheDescription, assistantName } = await req.json();

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

    console.log(`[optimize-bot-prompt] 🧠 Otimizando prompt para loja ${store.name} (${rawPrompt.length} chars, nicho: ${nicheDescription?.length || 0} chars)`);

    // Construir contexto extra do nicho/identidade
    let nicheContext = '';
    if (nicheDescription || assistantName) {
      nicheContext = `\n\n## CONTEXTO ADICIONAL DO LOJISTA (USE PARA ENRIQUECER A IDENTIDADE)\n`;
      if (assistantName) nicheContext += `- Nome do assistente definido pelo lojista: "${assistantName}"\n`;
      if (nicheDescription) nicheContext += `- Descrição do nicho e perfil de atendimento fornecida pelo lojista: "${nicheDescription}"\n`;
      nicheContext += `\nIMPORTANTE: Use estas informações para criar uma identidade RICA e CONTEXTUALIZADA na seção "IDENTIDADE" do prompt otimizado. 
Por exemplo, se o lojista disse "farmácia com 30 anos de experiência", transforme isso em algo como:
"Você é [Nome], atendente virtual da [Loja] — uma farmácia com mais de 30 anos de tradição no bairro. Seu conhecimento abrange medicamentos genéricos, manipulados, orientação sobre princípios ativos e alternativas mais acessíveis."
NÃO ignore esta descrição. Ela é a essência da personalidade e especialização do assistente.`;
    }

    const systemPrompt = `Você é um engenheiro de prompts sênior especializado em assistentes de WhatsApp Business com OpenAI Assistants API.

Sua tarefa: transformar o prompt bruto abaixo em um prompt PROFISSIONAL, ENXUTO e de ALTA PERFORMANCE para um assistente de IA.
${nicheContext}

## FORMATO DE SAÍDA OBRIGATÓRIO

O prompt otimizado DEVE seguir esta estrutura exata (adapte o conteúdo):
...
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
