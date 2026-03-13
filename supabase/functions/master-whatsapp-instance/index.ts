import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper: extrair QR code da resposta UaZapi (pode vir em instance.qrcode ou no nível raiz)
function extractQrCode(data: any): string | null {
  return data?.instance?.qrcode || data?.qrcode || data?.instance?.base64 || data?.base64 || null;
}

// Helper: extrair pairing code da resposta UaZapi
function extractPairingCode(data: any): string | null {
  return data?.instance?.paircode || data?.paircode || data?.code || data?.pairingCode || data?.pairing_code || null;
}

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
      console.error('[master-whatsapp-instance] Acesso negado - user:', user.id);
      return new Response(JSON.stringify({ error: 'Apenas master admin pode acessar' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, instanceName, phoneNumber, message, connectionMethod, pairingPhone } = body;
    console.log(`[master-whatsapp-instance] Action: ${action}, User: ${user.id}`);

    // Buscar configuração da UaZapi
    // Buscar qualquer config UaZapi (ativa ou não, pois pode estar desativada temporariamente)
    const { data: uazapiConfig, error: configError } = await supabase
      .from('uazapi_config')
      .select('*')
      .order('is_active', { ascending: false })
      .limit(1)
      .single();

    if (configError || !uazapiConfig) {
      console.error('[master-whatsapp-instance] UaZapi não configurada:', configError);
      return new Response(JSON.stringify({ error: 'UaZapi não configurada. Contate o administrador.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { api_url, admin_token } = uazapiConfig;

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
        console.log(`[master-whatsapp-instance] Criando instância UaZapi: ${uniqueName}`);

        // Criar instância na UaZapi
        const createResponse = await fetch(`${api_url}/instance/init`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'AdminToken': admin_token,
          },
          body: JSON.stringify({
            name: uniqueName,
          }),
        });

        const createData = await createResponse.json();
        console.log('[master-whatsapp-instance] UaZapi create response:', JSON.stringify(createData));

        if (!createResponse.ok) {
          return new Response(JSON.stringify({ error: 'Erro ao criar instância na UaZapi', details: createData }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // O token da instância vem na resposta
        const instanceToken = createData.token || createData.api_token || createData.apitoken || null;

        // Salvar/atualizar no banco
        const configData = {
          admin_user_id: user.id,
          instance_name: uniqueName,
          instance_status: 'connecting',
          evolution_instance_id: instanceToken, // Reutilizando campo para guardar o token UaZapi
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

        // Tentar obter QR code já na criação
        let qrcode = null;
        if (instanceToken) {
          try {
            const connectResp = await fetch(`${api_url}/instance/connect`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'token': instanceToken,
              },
            });
            const connectData = await connectResp.json();
            qrcode = extractQrCode(connectData);
          } catch (e) {
            console.error('[master-whatsapp-instance] Erro ao obter QR na criação:', e);
          }
        }

        return new Response(JSON.stringify({ 
          success: true, 
          instanceName: uniqueName,
          qrcode,
          instanceToken,
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

        const instanceToken = masterConfig.evolution_instance_id;
        if (!instanceToken) {
          return new Response(JSON.stringify({ error: 'Token da instância não encontrado' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log(`[master-whatsapp-instance] Conectando UaZapi: ${masterConfig.instance_name}, method: ${connectionMethod || 'qrcode'}`);

        // Se pairingPhone foi enviado, gerar código de pareamento
        if (connectionMethod === 'pairing_code' && pairingPhone) {
          const cleanPhone = pairingPhone.replace(/\D/g, '');
          const pairingResponse = await fetch(`${api_url}/instance/connect`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'token': instanceToken,
            },
            body: JSON.stringify({
              phone: cleanPhone,
            }),
          });

          const pairingData = await pairingResponse.json();
          console.log('[master-whatsapp-instance] Pairing response:', JSON.stringify(pairingData));

          await supabase
            .from('master_whatsapp_config')
            .update({ instance_status: 'connecting' })
            .eq('id', masterConfig.id);

          return new Response(JSON.stringify({ 
            success: true,
            pairingCode: extractPairingCode(pairingData),
            status: 'connecting',
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Buscar QR Code via UaZapi
        const connectResponse = await fetch(`${api_url}/instance/connect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'token': instanceToken,
          },
        });

        const connectData = await connectResponse.json();
        console.log('[master-whatsapp-instance] Connect response:', JSON.stringify(connectData));

        // Se já está conectado
        if (connectData.instance?.status === 'connected' || connectData.status?.connected === true || connectData.connected === true) {
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

        // QR code disponível
        const qrcode = extractQrCode(connectData);
        if (qrcode) {
          await supabase
            .from('master_whatsapp_config')
            .update({ instance_status: 'connecting' })
            .eq('id', masterConfig.id);
        }

        return new Response(JSON.stringify({ 
          success: true,
          qrcode,
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

        const instanceToken = masterConfig.evolution_instance_id;
        if (!instanceToken) {
          return new Response(JSON.stringify({ error: 'Token da instância não encontrado' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Buscar status na UaZapi
        console.log(`[master-whatsapp-instance] Verificando status UaZapi: ${masterConfig.instance_name}`);
        
        const statusResponse = await fetch(`${api_url}/instance/status`, {
          method: 'GET',
          headers: {
            'token': instanceToken,
          },
        });

        const statusData = await statusResponse.json();
        console.log('[master-whatsapp-instance] Status response:', JSON.stringify(statusData));

        // Mapear status da UaZapi - docs: instance.status = "connected"|"connecting"|"disconnected", status.connected = bool
        const instanceStatusStr = statusData.instance?.status || '';
        const isConnectedFlag = statusData.status?.connected === true || statusData.connected === true;
        let newStatus = 'disconnected';
        if (isConnectedFlag || instanceStatusStr === 'connected') {
          newStatus = 'connected';
        } else if (instanceStatusStr === 'connecting' || instanceStatusStr === 'QRCODE') {
          newStatus = 'connecting';
        }

        // Atualizar status no banco
        const updateData: Record<string, string | null> = { instance_status: newStatus };
        
        // Buscar telefone se conectado
        if (newStatus === 'connected') {
          const jid = statusData.status?.jid || statusData.jid || '';
          const phoneFromStatus = statusData.instance?.phone || statusData.phone || statusData.number || (jid ? jid.split('@')[0] : null) || null;
          if (phoneFromStatus) {
            updateData.instance_phone = phoneFromStatus.replace(/\D/g, '');
          }
        }

        await supabase
          .from('master_whatsapp_config')
          .update(updateData)
          .eq('id', masterConfig.id);

        // Se desconectado, buscar novo QR
        let qrcode = null;
        if (newStatus === 'disconnected' || newStatus === 'connecting') {
          try {
            const connectResponse = await fetch(`${api_url}/instance/connect`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'token': instanceToken,
              },
            });
            const connectData = await connectResponse.json();
            qrcode = extractQrCode(connectData);
          } catch (e) {
            console.error('[master-whatsapp-instance] Erro ao buscar QR:', e);
          }
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

        const instanceToken = masterConfig.evolution_instance_id;
        if (!instanceToken) {
          return new Response(JSON.stringify({ error: 'Token da instância não encontrado' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Desconectar na UaZapi
        console.log(`[master-whatsapp-instance] Desconectando UaZapi: ${masterConfig.instance_name}`);
        
        await fetch(`${api_url}/instance/disconnect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'token': instanceToken,
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

        const instanceToken = masterConfig.evolution_instance_id;
        
        // Tentar desconectar antes de limpar
        if (instanceToken) {
          try {
            await fetch(`${api_url}/instance/disconnect`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'token': instanceToken,
              },
            });
          } catch (e) {
            console.error('[master-whatsapp-instance] Erro ao desconectar antes de deletar:', e);
          }
        }

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

        const instanceToken = masterConfig.evolution_instance_id;
        if (!instanceToken) {
          return new Response(JSON.stringify({ error: 'Token da instância não encontrado' }), {
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

        const formattedPhone = phoneNumber.replace(/\D/g, '');
        let countryCode = '+55';
        if (formattedPhone.length >= 12 && !formattedPhone.startsWith('55')) {
          if (formattedPhone.startsWith('1') && formattedPhone.length >= 11) {
            countryCode = '+1';
          } else {
            countryCode = '+' + formattedPhone.slice(0, 2);
          }
        } else if (formattedPhone.startsWith('55')) {
          countryCode = '+55';
        }

        console.log(`[master-whatsapp-instance] Enviando mensagem de teste UaZapi para: ${formattedPhone}`);

        const testMessage = message || '✅ Mensagem de teste do WhatsApp Master - Mostralo';

        // Enviar via UaZapi
        const sendResponse = await fetch(`${api_url}/send/text`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'token': instanceToken,
          },
          body: JSON.stringify({
            phone: formattedPhone,
            message: testMessage,
          }),
        });

        const sendData = await sendResponse.json();
        console.log('[master-whatsapp-instance] Send response:', JSON.stringify(sendData));

        const sendSuccess = sendResponse.ok && (sendData.status === true || sendData.id || sendData.key?.id);

        // Salvar no histórico
        await supabase
          .from('master_test_messages')
          .insert({
            phone_number: formattedPhone,
            country_code: countryCode,
            message: testMessage,
            status: sendSuccess ? 'sent' : 'failed',
            evolution_message_id: sendData.id || sendData.key?.id || null,
            error_message: !sendSuccess ? (sendData.message || JSON.stringify(sendData)) : null,
            created_by: user.id,
          });

        if (!sendSuccess) {
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
          messageId: sendData.id || sendData.key?.id,
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
