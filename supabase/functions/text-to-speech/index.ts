import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para converter ArrayBuffer para base64 de forma segura
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 32768; // Processa em chunks para evitar stack overflow
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId, storeId } = await req.json();

    if (!text) {
      throw new Error("Text is required");
    }

    // Determinar qual API key usar
    let apiKey = Deno.env.get('ELEVENLABS_API_KEY'); // Fallback global
    let usingStoreKey = false;

    // Se storeId foi fornecido, tentar buscar API key própria do lojista
    if (storeId) {
      console.log(`[TTS] Buscando API key do lojista para store: ${storeId}`);
      
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const { data: configData, error: configError } = await supabaseAdmin
        .from('password_call_config')
        .select('elevenlabs_api_key')
        .eq('store_id', storeId)
        .maybeSingle();

      if (configError) {
        console.error('[TTS] Erro ao buscar config do lojista:', configError);
      } else if (configData?.elevenlabs_api_key) {
        apiKey = configData.elevenlabs_api_key;
        usingStoreKey = true;
        console.log(`[TTS] Usando API key própria do lojista`);
      } else {
        console.log(`[TTS] Lojista não tem API key própria, usando global`);
      }
    }
    
    if (!apiKey) {
      console.error("ELEVENLABS_API_KEY não configurada no servidor");
      throw new Error("ELEVENLABS_API_KEY não configurada. Configure nas secrets do Supabase.");
    }

    const selectedVoiceId = voiceId || "onwK4e9ZLuTAKqWW03F9"; // Daniel como padrão (recomendado para pt-BR)
    
    console.log(`[TTS] Gerando áudio para: "${text.substring(0, 50)}..." com voz: ${selectedVoiceId} (key: ${usingStoreKey ? 'lojista' : 'global'})`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          output_format: "mp3_44100_128",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    // Converter buffer para base64 de forma segura
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = arrayBufferToBase64(audioBuffer);

    console.log(`[TTS] Áudio gerado com sucesso. Tamanho: ${audioBuffer.byteLength} bytes`);

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("TTS error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
