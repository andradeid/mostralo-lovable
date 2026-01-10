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
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 Sincronizando credenciais da Evolution API...');

    // Buscar Evolution config
    const { data: evolutionConfig, error: configError } = await supabaseClient
      .from('evolution_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !evolutionConfig) {
      console.error('❌ Evolution API não configurada');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Evolution API não configurada'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const evolutionUrl = evolutionConfig.api_url.replace(/\/$/, '');
    const apiKey = evolutionConfig.api_key;

    console.log(`📡 Buscando credenciais OpenAI na Evolution API: ${evolutionUrl}`);

    // Buscar credenciais OpenAI da Evolution API
    // Endpoint: GET /openai/creds
    const credsResponse = await fetch(`${evolutionUrl}/openai/creds`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!credsResponse.ok) {
      const errorText = await credsResponse.text();
      console.error('❌ Erro ao buscar credenciais:', credsResponse.status, errorText);
      
      // Tentar endpoint alternativo
      console.log('🔄 Tentando endpoint alternativo /openai/find...');
      const altResponse = await fetch(`${evolutionUrl}/openai/find`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json',
        },
      });
      
      if (!altResponse.ok) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Falha ao buscar credenciais: ${credsResponse.status}`,
          details: errorText.slice(0, 200)
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const altData = await altResponse.json();
      console.log('📋 Resposta alternativa:', JSON.stringify(altData).slice(0, 500));
    }

    const credsData = await credsResponse.json();
    console.log('📋 Credenciais encontradas:', JSON.stringify(credsData).slice(0, 500));

    // Extrair ID da credencial (pode vir em diferentes formatos)
    let openaiCredsId: string | null = null;
    
    if (Array.isArray(credsData)) {
      // Se for array, pegar a primeira credencial ativa
      const activeCred = credsData.find((c: any) => c.id || c._id);
      openaiCredsId = activeCred?.id || activeCred?._id || null;
    } else if (credsData?.id || credsData?._id) {
      // Se for objeto único
      openaiCredsId = credsData.id || credsData._id;
    } else if (credsData?.data) {
      // Se tiver wrapper de data
      if (Array.isArray(credsData.data) && credsData.data.length > 0) {
        openaiCredsId = credsData.data[0]?.id || credsData.data[0]?._id;
      } else {
        openaiCredsId = credsData.data?.id || credsData.data?._id;
      }
    }

    if (!openaiCredsId) {
      console.log('⚠️ Nenhuma credencial OpenAI encontrada na Evolution API');
      console.log('📝 Dados recebidos:', JSON.stringify(credsData));
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Nenhuma credencial OpenAI encontrada na Evolution API',
        hint: 'Cadastre uma credencial OpenAI na Evolution API primeiro',
        rawData: credsData
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ openai_creds_id encontrado: ${openaiCredsId}`);

    // Atualizar no Supabase
    const { error: updateError } = await supabaseClient
      .from('evolution_config')
      .update({ 
        openai_creds_id: String(openaiCredsId),
        updated_at: new Date().toISOString()
      })
      .eq('id', evolutionConfig.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar Supabase:', updateError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Erro ao atualizar banco de dados',
        details: updateError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ openai_creds_id sincronizado com sucesso!');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Credenciais sincronizadas com sucesso',
      openai_creds_id: openaiCredsId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
