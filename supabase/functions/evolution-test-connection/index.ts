import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { api_url, api_key } = await req.json();

    if (!api_url || !api_key) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL e API Key são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalizar URL removendo barra final
    const baseUrl = api_url.replace(/\/$/, '');
    const endpoint = `${baseUrl}/instance/fetchInstances`;

    console.log(`[evolution-test-connection] Testando conexão: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': api_key,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[evolution-test-connection] Erro HTTP ${response.status}: ${errorText}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro ${response.status}: ${response.statusText}`,
          details: errorText
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const instanceCount = Array.isArray(data) ? data.length : 0;

    console.log(`[evolution-test-connection] Conexão bem-sucedida! ${instanceCount} instância(s) encontrada(s)`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        instanceCount,
        message: `Conectado! ${instanceCount} instância(s) encontrada(s)`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao conectar com a Evolution API';
    console.error('[evolution-test-connection] Erro:', errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
