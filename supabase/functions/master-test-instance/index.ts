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

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se é master_admin
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'master_admin')
      .single();

    if (!userRoles) {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action } = await req.json();

    // Buscar Evolution config
    const { data: evolutionConfig, error: configError } = await supabaseClient
      .from('evolution_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !evolutionConfig) {
      return new Response(JSON.stringify({ error: 'Evolution API não configurada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const evolutionUrl = evolutionConfig.api_url.replace(/\/$/, '');

    // Buscar ou criar config de teste do admin
    let { data: testConfig } = await supabaseClient
      .from('master_admin_test_config')
      .select('*')
      .eq('admin_user_id', user.id)
      .single();

    if (!testConfig) {
      const { data: newConfig, error: insertError } = await supabaseClient
        .from('master_admin_test_config')
        .insert({ admin_user_id: user.id })
        .select()
        .single();
      
      if (insertError) {
        console.error('Erro ao criar config:', insertError);
        return new Response(JSON.stringify({ error: 'Falha ao criar configuração' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      testConfig = newConfig;
    }

    if (action === 'create') {
      // Criar nova instância de teste
      const instanceName = `master_test_${Date.now()}`;
      
      const createResponse = await fetch(`${evolutionUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'apikey': evolutionConfig.api_key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
        }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('Erro ao criar instância:', errorText);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Falha ao criar instância na Evolution' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const instanceData = await createResponse.json();
      
      // Atualizar config
      await supabaseClient
        .from('master_admin_test_config')
        .update({
          test_instance_name: instanceName,
          test_instance_id: instanceData.instance?.instanceId || instanceName,
          test_instance_status: 'created',
          test_instance_qr_code: instanceData.qrcode?.base64 || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', testConfig.id);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Instância criada!',
        instanceName,
        qrCode: instanceData.qrcode?.base64,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'connect') {
      // Gerar QR Code para conectar
      if (!testConfig.test_instance_name) {
        return new Response(JSON.stringify({ error: 'Crie uma instância primeiro' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const connectResponse = await fetch(`${evolutionUrl}/instance/connect/${testConfig.test_instance_name}`, {
        method: 'GET',
        headers: {
          'apikey': evolutionConfig.api_key,
        },
      });

      if (!connectResponse.ok) {
        const errorText = await connectResponse.text();
        console.error('Erro ao conectar:', errorText);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Falha ao obter QR Code' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const connectData = await connectResponse.json();
      
      // Atualizar QR Code
      await supabaseClient
        .from('master_admin_test_config')
        .update({
          test_instance_qr_code: connectData.base64 || connectData.qrcode?.base64,
          test_instance_status: 'connecting',
          updated_at: new Date().toISOString(),
        })
        .eq('id', testConfig.id);

      return new Response(JSON.stringify({ 
        success: true, 
        qrCode: connectData.base64 || connectData.qrcode?.base64,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'status') {
      // Verificar status da instância
      if (!testConfig.test_instance_name) {
        return new Response(JSON.stringify({ 
          success: true,
          status: 'not_created',
          connected: false,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const statusResponse = await fetch(`${evolutionUrl}/instance/connectionState/${testConfig.test_instance_name}`, {
        method: 'GET',
        headers: {
          'apikey': evolutionConfig.api_key,
        },
      });

      if (!statusResponse.ok) {
        // Instância não existe mais na Evolution - limpar dados órfãos do banco
        console.log('Instância não encontrada na Evolution - limpando dados do banco');
        
        await supabaseClient
          .from('master_admin_test_config')
          .update({
            test_instance_name: null,
            test_instance_id: null,
            test_instance_status: 'not_found',
            test_instance_qr_code: null,
            test_phone_number: null,
            bot_evolution_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', testConfig.id);

        return new Response(JSON.stringify({ 
          success: true,
          status: 'not_found',
          connected: false,
          message: 'Instância não encontrada na Evolution - dados limpos',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const statusData = await statusResponse.json();
      const isConnected = statusData.state === 'open' || statusData.instance?.state === 'open';
      
      // Buscar número conectado se estiver conectado
      let phoneNumber = testConfig.test_phone_number;
      if (isConnected && !phoneNumber) {
        try {
          const infoResponse = await fetch(`${evolutionUrl}/instance/fetchInstances`, {
            method: 'GET',
            headers: {
              'apikey': evolutionConfig.api_key,
            },
          });
          
          if (infoResponse.ok) {
            const instances = await infoResponse.json();
            const instance = instances.find((i: any) => i.name === testConfig.test_instance_name);
            phoneNumber = instance?.owner || instance?.profilePictureUrl?.split('@')[0];
          }
        } catch (e) {
          console.error('Erro ao buscar número:', e);
        }
      }

      // Atualizar status no banco
      await supabaseClient
        .from('master_admin_test_config')
        .update({
          test_instance_status: isConnected ? 'connected' : 'disconnected',
          test_phone_number: phoneNumber || testConfig.test_phone_number,
          updated_at: new Date().toISOString(),
        })
        .eq('id', testConfig.id);

      return new Response(JSON.stringify({ 
        success: true,
        status: isConnected ? 'connected' : 'disconnected',
        connected: isConnected,
        phoneNumber,
        instanceName: testConfig.test_instance_name,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'disconnect') {
      // Desconectar instância
      if (!testConfig.test_instance_name) {
        return new Response(JSON.stringify({ error: 'Instância não existe' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await fetch(`${evolutionUrl}/instance/logout/${testConfig.test_instance_name}`, {
        method: 'DELETE',
        headers: {
          'apikey': evolutionConfig.api_key,
        },
      });

      await supabaseClient
        .from('master_admin_test_config')
        .update({
          test_instance_status: 'disconnected',
          test_instance_qr_code: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', testConfig.id);

      return new Response(JSON.stringify({ success: true, message: 'Desconectado!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      // Deletar instância
      if (testConfig.test_instance_name) {
        await fetch(`${evolutionUrl}/instance/delete/${testConfig.test_instance_name}`, {
          method: 'DELETE',
          headers: {
            'apikey': evolutionConfig.api_key,
          },
        });
      }

      await supabaseClient
        .from('master_admin_test_config')
        .update({
          test_instance_name: null,
          test_instance_id: null,
          test_instance_status: 'disconnected',
          test_instance_qr_code: null,
          test_phone_number: null,
          bot_evolution_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', testConfig.id);

      return new Response(JSON.stringify({ success: true, message: 'Instância deletada!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_config') {
      return new Response(JSON.stringify({ 
        success: true,
        config: testConfig,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
