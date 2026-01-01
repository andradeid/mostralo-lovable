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
  
  // Saudação inicial baseada no nível
  let greeting = '';
  if (level === 'elite') {
    greeting = `Olá, ${leadName}! Aqui é o Marcos Andrade da Mostralo! Parabéns! A ${companyName} tem uma operação com altíssimo potencial de escala!`;
  } else {
    greeting = `Olá, ${leadName}! Aqui é o Marcos Andrade da Mostralo! A ${companyName} está no caminho certo e identificamos oportunidades incríveis para você!`;
  }
  
  // Personalização baseada na Q1 (Google Shopping)
  let q1Text = '';
  if (answers.q1 === 'b') {
    q1Text = `Percebi que sua loja ainda não aparece no Google Shopping. Isso significa que você está perdendo clientes todos os dias que poderiam estar comprando de você! Vou te mostrar como resolver isso rapidinho.`;
  } else if (answers.q1 === 'c') {
    q1Text = `Vi que você ainda não sabe como aparecer no Google Shopping. Não se preocupe, vou te mostrar exatamente como fazer isso de forma simples e eficiente!`;
  }
  
  // Personalização baseada na Q2 (WhatsApp/IA)
  let q2Text = '';
  if (answers.q2 === 'a') {
    q2Text = `E sobre o WhatsApp, você mencionou que perde vendas por demora no atendimento. Nossa IA resolve isso completamente, atendendo 24 horas, tirando dúvidas e até fechando vendas sozinha!`;
  } else if (answers.q2 === 'b') {
    q2Text = `Vi que seus funcionários estão sobrecarregados no WhatsApp. Com nossa automação inteligente, eles vão poder focar no que realmente importa enquanto a IA cuida do básico.`;
  }
  
  // Personalização baseada na Q3 (Upsell)
  let q3Text = '';
  if (answers.q3 === 'a') {
    q3Text = `Também notei que o upsell na sua operação depende só da proatividade do atendente. Com o Mostralo, isso fica automático e você pode aumentar seu ticket médio em até 25%!`;
  } else if (answers.q3 === 'b') {
    q3Text = `Vi que você já tenta fazer upsell, mas não é automatizado. Deixa eu te mostrar como a gente resolve isso de forma inteligente!`;
  }
  
  // CTA final baseado no nível
  let cta = '';
  if (level === 'elite') {
    cta = `${leadName}, você foi qualificado para o nosso Programa de Aceleração Elite! Isso significa isenção total da taxa de setup e mentoria personalizada comigo. Clique agora em Agendar Consultoria e vamos conversar sobre como transformar a ${companyName} em uma máquina de vendas! Te vejo em breve!`;
  } else {
    cta = `${leadName}, você foi qualificado para o Programa de Aceleração Mostralo! Clique em Agendar Consultoria para conversarmos sobre as oportunidades que identificamos para a ${companyName}. Te espero lá!`;
  }
  
  // Montar script completo
  const parts = [greeting, q1Text, q2Text, q3Text, cta].filter(Boolean);
  return parts.join(' ');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_API_KEY not configured');
      throw new Error('ElevenLabs API key not configured');
    }

    const body: RequestBody = await req.json();
    console.log('Generating personalized audio for:', body.leadName, body.companyName);
    
    // Gerar script personalizado
    const text = generatePersonalizedScript(body);
    console.log('Generated script length:', text.length, 'characters');
    
    // Chamar ElevenLabs API
    // Usando voz "Brian" (nPczCjzI2devNBz1zQrb) - voz masculina profissional
    const voiceId = 'nPczCjzI2devNBz1zQrb';
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
            speed: 1.0,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
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
