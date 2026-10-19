// Cobrança Pix imediata (cob) na conta EFI do Mostralo (subscription_payment_config).
// Usado pelo checkout público de assinatura.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

function parsePem(pem: string) {
  const clean = pem.trim();
  const certs = clean.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g);
  const key = clean.match(/-----BEGIN (RSA )?PRIVATE KEY-----[\s\S]*?-----END (RSA )?PRIVATE KEY-----/);
  return { cert: certs ? certs.join('\n') : '', key: key ? key[0] : '' };
}

function randomTxid(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export interface EfiSession {
  baseUrl: string;
  token: string;
  client: Deno.HttpClient;
  pixKey: string;
}

export async function openEfiSession(supabase: SupabaseClient): Promise<EfiSession> {
  const { data: cfg } = await supabase
    .from('subscription_payment_config')
    .select('*')
    .eq('is_active', true)
    .single();
  if (!cfg?.efi_pix_key) throw new Error('Sistema de pagamento não configurado');
  const isProd = (cfg.efi_environment || 'sandbox') === 'production';
  const clientId = isProd ? cfg.efi_client_id_production : cfg.efi_client_id;
  const clientSecret = isProd ? cfg.efi_client_secret_production : cfg.efi_client_secret;
  const pem = isProd ? cfg.efi_certificate_pem_production : cfg.efi_certificate_pem;
  if (!clientId || !clientSecret || !pem) throw new Error('Credenciais EFI não configuradas');
  const { cert, key } = parsePem(pem);
  const baseUrl = isProd ? 'https://pix.api.efipay.com.br' : 'https://pix-h.api.efipay.com.br';
  const client = Deno.createHttpClient({ cert, key, http2: false });
  const auth = await fetch(`${baseUrl}/oauth/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials' }),
    client,
  });
  const authData = await auth.json().catch(() => ({}));
  if (!auth.ok || !authData.access_token) {
    client.close();
    throw new Error('Erro de autenticação com o gateway');
  }
  return { baseUrl, token: authData.access_token, client, pixKey: cfg.efi_pix_key };
}

export async function createPixCharge(
  s: EfiSession,
  amount: number,
  description: string,
  expirationSeconds: number,
  payer?: { name: string; document: string },
) {
  const txid = randomTxid();
  const body: Record<string, unknown> = {
    calendario: { expiracao: expirationSeconds },
    valor: { original: amount.toFixed(2) },
    chave: s.pixKey,
    solicitacaoPagador: description.substring(0, 140),
  };
  const doc = payer?.document?.replace(/\D/g, '') ?? '';
  if (payer?.name && (doc.length === 11 || doc.length === 14)) {
    body.devedor = doc.length === 11 ? { cpf: doc, nome: payer.name.substring(0, 200) } : { cnpj: doc, nome: payer.name.substring(0, 200) };
  }
  const res = await fetch(`${s.baseUrl}/v2/cob/${txid}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${s.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    client: s.client,
  });
  const cob = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[efi-pix] erro ao criar cobrança', cob);
    throw new Error('Erro ao gerar cobrança Pix');
  }
  let copiaCola: string | null = cob.pixCopiaECola ?? null;
  let qrBase64: string | null = null;
  if (cob.loc?.id) {
    const qr = await fetch(`${s.baseUrl}/v2/loc/${cob.loc.id}/qrcode`, {
      headers: { Authorization: `Bearer ${s.token}` },
      client: s.client,
    });
    if (qr.ok) {
      const q = await qr.json();
      copiaCola = (q.qrcode || copiaCola || '').replace(/\s+/g, '').trim() || null;
      qrBase64 = q.imagemQrcode || null;
    }
  }
  return {
    txid: cob.txid || txid,
    copiaCola,
    qrBase64,
    expiresAt: new Date(Date.now() + expirationSeconds * 1000).toISOString(),
  };
}

export async function getPixCharge(s: EfiSession, txid: string) {
  const res = await fetch(`${s.baseUrl}/v2/cob/${txid}`, {
    headers: { Authorization: `Bearer ${s.token}` },
    client: s.client,
  });
  if (!res.ok) return null;
  return await res.json();
}
