import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EvolutionInstance {
  instanceName: string;
  instanceId: string;
  status: string;
  owner: string;
  profilePictureUrl: string | null;
  number: string | null;
  apiKey: string | null;
  integration: string;
}

serve(async (req) => {
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

    const baseUrl = api_url.replace(/\/$/, '');
    const endpoint = `${baseUrl}/instance/fetchInstances`;

    console.log(`[evolution-test-connection] Buscando instâncias: ${endpoint}`);

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

    const rawData = await response.json();
    console.log(`[evolution-test-connection] Raw data:`, JSON.stringify(rawData).slice(0, 500));

    // Mapear dados da Evolution API para nosso formato
    const instances: EvolutionInstance[] = [];
    
    if (Array.isArray(rawData)) {
      for (const item of rawData) {
        // A Evolution API retorna estrutura variada, vamos normalizar
        const instance = item.instance || item;
        
        instances.push({
          instanceName: instance.instanceName || instance.name || 'Sem nome',
          instanceId: instance.instanceId || instance.id || crypto.randomUUID(),
          status: instance.status || instance.connectionStatus || 'unknown',
          owner: instance.owner || instance.profileName || instance.pushname || '',
          profilePictureUrl: instance.profilePicUrl || instance.profilePictureUrl || null,
          number: instance.number || instance.wuid?.split('@')[0] || null,
          apiKey: instance.token || instance.apikey || null,
          integration: instance.integration || 'WHATSAPP-BAILEYS',
        });
      }
    }

    // Contar estatísticas
    const stats = {
      total: instances.length,
      connected: instances.filter(i => i.status === 'open' || i.status === 'connected').length,
      connecting: instances.filter(i => i.status === 'connecting').length,
      offline: instances.filter(i => i.status === 'close' || i.status === 'closed' || i.status === 'disconnected').length,
    };

    console.log(`[evolution-test-connection] Conexão bem-sucedida! ${instances.length} instância(s)`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        instanceCount: instances.length,
        instances,
        stats,
        message: `Conectado! ${instances.length} instância(s) encontrada(s)`
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
