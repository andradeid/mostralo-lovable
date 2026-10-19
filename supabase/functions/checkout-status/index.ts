// Status do checkout público (/assinar/:token) e criação da senha após o pagamento.
// action: 'status' (padrão) | 'set_password'
import { createClient } from 'npm:@supabase/supabase-js@2';
import { checkRateLimit, getClientIP } from '../_shared/rateLimiter.ts';
import { openEfiSession, createPixCharge, getPixCharge } from '../_shared/efi-pix.ts';
import { selectedBillingCycle } from '../_shared/billing-selection.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const PIX_EXPIRATION_SECONDS = 2 * 60 * 60;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

  const ip = getClientIP(req);
  const rl = checkRateLimit(`checkout-status:${ip}`, 40, 60 * 1000);
  if (!rl.allowed) return json({ error: 'Muitas consultas. Aguarde um instante.' }, 429);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'Requisição inválida' }, 400); }
  const token = String(body.token ?? '');
  if (token.length < 30) return json({ error: 'Link inválido' }, 404);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const load = async () => {
    const { data } = await supabase
      .from('payment_approvals')
      .select('id, user_id, store_id, plan_id, status, payment_amount, notes, company_name, phone, company_document, pix_txid, pix_copia_cola, pix_qrcode_base64, pix_expires_at, checkout_password_set_at, checkout_welcome_sent_at, created_at')
      .eq('checkout_token', token)
      .maybeSingle();
    return data;
  };

  let appr = await load();
  if (!appr) return json({ error: 'Link inválido ou expirado' }, 404);

  const { data: plan } = await supabase.from('plans').select('name').eq('id', appr.plan_id).maybeSingle();
  const { data: store } = await supabase.from('stores').select('name, slug, status').eq('id', appr.store_id).maybeSingle();
  const { data: userRes } = await supabase.auth.admin.getUserById(appr.user_id);
  const email = userRes?.user?.email ?? null;
  const cycle = selectedBillingCycle(appr.notes) ?? 'monthly';
  const summary = {
    plan_name: plan?.name ?? 'Mostralo',
    billing_cycle: cycle,
    amount: Number(appr.payment_amount),
    company_name: appr.company_name ?? store?.name ?? '',
    email,
  };

  // ── Criar senha ──
  if (body.action === 'set_password') {
    if (appr.status !== 'approved') return json({ error: 'O pagamento ainda não foi confirmado.' }, 409);
    if (appr.checkout_password_set_at) return json({ error: 'A senha já foi criada. Entre com seu e-mail e senha.', code: 'already_set' }, 409);
    const password = String(body.password ?? '');
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return json({ error: 'A senha precisa ter pelo menos 8 caracteres, com letras e números.' }, 400);
    }
    const { error } = await supabase.auth.admin.updateUserById(appr.user_id, { password });
    if (error) return json({ error: 'Não foi possível salvar a senha. Tente novamente.' }, 500);
    await supabase.from('payment_approvals').update({ checkout_password_set_at: new Date().toISOString() }).eq('id', appr.id);
    return json({ ok: true, email });
  }

  const paidResponse = async () => {
    if (!appr!.checkout_welcome_sent_at) {
      await supabase.from('payment_approvals').update({ checkout_welcome_sent_at: new Date().toISOString() }).eq('id', appr!.id);
      await fetch(`${supabaseUrl}/functions/v1/send-welcome-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify({
          type: 'store_owner',
          name: userRes?.user?.user_metadata?.full_name ?? '',
          phone: appr!.phone,
          extra_data: {
            store_name: store?.name ?? appr!.company_name,
            slug: store?.slug,
            access_link: appr!.checkout_password_set_at ? undefined : `https://mostralo.com.br/assinar/${token}`,
          },
        }),
      }).catch(() => {});
    }
    return json({ status: 'paid', needs_password: !appr!.checkout_password_set_at, store_slug: store?.slug, ...summary });
  };

  if (appr.status === 'approved') return paidResponse();
  if (appr.status !== 'pending') return json({ status: 'cancelled', ...summary });

  const expired = !appr.pix_expires_at || new Date(appr.pix_expires_at).getTime() < Date.now() + 60 * 1000;
  const checkGateway = body.check === true || expired;

  if (checkGateway) {
    let efi;
    try {
      efi = await openEfiSession(supabase);
    } catch (e) {
      console.error('[checkout-status] efi', e);
      return json({ status: 'pending', ...summary, pix_copia_cola: appr.pix_copia_cola, pix_qrcode_base64: appr.pix_qrcode_base64, pix_expires_at: appr.pix_expires_at });
    }
    try {
      if (appr.pix_txid) {
        const cob = await getPixCharge(efi, appr.pix_txid);
        if (cob?.status === 'CONCLUIDA' && Array.isArray(cob.pix) && cob.pix.length) {
          // Mesmo caminho do aviso da EFI: aprova, ativa a loja e registra a fatura
          await fetch(`${supabaseUrl}/functions/v1/efi-pix-webhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
            body: JSON.stringify({ pix: cob.pix }),
          });
          appr = (await load())!;
          if (appr.status === 'approved') return paidResponse();
        }
      }
      if (expired) {
        const pix = await createPixCharge(
          efi,
          Number(appr.payment_amount),
          `Mostralo ${summary.plan_name} ${cycle === 'annual' ? 'anual' : 'mensal'} - ${summary.company_name}`,
          PIX_EXPIRATION_SECONDS,
          { name: userRes?.user?.user_metadata?.full_name ?? '', document: appr.company_document ?? '' },
        );
        await supabase.from('payment_approvals').update({
          pix_txid: pix.txid,
          pix_copia_cola: pix.copiaCola,
          pix_qrcode_base64: pix.qrBase64,
          pix_expires_at: pix.expiresAt,
          updated_at: new Date().toISOString(),
        }).eq('id', appr.id);
        appr = (await load())!;
      }
    } catch (e) {
      console.error('[checkout-status] gateway', e);
    } finally {
      efi.client.close();
    }
  }

  return json({
    status: 'pending',
    ...summary,
    pix_copia_cola: appr.pix_copia_cola,
    pix_qrcode_base64: appr.pix_qrcode_base64,
    pix_expires_at: appr.pix_expires_at,
  });
});
