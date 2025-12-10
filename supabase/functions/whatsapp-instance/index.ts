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

    const { action, storeId, instanceName } = await req.json();
    console.log(`[whatsapp-instance] Action: ${action}, StoreId: ${storeId}, User: ${user.id}`);

    // Buscar configuração da Evolution API
    const { data: evolutionConfig, error: configError } = await supabase
      .from('evolution_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !evolutionConfig) {
      console.error('[whatsapp-instance] Evolution API não configurada:', configError);
      return new Response(JSON.stringify({ error: 'Evolution API não configurada. Contate o administrador.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { api_url, api_key } = evolutionConfig;

    // Verificar se o usuário é dono da loja
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name, slug')
      .eq('id', storeId)
      .eq('owner_id', user.id)
      .single();

    if (storeError || !store) {
      return new Response(JSON.stringify({ error: 'Loja não encontrada ou sem permissão' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    switch (action) {
      case 'create': {
        // Verificar se já existe instância para esta loja
        const { data: existingInstance } = await supabase
          .from('whatsapp_instances')
          .select('id')
          .eq('store_id', storeId)
          .single();

        if (existingInstance) {
          return new Response(JSON.stringify({ error: 'Já existe uma instância para esta loja' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Criar instância na Evolution API
        const evolutionInstanceName = instanceName || `store_${store.slug}`;
        console.log(`[whatsapp-instance] Criando instância: ${evolutionInstanceName}`);

        const createResponse = await fetch(`${api_url}/instance/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': api_key,
          },
          body: JSON.stringify({
            instanceName: evolutionInstanceName,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
          }),
        });

        const createData = await createResponse.json();
        console.log('[whatsapp-instance] Evolution API response:', createData);

        if (!createResponse.ok) {
          return new Response(JSON.stringify({ error: 'Erro ao criar instância na Evolution API', details: createData }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Salvar instância no banco
        const { data: newInstance, error: insertError } = await supabase
          .from('whatsapp_instances')
          .insert({
            store_id: storeId,
            instance_name: evolutionInstanceName,
            instance_id: createData.instance?.instanceName || evolutionInstanceName,
            status: 'disconnected',
            qr_code: createData.qrcode?.base64 || null,
          })
          .select()
          .single();

        if (insertError) {
          console.error('[whatsapp-instance] Erro ao salvar instância:', insertError);
          return new Response(JSON.stringify({ error: 'Erro ao salvar instância' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          instance: newInstance,
          qrcode: createData.qrcode?.base64 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'connect': {
        // Buscar instância existente
        const { data: instance, error: instanceError } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('store_id', storeId)
          .single();

        if (instanceError || !instance) {
          return new Response(JSON.stringify({ error: 'Instância não encontrada' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Buscar QR Code na Evolution API
        console.log(`[whatsapp-instance] Buscando QR code para: ${instance.instance_name}`);
        
        const connectResponse = await fetch(`${api_url}/instance/connect/${instance.instance_name}`, {
          method: 'GET',
          headers: {
            'apikey': api_key,
          },
        });

        const connectData = await connectResponse.json();
        console.log('[whatsapp-instance] Connect response:', connectData);

        // Atualizar QR code no banco
        if (connectData.base64) {
          await supabase
            .from('whatsapp_instances')
            .update({ 
              qr_code: connectData.base64,
              status: 'connecting',
            })
            .eq('id', instance.id);
        }

        return new Response(JSON.stringify({ 
          success: true,
          qrcode: connectData.base64,
          status: instance.status,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'status': {
        // Buscar instância existente
        const { data: instance, error: instanceError } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('store_id', storeId)
          .single();

        if (instanceError || !instance) {
          return new Response(JSON.stringify({ error: 'Instância não encontrada' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Buscar status na Evolution API
        console.log(`[whatsapp-instance] Verificando status: ${instance.instance_name}`);
        
        const statusResponse = await fetch(`${api_url}/instance/connectionState/${instance.instance_name}`, {
          method: 'GET',
          headers: {
            'apikey': api_key,
          },
        });

        const statusData = await statusResponse.json();
        console.log('[whatsapp-instance] Status response:', statusData);

        // Mapear status da Evolution para nosso enum
        // A Evolution API retorna o estado em statusData.instance.state
        const instanceState = statusData.instance?.state || statusData.state;
        console.log('[whatsapp-instance] Instance state:', instanceState);
        
        let newStatus: 'disconnected' | 'connecting' | 'connected' | 'banned' = 'disconnected';
        if (instanceState === 'open') {
          newStatus = 'connected';
        } else if (instanceState === 'connecting') {
          newStatus = 'connecting';
        }

        // Atualizar status no banco
        const updateData: any = { status: newStatus };
        if (newStatus === 'connected') {
          updateData.last_connected_at = new Date().toISOString();
        }

        // Buscar informações do perfil se conectado
        if (newStatus === 'connected') {
          try {
            const profileResponse = await fetch(`${api_url}/chat/fetchProfile/${instance.instance_name}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': api_key,
              },
              body: JSON.stringify({ number: statusData.instance?.owner?.split('@')[0] }),
            });
            const profileData = await profileResponse.json();
            if (profileData) {
              updateData.phone_number = statusData.instance?.owner?.split('@')[0];
              updateData.profile_name = profileData.name || profileData.pushName;
              updateData.profile_picture_url = profileData.picture;
            }
          } catch (e) {
            console.log('[whatsapp-instance] Erro ao buscar perfil:', e);
          }
        }

        await supabase
          .from('whatsapp_instances')
          .update(updateData)
          .eq('id', instance.id);

        return new Response(JSON.stringify({ 
          success: true,
          status: newStatus,
          instance: { ...instance, ...updateData },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'disconnect': {
        const { data: instance } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('store_id', storeId)
          .single();

        if (!instance) {
          return new Response(JSON.stringify({ error: 'Instância não encontrada' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Desconectar na Evolution API
        console.log(`[whatsapp-instance] Desconectando: ${instance.instance_name}`);
        
        await fetch(`${api_url}/instance/logout/${instance.instance_name}`, {
          method: 'DELETE',
          headers: {
            'apikey': api_key,
          },
        });

        // Atualizar status no banco
        await supabase
          .from('whatsapp_instances')
          .update({ 
            status: 'disconnected',
            qr_code: null,
          })
          .eq('id', instance.id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        const { data: instance } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('store_id', storeId)
          .single();

        if (!instance) {
          return new Response(JSON.stringify({ error: 'Instância não encontrada' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Deletar na Evolution API
        console.log(`[whatsapp-instance] Deletando: ${instance.instance_name}`);
        
        await fetch(`${api_url}/instance/delete/${instance.instance_name}`, {
          method: 'DELETE',
          headers: {
            'apikey': api_key,
          },
        });

        // Deletar do banco
        await supabase
          .from('whatsapp_instances')
          .delete()
          .eq('id', instance.id);

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
  } catch (error: any) {
    console.error('[whatsapp-instance] Erro:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
