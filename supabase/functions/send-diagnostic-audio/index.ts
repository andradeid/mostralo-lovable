import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
  phone: string;
  answers: DiagnosticAnswers;
  score: number;
  level: 'elite' | 'potential' | 'disqualified';
}

function generatePersonalizedScript(data: RequestBody): string {
  const { leadName, companyName, answers, level } = data;
  const firstName = leadName.split(' ')[0];
  
  // FRAMEWORK PAS: PROBLEM - AGITATE - SOLVE
  const opening = `${firstName}! Aqui é o Marcos Andrade, da Mostralo. Acabei de analisar pessoalmente o diagnóstico da ${companyName} e preciso te contar uma coisa...`;
  
  let painValidation = '';
  switch (answers.q4) {
    case 'a':
      painValidation = `Você disse que seu maior desafio é reduzir custos com funcionários e erros. Eu te entendo perfeitamente. Folha de pagamento que só cresce, funcionário que falta, pedido errado... é dinheiro escorrendo pelo ralo todo dia.`;
      break;
    case 'b':
      painValidation = `Você disse que precisa atrair mais clientes qualificados. E olha, esse é o desafio número um de 80% dos lojistas que chegam até mim. Você investe em divulgação mas parece que o retorno nunca vem, não é?`;
      break;
    case 'c':
      painValidation = `Você quer escalar sua operação e abrir novas unidades. Isso me mostra que você pensa grande! Mas deixa eu te perguntar: como você vai replicar o que funciona se cada atendente faz de um jeito diferente?`;
      break;
    case 'd':
      painValidation = `Você quer melhorar a experiência do cliente. Isso mostra que você entende o jogo! Cliente satisfeito volta e indica. Mas como garantir um atendimento impecável quando você não consegue estar em todo lugar ao mesmo tempo?`;
      break;
    default:
      painValidation = `Analisei o diagnóstico da ${companyName} e identifiquei pontos críticos que estão travando seu crescimento.`;
  }
  
  const painPoints: string[] = [];
  
  if (answers.q1 === 'b') {
    painPoints.push(`E tem mais: enquanto a gente conversa, dezenas de pessoas estão pesquisando exatamente o que você vende no Google. Só que elas não encontram a ${companyName}. Estão comprando do seu concorrente. Todo. Santo. Dia.`);
  } else if (answers.q1 === 'c') {
    painPoints.push(`E olha, tem um canal de vendas poderoso que você ainda nem explorou: o Google Shopping. Seus concorrentes estão lá, aparecendo pra quem já quer comprar, e a ${companyName} está invisível.`);
  }
  
  if (answers.q2 === 'a') {
    painPoints.push(`Além disso, cada mensagem no WhatsApp que demora mais de 5 minutos pra responder é uma venda que você perdeu. O cliente já foi pro próximo. E isso está acontecendo agora mesmo.`);
  } else if (answers.q2 === 'b') {
    painPoints.push(`Seus funcionários estão sobrecarregados respondendo WhatsApp, fazendo trabalho repetitivo, enquanto poderiam estar fechando vendas de maior valor. É retrabalho que custa caro.`);
  }
  
  if (answers.q3 === 'a') {
    painPoints.push(`E quando o cliente compra, você depende da boa vontade do atendente pra oferecer mais. Resultado? Ticket médio baixo e dinheiro que poderia ser seu ficando na mesa.`);
  } else if (answers.q3 === 'b') {
    painPoints.push(`Vi que você tenta fazer upsell, mas não é automático. Isso significa que você está deixando dinheiro na mesa em cada venda.`);
  }
  
  const painAgitation = painPoints.slice(0, 2).join(' ');
  
  const solutionIntro = `Mas a boa notícia é que isso tem solução. E é exatamente isso que o Mostralo faz.`;
  
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
  
  const socialProof = `Lojistas como você já aumentaram o faturamento em até 40% nos primeiros 90 dias usando essas mesmas estratégias.`;
  
  let cta = '';
  if (level === 'elite') {
    cta = `${firstName}, pela sua pontuação no diagnóstico, você foi qualificado para o Programa de Aceleração Elite. Isso significa mentoria direta comigo e isenção da taxa de implementação. Mas atenção: só tenho 5 vagas por semana. Clica agora no botão Agendar Consultoria que aparece na tela e garante a sua. Te vejo do outro lado!`;
  } else {
    cta = `${firstName}, você foi qualificado para o Programa de Aceleração Mostralo. Tenho um horário especial reservado pra você essa semana. Clica no botão Agendar Consultoria e vamos desenhar juntos o plano de crescimento da ${companyName}. Te espero!`;
  }
  
  const scriptParts = [opening, painValidation, painAgitation, solutionIntro, mainBenefit, socialProof, cta].filter(Boolean);
  return scriptParts.join(' ');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    console.log('[send-diagnostic-audio] Iniciando para:', body.leadName, body.phone);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!OPENAI_API_KEY) {
      console.error('[send-diagnostic-audio] OPENAI_API_KEY não configurada');
      throw new Error('OpenAI API key not configured');
    }

    // Buscar configuração master do WhatsApp
    const { data: masterConfig, error: masterError } = await supabase
      .from('master_whatsapp_config')
      .select('*')
      .limit(1)
      .single();

    if (masterError || !masterConfig) {
      console.log('[send-diagnostic-audio] Config master não encontrada');
      return new Response(JSON.stringify({ success: false, reason: 'no_master_config' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se instância está conectada
    if (masterConfig.instance_status !== 'open' && masterConfig.instance_status !== 'connected') {
      console.log('[send-diagnostic-audio] Instância não conectada:', masterConfig.instance_status);
      return new Response(JSON.stringify({ success: false, reason: 'not_connected' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar config da Evolution API
    const { data: evolutionConfig, error: evolutionError } = await supabase
      .from('evolution_config')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (evolutionError || !evolutionConfig) {
      console.error('[send-diagnostic-audio] Evolution config não encontrada');
      return new Response(JSON.stringify({ success: false, reason: 'no_evolution_config' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Gerar script personalizado
    const script = generatePersonalizedScript(body);
    console.log('[send-diagnostic-audio] Script gerado, chars:', script.length);

    // Gerar áudio via OpenAI TTS
    console.log('[send-diagnostic-audio] Gerando áudio via OpenAI TTS...');
    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: script,
        voice: 'onyx',
        response_format: 'mp3',
      }),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('[send-diagnostic-audio] OpenAI TTS error:', ttsResponse.status, errorText);
      throw new Error(`OpenAI TTS API error: ${ttsResponse.status}`);
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);
    console.log('[send-diagnostic-audio] Áudio gerado, bytes:', audioBytes.length);

    // Upload do áudio para Supabase Storage
    const fileName = `diagnostic_${Date.now()}_${body.phone.replace(/\D/g, '')}.mp3`;
    const { error: uploadError } = await supabase.storage
      .from('diagnostic-audios')
      .upload(fileName, audioBytes, {
        contentType: 'audio/mpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('[send-diagnostic-audio] Erro ao fazer upload:', uploadError);
      throw new Error(`Storage upload error: ${uploadError.message}`);
    }

    console.log('[send-diagnostic-audio] Áudio uploaded:', fileName);

    // Gerar signed URL (válida por 1 hora)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('diagnostic-audios')
      .createSignedUrl(fileName, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('[send-diagnostic-audio] Erro ao gerar signed URL:', signedUrlError);
      throw new Error('Failed to generate signed URL');
    }

    const audioUrl = signedUrlData.signedUrl;
    console.log('[send-diagnostic-audio] Signed URL gerada');

    // Preparar número do lead
    const leadPhone = body.phone.replace(/\D/g, '');
    const fullLeadNumber = leadPhone.startsWith('55') ? leadPhone : `55${leadPhone}`;

    // Evolution API config
    const apiUrl = evolutionConfig.api_url.replace(/\/$/, '');
    const instanceName = masterConfig.instance_name;

    // 1. Enviar mensagem de texto primeiro
    const firstName = body.leadName.split(' ')[0];
    const welcomeMessage = `Olá ${firstName}! 👋

Aqui é o *Marcos Andrade*, da Mostralo.

Acabei de analisar pessoalmente o diagnóstico da *${body.companyName}* e gravei um áudio especial pra você!

🎧 Ouça com atenção, tem informações importantes sobre como podemos aumentar o faturamento da sua loja.`;

    console.log('[send-diagnostic-audio] Enviando mensagem de texto para:', fullLeadNumber);

    const textResponse = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionConfig.api_key
      },
      body: JSON.stringify({
        number: fullLeadNumber,
        text: welcomeMessage
      })
    });

    if (!textResponse.ok) {
      const textError = await textResponse.text();
      console.error('[send-diagnostic-audio] Erro ao enviar texto:', textError);
      // Continua mesmo se falhar o texto
    } else {
      console.log('[send-diagnostic-audio] Mensagem de texto enviada!');
    }

    // Pequena pausa antes de enviar o áudio
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 2. Enviar áudio via Evolution API
    console.log('[send-diagnostic-audio] Enviando áudio...');

    const audioResponse = await fetch(`${apiUrl}/message/sendWhatsAppAudio/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionConfig.api_key
      },
      body: JSON.stringify({
        number: fullLeadNumber,
        audio: audioUrl,
        encoding: true
      })
    });

    const audioResult = await audioResponse.json();

    if (!audioResponse.ok) {
      console.error('[send-diagnostic-audio] Erro ao enviar áudio:', audioResult);
      // Tentar método alternativo - sendMedia
      console.log('[send-diagnostic-audio] Tentando método alternativo sendMedia...');
      
      const mediaResponse = await fetch(`${apiUrl}/message/sendMedia/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionConfig.api_key
        },
        body: JSON.stringify({
          number: fullLeadNumber,
          mediatype: 'audio',
          media: audioUrl,
          fileName: 'diagnostico.mp3'
        })
      });

      if (!mediaResponse.ok) {
        const mediaError = await mediaResponse.text();
        console.error('[send-diagnostic-audio] Erro sendMedia:', mediaError);
      } else {
        console.log('[send-diagnostic-audio] Áudio enviado via sendMedia!');
      }
    } else {
      console.log('[send-diagnostic-audio] Áudio enviado com sucesso!', audioResult);
    }

    // 3. Limpar arquivo do Storage após 5 minutos (background task)
    EdgeRuntime.waitUntil((async () => {
      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
      console.log('[send-diagnostic-audio] Deletando arquivo:', fileName);
      await supabase.storage.from('diagnostic-audios').remove([fileName]);
    })());

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Áudio enviado para WhatsApp',
      phone: fullLeadNumber
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[send-diagnostic-audio] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
