import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiagnosticAnswers {
  q1: 'a' | 'b' | 'c';
  q2: 'a' | 'b' | 'c';
  q3: 'a' | 'b' | 'c';
  q4: 'a' | 'b' | 'c' | 'd';
}

interface RequestBody {
  leadName: string;
  companyName: string;
  answers: DiagnosticAnswers;
  score: number;
  level: 'elite' | 'potential' | 'disqualified';
}

function generatePersonalizedScript(data: RequestBody): string {
  const { leadName, companyName, answers, level } = data;
  const firstName = leadName.split(' ')[0];
  
  // ============================================
  // FRAMEWORK PAS: PROBLEM - AGITATE - SOLVE
  // ============================================
  
  // 1. ABERTURA COM GANCHO (Pattern Interrupt + Suspense)
  const opening = `${firstName}! Aqui é o Marcos Andrade, da Mostralo. Acabei de analisar pessoalmente o diagnóstico da ${companyName} e preciso te contar uma coisa...`;
  
  // 2. VALIDAÇÃO DO MAIOR DESAFIO - Q4 (Espelhamento + Empatia)
  let painValidation = '';
  switch (answers.q4) {
    case 'a': // Reduzir custos
      painValidation = `Você disse que seu maior desafio é reduzir custos com funcionários e erros. Eu te entendo perfeitamente. Folha de pagamento que só cresce, funcionário que falta, pedido errado... é dinheiro escorrendo pelo ralo todo dia.`;
      break;
    case 'b': // Atrair clientes
      painValidation = `Você disse que precisa atrair mais clientes qualificados. E olha, esse é o desafio número um de 80% dos lojistas que chegam até mim. Você investe em divulgação mas parece que o retorno nunca vem, não é?`;
      break;
    case 'c': // Escalar/franquear
      painValidation = `Você quer escalar sua operação e abrir novas unidades. Isso me mostra que você pensa grande! Mas deixa eu te perguntar: como você vai replicar o que funciona se cada atendente faz de um jeito diferente?`;
      break;
    case 'd': // Melhorar experiência
      painValidation = `Você quer melhorar a experiência do cliente. Isso mostra que você entende o jogo! Cliente satisfeito volta e indica. Mas como garantir um atendimento impecável quando você não consegue estar em todo lugar ao mesmo tempo?`;
      break;
    default:
      painValidation = `Analisei o diagnóstico da ${companyName} e identifiquei pontos críticos que estão travando seu crescimento.`;
  }
  
  // 3. AGITAR A DOR - Q1, Q2, Q3 (Gatilho de Perda + Urgência)
  const painPoints: string[] = [];
  
  // Q1 - Google Shopping
  if (answers.q1 === 'b') {
    painPoints.push(`E tem mais: enquanto a gente conversa, dezenas de pessoas estão pesquisando exatamente o que você vende no Google. Só que elas não encontram a ${companyName}. Estão comprando do seu concorrente. Todo. Santo. Dia.`);
  } else if (answers.q1 === 'c') {
    painPoints.push(`E olha, tem um canal de vendas poderoso que você ainda nem explorou: o Google Shopping. Seus concorrentes estão lá, aparecendo pra quem já quer comprar, e a ${companyName} está invisível.`);
  }
  
  // Q2 - WhatsApp/IA
  if (answers.q2 === 'a') {
    painPoints.push(`Além disso, cada mensagem no WhatsApp que demora mais de 5 minutos pra responder é uma venda que você perdeu. O cliente já foi pro próximo. E isso está acontecendo agora mesmo.`);
  } else if (answers.q2 === 'b') {
    painPoints.push(`Seus funcionários estão sobrecarregados respondendo WhatsApp, fazendo trabalho repetitivo, enquanto poderiam estar fechando vendas de maior valor. É retrabalho que custa caro.`);
  }
  
  // Q3 - Upsell
  if (answers.q3 === 'a') {
    painPoints.push(`E quando o cliente compra, você depende da boa vontade do atendente pra oferecer mais. Resultado? Ticket médio baixo e dinheiro que poderia ser seu ficando na mesa.`);
  } else if (answers.q3 === 'b') {
    painPoints.push(`Vi que você tenta fazer upsell, mas não é automático. Isso significa que você está deixando dinheiro na mesa em cada venda.`);
  }
  
  // Combinar dores (máximo 2 para não ficar longo demais)
  const painAgitation = painPoints.slice(0, 2).join(' ');
  
  // 4. VIRADA - APRESENTAR A SOLUÇÃO (Contraste + Benefício Quantificado)
  let solutionIntro = `Mas a boa notícia é que isso tem solução. E é exatamente isso que o Mostralo faz.`;
  
  // Benefício principal baseado na maior dor
  let mainBenefit = '';
  if (answers.q1 === 'b' || answers.q1 === 'c') {
    mainBenefit = `Seus produtos aparecem automaticamente no Google Shopping, na frente de quem está pronto pra comprar. Sem você precisar fazer nada.`;
  } else if (answers.q2 === 'a' || answers.q2 === 'b') {
    mainBenefit = `Uma inteligência artificial atende seus clientes no WhatsApp 24 horas, 7 dias por semana, sem você pagar um centavo de hora extra. Ela responde, tira dúvidas e até fecha vendas.`;
  } else if (answers.q3 === 'a' || answers.q3 === 'b') {
    mainBenefit = `O sistema sugere automaticamente produtos complementares em cada venda, aumentando seu ticket médio em até 25%. É como ter um vendedor campeão que nunca esquece de oferecer mais.`;
  } else {
    mainBenefit = `A gente automatiza seu atendimento, coloca você no Google Shopping e aumenta seu ticket médio com upsell inteligente. Tudo integrado.`;
  }
  
  // 5. PROVA SOCIAL (Resultado Específico + Timeframe)
  const socialProof = `Lojistas como você já aumentaram o faturamento em até 40% nos primeiros 90 dias usando essas mesmas estratégias.`;
  
  // 6. CTA COM URGÊNCIA E ESCASSEZ
  let cta = '';
  if (level === 'elite') {
    cta = `${firstName}, pela sua pontuação no diagnóstico, você foi qualificado para o Programa de Aceleração Elite. Isso significa mentoria direta comigo e isenção da taxa de implementação. Mas atenção: só tenho 5 vagas por semana. Clica agora no botão Agendar Consultoria que aparece na tela e garante a sua. Te vejo do outro lado!`;
  } else {
    cta = `${firstName}, você foi qualificado para o Programa de Aceleração Mostralo. Tenho um horário especial reservado pra você essa semana. Clica no botão Agendar Consultoria e vamos desenhar juntos o plano de crescimento da ${companyName}. Te espero!`;
  }
  
  // MONTAR SCRIPT FINAL (Framework PAS completo)
  const scriptParts = [
    opening,
    painValidation,
    painAgitation,
    solutionIntro,
    mainBenefit,
    socialProof,
    cta
  ].filter(Boolean);
  
  return scriptParts.join(' ');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      throw new Error('OpenAI API key not configured');
    }

    const body: RequestBody = await req.json();
    console.log('Generating personalized audio for:', body.leadName, body.companyName);
    
    // Gerar script personalizado
    const text = generatePersonalizedScript(body);
    console.log('Generated script length:', text.length, 'characters');
    
    // Chamar OpenAI TTS API
    // Usando voz "onyx" - voz masculina profunda e profissional
    const response = await fetch(
      'https://api.openai.com/v1/audio/speech',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: 'onyx',
          response_format: 'mp3',
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI TTS API error:', response.status, errorText);
      throw new Error(`OpenAI TTS API error: ${response.status}`);
    }

    // Converter para base64
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = base64Encode(audioBuffer);
    
    console.log('Audio generated successfully, size:', audioBuffer.byteLength, 'bytes');

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        scriptLength: text.length,
        success: true 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in diagnostic-call function:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
