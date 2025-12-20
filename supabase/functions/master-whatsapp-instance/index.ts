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

    // Verificar se é master_admin usando tabela user_roles
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'master_admin')
      .maybeSingle();

    if (roleError || !userRole) {
      console.error('[master-whatsapp-instance] Acesso negado - user:', user.id, 'role not found or not master_admin');
      return new Response(JSON.stringify({ error: 'Apenas master admin pode acessar' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, instanceName, phoneNumber, message } = body;
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
        const updateData: Record<string, string | null> = { instance_status: newStatus };
        
        // Buscar telefone se conectado via fetchInstances (endpoint que retorna o número corretamente)
        if (newStatus === 'connected') {
          try {
            const infoResponse = await fetch(`${api_url}/instance/fetchInstances`, {
              method: 'GET',
              headers: { 'apikey': api_key },
            });
            
            if (infoResponse.ok) {
              const instances = await infoResponse.json();
              const instance = instances.find((i: any) => i.name === masterConfig.instance_name);
              const phoneNumber = instance?.number || instance?.ownerJid?.split('@')[0] || instance?.wuid?.split('@')[0];
              console.log('[master-whatsapp-instance] Número encontrado:', phoneNumber);
              if (phoneNumber) {
                updateData.instance_phone = phoneNumber;
              }
            }
          } catch (e) {
            console.error('[master-whatsapp-instance] Erro ao buscar número:', e);
          }
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

      case 'sendTest': {
        if (!masterConfig?.instance_name) {
          return new Response(JSON.stringify({ error: 'Nenhuma instância configurada' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (masterConfig.instance_status !== 'connected') {
          return new Response(JSON.stringify({ error: 'WhatsApp não está conectado' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!phoneNumber) {
          return new Response(JSON.stringify({ error: 'Número de telefone é obrigatório' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Extrair DDI do número (já vem com DDI do frontend)
        const formattedPhone = phoneNumber.replace(/\D/g, '');
        // Detectar DDI - assume que números >= 12 dígitos já têm DDI
        let countryCode = '+55';
        if (formattedPhone.length >= 12 && !formattedPhone.startsWith('55')) {
          // Tenta extrair DDI de 1-3 dígitos
          if (formattedPhone.startsWith('1') && formattedPhone.length >= 11) {
            countryCode = '+1';
          } else {
            countryCode = '+' + formattedPhone.slice(0, 2);
          }
        } else if (formattedPhone.startsWith('55')) {
          countryCode = '+55';
        }

        console.log(`[master-whatsapp-instance] Enviando mensagem de teste para: ${formattedPhone}`);

        const testMessage = message || '✅ Mensagem de teste do WhatsApp Master - Mostralo';

        // Enviar via Evolution API
        const sendResponse = await fetch(`${api_url}/message/sendText/${masterConfig.instance_name}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': api_key,
          },
          body: JSON.stringify({
            number: formattedPhone,
            text: testMessage,
          }),
        });

        const sendData = await sendResponse.json();
        console.log('[master-whatsapp-instance] Send response:', sendData);

        const sendSuccess = sendResponse.ok && sendData.key?.id;

        // Salvar no histórico
        await supabase
          .from('master_test_messages')
          .insert({
            phone_number: formattedPhone,
            country_code: countryCode,
            message: testMessage,
            status: sendSuccess ? 'sent' : 'failed',
            evolution_message_id: sendData.key?.id || null,
            error_message: !sendSuccess ? (sendData.message || JSON.stringify(sendData)) : null,
            created_by: user.id,
          });

        if (!sendResponse.ok) {
          return new Response(JSON.stringify({ 
            error: 'Erro ao enviar mensagem', 
            details: sendData 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          messageId: sendData.key?.id,
          phone: formattedPhone,
        }), {
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
