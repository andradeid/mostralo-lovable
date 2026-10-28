// Checkout público de assinatura: o lojista informa só o essencial e paga antes.
// Cria conta (sem senha conhecida), loja inativa, aprovação pendente e o Pix.
// Quando o Pix é pago, o efi-pix-webhook ativa a loja; a senha é criada depois em /assinar/:token.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { resolveStoreBilling } from '../_shared/annual-pricing.ts';
import { billingSelectionNotes } from '../_shared/billing-selection.ts';
import { checkRateLimit, getClientIP } from '../_shared/rateLimiter.ts';
import { openEfiSession, createPixCharge } from '../_shared/efi-pix.ts';
import { FOUNDER_PRICE, founderOfferApplies } from '../_shared/founder-offer.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const PIX_EXPIRATION_SECONDS = 2 * 60 * 60; // 2 horas

function validCpf(cpf: string) {
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  const calc = (n: number) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += Number(cpf[i]) * (n + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}
function validCnpj(cnpj: string) {
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const calc = (n: number) => {
    const w = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const s = w.reduce((acc, x, i) => acc + Number(cnpj[i]) * x, 0);
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(cnpj[12]) && calc(13) === Number(cnpj[13]);
}
function slugify(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'loja';
}
function randomToken(len = 40) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(len)), (b) => chars[b % chars.length]).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

  const ip = getClientIP(req);
  const rl = checkRateLimit(`checkout-start:${ip}`, 5, 10 * 60 * 1000);
  if (!rl.allowed) return json({ error: 'Muitas tentativas. Aguarde alguns minutos.', retryAfterSeconds: rl.retryAfterSeconds }, 429);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'Requisição inválida' }, 400); }

  // Armadilha para robôs
  if (body.website) return json({ error: 'Requisição inválida' }, 400);

  const fullName = String(body.full_name ?? '').trim().replace(/\s+/g, ' ');
  const email = String(body.email ?? '').trim().toLowerCase();
  const phone = String(body.phone ?? '').replace(/\D/g, '');
  const document = String(body.document ?? '').replace(/\D/g, '');
  const companyName = String(body.company_name ?? '').trim().replace(/\s+/g, ' ');
  const planId = String(body.plan_id ?? '');
  const cycle = body.billing_cycle === 'monthly' ? 'monthly' : 'annual';
  const referralCode = body.referral_code ? String(body.referral_code).trim() : null;

  if (fullName.split(' ').length < 2 || fullName.length < 5) return json({ error: 'Informe seu nome completo.', field: 'full_name' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ error: 'Informe um e-mail válido.', field: 'email' }, 400);
  if (phone.length < 10 || phone.length > 11) return json({ error: 'Informe um WhatsApp com DDD.', field: 'phone' }, 400);
  if (!(document.length === 11 ? validCpf(document) : document.length === 14 ? validCnpj(document) : false)) {
    return json({ error: 'CPF ou CNPJ inválido.', field: 'document' }, 400);
  }
  if (companyName.length < 2) return json({ error: 'Informe o nome do seu negócio.', field: 'company_name' }, 400);
  if (body.accept_terms !== true) return json({ error: 'É preciso aceitar os termos para continuar.', field: 'accept_terms' }, 400);

  const emailRl = checkRateLimit(`checkout-start-email:${email}`, 3, 10 * 60 * 1000);
  if (!emailRl.allowed) return json({ error: 'Muitas tentativas com este e-mail. Aguarde alguns minutos.' }, 429);

  const { data: plan } = await supabase
    .from('plans')
    .select('id, name, price, billing_cycle, annual_enabled, annual_discount_percent, status')
    .eq('id', planId)
    .maybeSingle();
  if (!plan || plan.status !== 'active' || Number(plan.price) <= 0) return json({ error: 'Plano indisponível.', field: 'plan_id' }, 400);

  // Parceiro que indicou (cupom ou link ?ref=), opcional
  let salespersonId: string | null = null;
  if (referralCode) {
    const { data: sp, error: spErr } = await supabase.rpc('_partner_by_code', { p_code: referralCode });
    if (spErr) console.error('[checkout-start] parceiro', spErr);
    salespersonId = (sp as { id?: string } | null)?.id ?? null;
  }

  // Quem chega por parceiro ganha sócio fundador no plano Agenda, enquanto houver vaga
  let founder = false;
  if (salespersonId) {
    const { data: av } = await supabase.rpc('mostralo_founder_availability');
    founder = founderOfferApplies({ hasPartner: true, planName: plan.name, remaining: Number((av as { remaining?: number } | null)?.remaining ?? 0) });
  }

  const billing = resolveStoreBilling(plan, cycle, null);
  const amount = founder ? FOUNDER_PRICE : billing.amount;
  const effectiveCycle = founder ? 'monthly' : billing.annual ? 'annual' : 'monthly';

  // E-mail já cadastrado: se existir um checkout pendente desse e-mail, reaproveita; senão pede login.
  const { data: existingProfile } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
  if (existingProfile) {
    const { data: pending } = await supabase
      .from('payment_approvals')
      .select('checkout_token, status')
      .eq('user_id', existingProfile.id)
      .not('checkout_token', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (pending?.checkout_token && pending.status === 'pending') {
      return json({ token: pending.checkout_token, resumed: true });
    }
    return json({ error: 'Este e-mail já tem conta no Mostralo. Entre com sua senha ou use outro e-mail.', field: 'email', code: 'email_exists' }, 409);
  }

  // 1. Conta (senha aleatória; o lojista cria a dele depois do pagamento)
  const tempPassword = randomToken(32) + 'Aa1!';
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone, source: 'checkout' },
  });
  if (createErr || !created?.user) {
    console.error('[checkout-start] createUser', createErr);
    if (String(createErr?.message).toLowerCase().includes('already')) {
      return json({ error: 'Este e-mail já tem conta no Mostralo. Entre com sua senha ou use outro e-mail.', field: 'email', code: 'email_exists' }, 409);
    }
    return json({ error: 'Não foi possível criar sua conta. Tente novamente.' }, 500);
  }
  const userId = created.user.id;

  const rollback = async () => {
    await supabase.auth.admin.deleteUser(userId).catch(() => {});
  };

  try {
    // Perfil é criado pelo trigger handle_new_user; garantir telefone
    for (let i = 0; i < 5; i++) {
      const { data: prof } = await supabase.from('profiles').update({ phone }).eq('id', userId).select('id');
      if (prof && prof.length) break;
      await new Promise((r) => setTimeout(r, 400));
    }

    // 2. Loja inativa
    let slug = slugify(companyName);
    const { data: slugTaken } = await supabase.from('stores').select('id').eq('slug', slug).maybeSingle();
    if (slugTaken) slug = `${slug}-${Date.now().toString().slice(-6)}`;

    const { data: store, error: storeErr } = await supabase
      .from('stores')
      .insert({
        name: companyName,
        slug,
        owner_id: userId,
        status: 'inactive',
        plan_id: plan.id,
        billing_cycle: effectiveCycle,
        wants_online_payment: false,
        efi_account_status: 'not_configured',
        responsible_name: fullName,
        responsible_cpf: document,
        responsible_email: email,
        responsible_phone: phone,
        phone,
      })
      .select('id, slug')
      .single();
    if (storeErr || !store) throw storeErr ?? new Error('store');

    // 3. Pix
    const efi = await openEfiSession(supabase);
    let pix;
    try {
      pix = await createPixCharge(
        efi,
        amount,
        `Mostralo ${plan.name} ${founder ? 'sócio fundador' : effectiveCycle === 'annual' ? 'anual' : 'mensal'} - ${companyName}`,
        PIX_EXPIRATION_SECONDS,
        { name: fullName, document },
      );
    } finally {
      efi.client.close();
    }

    // 4. Aprovação pendente (o webhook do Pix aprova e ativa a loja)
    const token = randomToken(40);
    const { error: apprErr } = await supabase.from('payment_approvals').insert({
      user_id: userId,
      store_id: store.id,
      plan_id: plan.id,
      status: 'pending',
      payment_amount: amount,
      payment_method: 'pix',
      notes: billingSelectionNotes(founder ? 'Checkout online (pagamento antes do cadastro) - sócio fundador por indicação' : 'Checkout online (pagamento antes do cadastro)', effectiveCycle),
      company_name: companyName,
      company_document: document,
      phone,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      referred_by_salesperson_id: salespersonId,
      founder_offer: founder,
      pix_txid: pix.txid,
      pix_copia_cola: pix.copiaCola,
      pix_qrcode_base64: pix.qrBase64,
      pix_expires_at: pix.expiresAt,
      checkout_token: token,
    });
    if (apprErr) throw apprErr;

    // 5. Aceite dos termos (uma caixa no checkout cobre os aceites obrigatórios)
    const fnUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1`;
    const svc = { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` };
    // Versão vigente dos termos: a mesma que o painel confere, para não pedir o aceite de novo
    const { data: termsCfg } = await supabase
      .from('system_terms_config')
      .select('config_value')
      .eq('config_key', 'current_terms_version')
      .maybeSingle();
    const termsVersion = termsCfg?.config_value || '1.0';
    await supabase
      .from('profiles')
      .update({ accepted_terms_version: termsVersion, terms_accepted_at: new Date().toISOString() })
      .eq('id', userId);
    await fetch(`${fnUrl}/accept-merchant-contract`, {
      method: 'POST',
      headers: { ...svc, 'x-forwarded-for': ip, 'user-agent': req.headers.get('user-agent') ?? 'unknown' },
      body: JSON.stringify({
        user_id: userId,
        store_id: store.id,
        contract_version: termsVersion,
        terms_accepted: true,
        privacy_accepted: true,
        cookies_accepted: true,
        marketing_accepted: body.accept_marketing === true,
        business_info_declaration: true,
        company_authorization: true,
        compliance_commitment: true,
      }),
    }).catch((e) => console.error('[checkout-start] contrato', e));

    // 6. Aviso ao master
    fetch(`${fnUrl}/send-master-notification`, {
      method: 'POST',
      headers: svc,
      body: JSON.stringify({
        type: 'new_store',
        data: {
          name: companyName, slug: store.slug, owner_name: fullName, owner_email: email, owner_phone: phone,
          plan_name: `${plan.name} (${effectiveCycle === 'annual' ? 'anual' : 'mensal'}) - aguardando Pix`,
          source: 'checkout',
        },
      }),
    }).catch(() => {});

    return json({ token });
  } catch (e) {
    console.error('[checkout-start] erro', e);
    // Desfaz para o lojista poder tentar de novo com o mesmo e-mail
    await supabase.from('payment_approvals').delete().eq('user_id', userId);
    await supabase.from('stores').delete().eq('owner_id', userId);
    await rollback();
    const msg = e instanceof Error && e.message.includes('Pix') ? 'Não conseguimos gerar o Pix agora. Tente novamente em instantes.' : 'Não foi possível concluir. Tente novamente.';
    return json({ error: msg }, 500);
  }
});
