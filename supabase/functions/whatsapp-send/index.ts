import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normaliza telefone para formato WhatsApp (com DDI 55 Brasil)
function normalizePhoneForWhatsApp(phone: string): string {
  // Remove caracteres não numéricos
  let normalized = phone.replace(/\D/g, '');
  
  // Se já começa com 55 e tem 12-13 dígitos, está correto
  if (normalized.startsWith('55') && normalized.length >= 12 && normalized.length <= 13) {
    return normalized;
  }
  
  // Se tem 10-11 dígitos (DDD + número), adicionar 55
  if (normalized.length >= 10 && normalized.length <= 11) {
    return '55' + normalized;
  }
  
  // Retorna como está se não se enquadrar
  return normalized;
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

    const { 
      storeId, 
      phoneNumber, 
      messageType = 'text',
      content,
      mediaUrl,
      mediaCaption,
      customerId,
      campaignId,
      templateId,
      // Campos para enquete
      pollQuestion,
      pollOptions,
      pollSelectableCount = 1,
      // Campos para lista interativa
      listTitle,
      listButtonText,
      listSections,
    } = await req.json();

    console.log(`[whatsapp-send] Enviando mensagem para ${phoneNumber}, Store: ${storeId}`);

    // Buscar configuração da Evolution API
    const { data: evolutionConfig, error: configError } = await supabase
      .from('evolution_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !evolutionConfig) {
      console.error('[whatsapp-send] Evolution API não configurada');
      return new Response(JSON.stringify({ error: 'Evolution API não configurada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { api_url, api_key } = evolutionConfig;

    // Buscar instância da loja
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (instanceError || !instance) {
      console.error('[whatsapp-send] Instância não encontrada');
      return new Response(JSON.stringify({ error: 'Instância WhatsApp não configurada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (instance.status !== 'connected') {
      return new Response(JSON.stringify({ error: 'WhatsApp não está conectado' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Formatar número de telefone com DDI 55
    const formattedPhone = normalizePhoneForWhatsApp(phoneNumber);
    
    // Construir payload baseado no tipo de mensagem
    let endpoint = '';
    let payload: any = {
      number: formattedPhone,
    };

    // Usado para retentativas (alguns builds da Evolution têm comportamentos diferentes no sendList)
    let normalizedListSections: any[] | null = null;

    switch (messageType) {
      case 'text':
        endpoint = `${api_url}/message/sendText/${instance.instance_name}`;
        payload.text = content;
        break;
      
      case 'image':
        endpoint = `${api_url}/message/sendMedia/${instance.instance_name}`;
        payload.mediatype = 'image';
        payload.media = mediaUrl;
        payload.caption = mediaCaption || content;
        break;
      
      case 'document':
        endpoint = `${api_url}/message/sendMedia/${instance.instance_name}`;
        payload.mediatype = 'document';
        payload.media = mediaUrl;
        payload.caption = mediaCaption || content;
        break;
      
      case 'audio':
        endpoint = `${api_url}/message/sendWhatsAppAudio/${instance.instance_name}`;
        payload.audio = mediaUrl;
        break;

      case 'video':
        endpoint = `${api_url}/message/sendMedia/${instance.instance_name}`;
        payload.mediatype = 'video';
        payload.media = mediaUrl;
        payload.caption = mediaCaption || content;
        break;
      
      case 'poll':
        // Enquete interativa
        endpoint = `${api_url}/message/sendPoll/${instance.instance_name}`;
        payload.name = pollQuestion || content; // Pergunta da enquete
        payload.selectableCount = pollSelectableCount;
        payload.values = pollOptions || [];
        console.log(`[whatsapp-send] Enviando enquete: "${payload.name}" com ${payload.values?.length} opções`);
        break;
      
      case 'list': {
        // Lista interativa - algumas versões da Evolution API exigem "sections".
        // Para máxima compatibilidade, mantemos "sections" e também espelhamos em "values".
        endpoint = `${api_url}/message/sendList/${instance.instance_name}`;
        payload.title = (listTitle || 'Escolha uma opção').trim();
        payload.description = content || '';
        payload.buttonText = (listButtonText || 'Ver opções').trim();
        payload.footerText = '';

        const safeInteractiveId = (input: unknown, sIdx: number, rIdx: number) => {
          const raw = (typeof input === 'string' || typeof input === 'number')
            ? String(input).trim()
            : '';

          // Alguns builds da Evolution/Baileys quebram com IDs "numéricos"; sempre garantimos prefixo alfa.
          if (!raw || /^[0-9_]+$/.test(raw)) {
            return `rid_${sIdx}_${rIdx}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
          }

          const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
          return /^[0-9]/.test(cleaned)
            ? `rid_${cleaned}`
            : cleaned;
        };

        const sections = (listSections || []).map((section: any, sIdx: number) => ({
          title: (section.title || 'Opções').trim(),
          rows: (section.rows || [])
            .filter((r: any) => r.title)
            .map((row: any, rIdx: number) => {
              const id = safeInteractiveId(row.rowId ?? row.id, sIdx, rIdx);
              return {
                title: String(row.title).trim(),
                description: (row.description || '').trim(),
                // Compat: Evolution costuma aceitar rowId; alguns clientes usam "id".
                rowId: id,
                id,
              };
            }),
        })).filter((s: any) => s.rows.length > 0);

        normalizedListSections = sections;
        payload.sections = sections;
        payload.values = sections;

        console.log(`[whatsapp-send] Enviando lista payload:`, JSON.stringify(payload));
        break;
      }


      
      case 'buttons':
        // Fallback para botões antigos - converte para texto
        endpoint = `${api_url}/message/sendText/${instance.instance_name}`;
        payload.text = content || 'Mensagem com botões (não suportado)';
        console.log(`[whatsapp-send] Botões convertidos para texto`);
        break;
      
      default:
        endpoint = `${api_url}/message/sendText/${instance.instance_name}`;
        payload.text = content;
    }

    console.log(`[whatsapp-send] Enviando para Evolution API: ${endpoint}`);

    // Enviar mensagem via Evolution API
    let sendResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': api_key,
      },
      body: JSON.stringify(payload),
    });

    let sendData: any = null;
    try {
      sendData = await sendResponse.json();
    } catch {
      sendData = { status: sendResponse.status, error: 'Resposta inválida (não-JSON) da Evolution API' };
    }

    // Se o sendList estiver bugado na versão da Evolution, tenta payload alternativo e, por fim, fallback para texto
    if (!sendResponse.ok && messageType === 'list' && normalizedListSections?.length) {
      const raw = JSON.stringify(sendData ?? {});
      const isZeroBug = raw.includes('this.isZero is not a function');

      if (isZeroBug) {
        const base = {
          number: formattedPhone,
          title: payload.title,
          description: payload.description,
          buttonText: payload.buttonText,
          footerText: payload.footerText ?? '',
        };

        const variants: Array<{ name: string; body: any }> = [
          {
            name: 'sections_id_only',
            body: {
              ...base,
              sections: normalizedListSections.map((s: any) => ({
                title: s.title,
                rows: (s.rows || []).map((r: any) => ({
                  title: r.title,
                  description: r.description,
                  id: r.id,
                })),
              })),
            },
          },
          {
            name: 'sections_rowId_only',
            body: {
              ...base,
              sections: normalizedListSections.map((s: any) => ({
                title: s.title,
                rows: (s.rows || []).map((r: any) => ({
                  title: r.title,
                  description: r.description,
                  rowId: r.rowId,
                })),
              })),
            },
          },
        ];

        for (const v of variants) {
          console.log(`[whatsapp-send] sendList falhou (isZero). Tentando variante: ${v.name}`);
          const r = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': api_key,
            },
            body: JSON.stringify(v.body),
          });

          let d: any = null;
          try {
            d = await r.json();
          } catch {
            d = { status: r.status, error: 'Resposta inválida (não-JSON) da Evolution API' };
          }

          if (r.ok) {
            sendResponse = r;
            sendData = d;
            break;
          }

          // mantém o último erro para diagnóstico
          sendResponse = r;
          sendData = d;
        }

        if (!sendResponse.ok) {
          // Fallback final: envia como texto (não-interativo) para não travar campanhas
          const rows = normalizedListSections.flatMap((s: any) => (s.rows || []));
          const optionsText = rows
            .slice(0, 10)
            .map((r: any) => `• ${r.title}${r.description ? ` — ${r.description}` : ''}`)
            .join('\n');

          const fallbackText = `${payload.description || ''}${optionsText ? `\n\nOpções:\n${optionsText}` : ''}`.trim();
          const fallbackEndpoint = `${api_url}/message/sendText/${instance.instance_name}`;

          console.log('[whatsapp-send] sendList continua falhando. Fazendo fallback para sendText.');

          const r = await fetch(fallbackEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': api_key,
            },
            body: JSON.stringify({ number: formattedPhone, text: fallbackText }),
          });

          let d: any = null;
          try {
            d = await r.json();
          } catch {
            d = { status: r.status, error: 'Resposta inválida (não-JSON) da Evolution API' };
          }

          sendResponse = r;
          sendData = d;
        }
      }
    }

    console.log('[whatsapp-send] Evolution response:', sendData);

    // Registrar mensagem no log
    const messageLog = {
      store_id: storeId,
      campaign_id: campaignId || null,
      customer_id: customerId || null,
      template_id: templateId || null,
      phone_number: formattedPhone,
      message_type: messageType,
      content: content,
      media_url: mediaUrl || null,
      status: sendResponse.ok ? 'sent' : 'failed',
      evolution_message_id: sendData.key?.id || null,
      error_message: sendResponse.ok ? null : JSON.stringify(sendData),
      sent_at: sendResponse.ok ? new Date().toISOString() : null,
      failed_at: sendResponse.ok ? null : new Date().toISOString(),
    };

    const { data: loggedMessage, error: logError } = await supabase
      .from('whatsapp_messages')
      .insert(messageLog)
      .select()
      .single();

    if (logError) {
      console.error('[whatsapp-send] Erro ao registrar mensagem:', logError);
    }

    if (!sendResponse.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao enviar mensagem',
        details: sendData,
      }), {
        status: sendResponse.status || 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      messageId: sendData.key?.id,
      message: loggedMessage,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[whatsapp-send] Erro:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
