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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se é master_admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'master_admin') {
      console.error('[master-whatsapp-instance] Acesso negado:', profile?.role);
      return new Response(JSON.stringify({ error: 'Apenas master admin pode acessar' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, instanceName } = await req.json();
    console.log(`[master-whatsapp-instance] Action: ${action}, User: ${user.id}`);

    // Buscar configuração da Evolution API
    const { data: evolutionConfig, error: configError } = await supabase
      .from('evolution_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !evolutionConfig) {
      console.error('[master-whatsapp-instance] Evolution API não configurada:', configError);
      return new Response(JSON.stringify({ error: 'Evolution API não configurada. Contate o administrador.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { api_url, api_key } = evolutionConfig;

    // Buscar configuração master existente
    const { data: masterConfig } = await supabase
      .from('master_whatsapp_config')
      .select('*')
      .eq('admin_user_id', user.id)
      .single();

    switch (action) {
      case 'create': {
        // Verificar se já existe instância
        if (masterConfig?.instance_name) {
          return new Response(JSON.stringify({ error: 'Já existe uma instância configurada' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Gerar nome único
        const uniqueName = instanceName || `master_${Date.now()}`;
        console.log(`[master-whatsapp-instance] Criando instância: ${uniqueName}`);

        // Criar instância na Evolution API
        const createResponse = await fetch(`${api_url}/instance/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': api_key,
          },
          body: JSON.stringify({
            instanceName: uniqueName,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
          }),
        });

        const createData = await createResponse.json();
        console.log('[master-whatsapp-instance] Evolution API response:', createData);

        if (!createResponse.ok) {
          return new Response(JSON.stringify({ error: 'Erro ao criar instância na Evolution API', details: createData }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Salvar/atualizar no banco
        const configData = {
          admin_user_id: user.id,
          instance_name: uniqueName,
          instance_status: 'connecting',
          evolution_instance_id: createData.instance?.instanceId || null,
        };

        if (masterConfig) {
          await supabase
            .from('master_whatsapp_config')
            .update(configData)
            .eq('id', masterConfig.id);
        } else {
          await supabase
            .from('master_whatsapp_config')
            .insert(configData);
        }

        return new Response(JSON.stringify({ 
          success: true, 
          instanceName: uniqueName,
          qrcode: createData.qrcode?.base64 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'connect': {
        if (!masterConfig?.instance_name) {
          return new Response(JSON.stringify({ error: 'Nenhuma instância configurada' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Buscar QR Code na Evolution API
        console.log(`[master-whatsapp-instance] Buscando QR code para: ${masterConfig.instance_name}`);
        
        const connectResponse = await fetch(`${api_url}/instance/connect/${masterConfig.instance_name}`, {
          method: 'GET',
          headers: {
            'apikey': api_key,
          },
        });

        const connectData = await connectResponse.json();
        console.log('[master-whatsapp-instance] Connect response:', connectData);

        // Se já está conectado
        if (connectData.instance?.state === 'open') {
          await supabase
            .from('master_whatsapp_config')
            .update({ instance_status: 'connected' })
            .eq('id', masterConfig.id);

          return new Response(JSON.stringify({ 
            success: true,
            status: 'connected',
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Atualizar status
        if (connectData.base64) {
          await supabase
            .from('master_whatsapp_config')
            .update({ instance_status: 'connecting' })
            .eq('id', masterConfig.id);
        }

        return new Response(JSON.stringify({ 
          success: true,
          qrcode: connectData.base64,
          status: 'connecting',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'status': {
        if (!masterConfig?.instance_name) {
          return new Response(JSON.stringify({ error: 'Nenhuma instância configurada' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Buscar status na Evolution API
        console.log(`[master-whatsapp-instance] Verificando status: ${masterConfig.instance_name}`);
        
        const statusResponse = await fetch(`${api_url}/instance/connectionState/${masterConfig.instance_name}`, {
          method: 'GET',
          headers: {
            'apikey': api_key,
          },
        });

        const statusData = await statusResponse.json();
        console.log('[master-whatsapp-instance] Status response:', statusData);

        const instanceState = statusData.instance?.state || statusData.state;
        console.log('[master-whatsapp-instance] Instance state:', instanceState);
        
        let newStatus = 'disconnected';
        if (instanceState === 'open') {
          newStatus = 'connected';
        } else if (instanceState === 'connecting') {
          newStatus = 'connecting';
        }

        // Atualizar status no banco
        const updateData: Record<string, string> = { instance_status: newStatus };
        
        // Buscar telefone se conectado
        if (newStatus === 'connected' && statusData.instance?.owner) {
          updateData.instance_phone = statusData.instance.owner.split('@')[0];
        }

        await supabase
          .from('master_whatsapp_config')
          .update(updateData)
          .eq('id', masterConfig.id);

        // Se desconectado, buscar novo QR
        let qrcode = null;
        if (newStatus === 'disconnected' || newStatus === 'connecting') {
          const connectResponse = await fetch(`${api_url}/instance/connect/${masterConfig.instance_name}`, {
            method: 'GET',
            headers: { 'apikey': api_key },
          });
          const connectData = await connectResponse.json();
          qrcode = connectData.base64;
        }

        return new Response(JSON.stringify({ 
          success: true,
          status: newStatus,
          qrcode,
          phone: updateData.instance_phone,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'disconnect': {
        if (!masterConfig?.instance_name) {
          return new Response(JSON.stringify({ error: 'Nenhuma instância configurada' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Desconectar na Evolution API
        console.log(`[master-whatsapp-instance] Desconectando: ${masterConfig.instance_name}`);
        
        await fetch(`${api_url}/instance/logout/${masterConfig.instance_name}`, {
          method: 'DELETE',
          headers: {
            'apikey': api_key,
          },
        });

        // Atualizar status no banco
        await supabase
          .from('master_whatsapp_config')
          .update({ 
            instance_status: 'disconnected',
            instance_phone: null,
          })
          .eq('id', masterConfig.id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        if (!masterConfig?.instance_name) {
          return new Response(JSON.stringify({ error: 'Nenhuma instância configurada' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Deletar na Evolution API
        console.log(`[master-whatsapp-instance] Deletando: ${masterConfig.instance_name}`);
        
        await fetch(`${api_url}/instance/delete/${masterConfig.instance_name}`, {
          method: 'DELETE',
          headers: {
            'apikey': api_key,
          },
        });

        // Limpar config no banco
        await supabase
          .from('master_whatsapp_config')
          .update({ 
            instance_name: null,
            instance_status: null,
            instance_phone: null,
            evolution_instance_id: null,
          })
          .eq('id', masterConfig.id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Ação inválida' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[master-whatsapp-instance] Erro:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
