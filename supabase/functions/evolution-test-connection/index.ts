import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LinkedStore {
  id: string;
  name: string;
  slug: string;
  ownerName: string | null;
  ownerEmail: string | null;
}

interface EvolutionInstance {
  instanceName: string;
  instanceId: string;
  status: string;
  owner: string;
  profilePictureUrl: string | null;
  number: string | null;
  apiKey: string | null;
  integration: string;
  contactsCount: number;
  chatsCount: number;
  isLinked: boolean;
  linkedStore: LinkedStore | null;
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
    // Criar cliente Supabase para consultar vínculos
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    if (Array.isArray(rawData)) {
      for (const item of rawData) {
        const instance = item.instance || item;
        const instanceName = instance.instanceName || instance.name || 'Sem nome';
        
        // Buscar contatos e conversas para instâncias conectadas
        let contactsCount = 0;
        let chatsCount = 0;
        const instanceStatus = instance.status || instance.connectionStatus || 'unknown';
        
        if (instanceStatus === 'open' || instanceStatus === 'connected') {
          try {
            // Buscar contatos
            const contactsResponse = await fetch(`${baseUrl}/chat/findContacts/${instanceName}`, {
              method: 'POST',
              headers: { 'apikey': api_key, 'Content-Type': 'application/json' },
              body: JSON.stringify({})
            });
            if (contactsResponse.ok) {
              const contactsData = await contactsResponse.json();
              contactsCount = Array.isArray(contactsData) ? contactsData.length : 0;
            }
            
            // Buscar conversas
            const chatsResponse = await fetch(`${baseUrl}/chat/findChats/${instanceName}`, {
              method: 'GET',
              headers: { 'apikey': api_key, 'Content-Type': 'application/json' }
            });
            if (chatsResponse.ok) {
              const chatsData = await chatsResponse.json();
              chatsCount = Array.isArray(chatsData) ? chatsData.length : 0;
            }
          } catch (err) {
            console.log(`[evolution-test-connection] Erro ao buscar métricas de ${instanceName}:`, err);
          }
        }
        
        // Buscar vínculo com loja no Supabase
        let isLinked = false;
        let linkedStore: LinkedStore | null = null;
        
        try {
          const { data: linkedInstance } = await supabase
            .from('whatsapp_instances')
            .select(`
              id,
              store_id,
              stores (
                id,
                name,
                slug,
                owner_id
              )
            `)
            .eq('instance_name', instanceName)
            .maybeSingle();
          
          if (linkedInstance?.stores) {
            isLinked = true;
            const store = linkedInstance.stores as any;
            
            // Buscar dados do owner
            let ownerName = null;
            let ownerEmail = null;
            if (store.owner_id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', store.owner_id)
                .maybeSingle();
              
              if (profile) {
                ownerName = profile.full_name;
                ownerEmail = profile.email;
              }
            }
            
            linkedStore = {
              id: store.id,
              name: store.name,
              slug: store.slug,
              ownerName,
              ownerEmail
            };
          }
        } catch (err) {
          console.log(`[evolution-test-connection] Erro ao buscar vínculo de ${instanceName}:`, err);
        }
        
        instances.push({
          instanceName,
          instanceId: instance.instanceId || instance.id || crypto.randomUUID(),
          status: instanceStatus,
          owner: instance.owner || instance.profileName || instance.pushname || '',
          profilePictureUrl: instance.profilePicUrl || instance.profilePictureUrl || null,
          number: instance.number || instance.ownerJid?.split('@')[0] || instance.wuid?.split('@')[0] || null,
          apiKey: instance.token || instance.apikey || null,
          integration: instance.integration || 'WHATSAPP-BAILEYS',
          contactsCount,
          chatsCount,
          isLinked,
          linkedStore,
        });
      }
    }

    // Contar estatísticas
    const stats = {
      total: instances.length,
      connected: instances.filter(i => i.status === 'open' || i.status === 'connected').length,
      connecting: instances.filter(i => i.status === 'connecting').length,
      offline: instances.filter(i => i.status === 'close' || i.status === 'closed' || i.status === 'disconnected').length,
      linked: instances.filter(i => i.isLinked).length,
      orphan: instances.filter(i => !i.isLinked).length,
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
