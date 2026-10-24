// Mídia do WhatsApp master sob demanda: o webhook não salva mais o arquivo no storage.
// O painel chama esta função quando o master quer ver/ouvir a mídia; ela pede à UaZapi
// um link temporário do arquivo daquela mensagem. Só master_admin, só mensagens da própria config.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

const MEDIA_TYPES = new Set(['audio', 'image', 'video', 'sticker', 'document']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Não autorizado' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: 'Não autenticado' }, 401);

    const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', user.id).maybeSingle();
    if (profile?.user_type !== 'master_admin') return json({ error: 'Acesso negado' }, 403);

    const { messageId } = await req.json().catch(() => ({}));
    if (typeof messageId !== 'string' || !/^[0-9a-f-]{36}$/i.test(messageId)) {
      return json({ error: 'messageId inválido' }, 400);
    }

    const { data: config } = await supabase.from('master_whatsapp_config')
      .select('id, evolution_instance_id').eq('admin_user_id', user.id).maybeSingle();
    if (!config?.evolution_instance_id) return json({ error: 'Configuração master não encontrada' }, 404);

    const { data: message } = await supabase.from('master_whatsapp_chat_messages')
      .select('id, message_type, evolution_message_id, media_mimetype')
      .eq('id', messageId).eq('config_id', config.id).maybeSingle();
    if (!message?.evolution_message_id || !MEDIA_TYPES.has(message.message_type)) {
      return json({ error: 'Mídia não encontrada' }, 404);
    }

    const { data: uazapiConfig } = await supabase.from('uazapi_config')
      .select('api_url').order('is_active', { ascending: false }).limit(1).maybeSingle();
    if (!uazapiConfig?.api_url) return json({ error: 'UaZapi não configurado' }, 400);

    const body: Record<string, unknown> = { id: message.evolution_message_id, return_link: true };
    if (message.message_type === 'audio') body.generate_mp3 = true;

    const resp = await fetch(`${String(uazapiConfig.api_url).replace(/\/+$/, '')}/message/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', token: config.evolution_instance_id },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
    const data = await resp.json().catch(() => ({}));
    const url = data?.fileURL || data?.url || null;
    if (!resp.ok || !url) {
      // Mídia antiga pode ter expirado no WhatsApp.
      return json({ error: 'Mídia indisponível', expired: true }, 404);
    }
    return json({ url, mimetype: data?.mimetype || message.media_mimetype || null });
  } catch (error) {
    console.error('[master-whatsapp-media] erro:', error instanceof Error ? error.message : error);
    return json({ error: 'Erro ao buscar mídia' }, 500);
  }
});
