import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendCancellationNotice } from '../_shared/booking-cancel-notice.ts';

// Avisa o cliente pelo WhatsApp quando a loja cancela um agendamento pelo painel.
// Só quem pode ver o agendamento (regras de acesso do banco) consegue disparar,
// e só para agendamento cancelado há pouco tempo e ainda sem aviso enviado.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) return json({ error: 'Não autenticado' }, 401);

    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: auth } = await admin.auth.getUser(jwt);
    if (!auth?.user) return json({ error: 'Não autenticado' }, 401);

    const { booking_id, reason } = await req.json().catch(() => ({}));
    if (!booking_id || typeof booking_id !== 'string') return json({ error: 'booking_id é obrigatório' }, 400);

    // Confere o acesso com as permissões do próprio usuário
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: visible } = await userClient.from('bookings').select('id, status, cancelled_at').eq('id', booking_id).maybeSingle();
    if (!visible) return json({ error: 'Agendamento não encontrado' }, 404);
    if (visible.status !== 'cancelled') return json({ error: 'Agendamento não está cancelado' }, 400);
    if (!visible.cancelled_at || Date.now() - new Date(visible.cancelled_at).getTime() > 30 * 60 * 1000) {
      return json({ error: 'Aviso só pode ser enviado logo após o cancelamento' }, 400);
    }
    const { data: already } = await admin.from('booking_notification_logs').select('id')
      .eq('booking_id', booking_id).eq('notification_type', 'cancellation').eq('status', 'sent').limit(1);
    if (already?.length) return json({ sent: false, skipped: 'Aviso já enviado' });

    const result = await sendCancellationNotice(admin, booking_id, {
      reason: typeof reason === 'string' ? reason.slice(0, 300) : null, sendMethod: 'manual', sentBy: auth.user.id,
    });
    return json(result);
  } catch (e) {
    console.error('[booking-cancel-notify]', e);
    return json({ error: 'Erro ao enviar aviso' }, 500);
  }
});
