import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Copy, Eye, EyeOff, Loader2, PartyPopper, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckoutLayout } from '@/components/checkout/CheckoutLayout';
import { formatPlanMoney } from '@/lib/mostraloPricing';
import { supabase } from '@/integrations/supabase/client';
import { getCheckoutStatus, rememberCheckoutToken, setCheckoutPassword, type CheckoutError, type CheckoutStatus } from '@/lib/checkout';

const POLL_MS = 5000;

export default function AssinarPagamento() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<CheckoutStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const polls = useRef(0);

  const refresh = useCallback(async (forceCheck = false) => {
    try {
      polls.current += 1;
      const next = await getCheckoutStatus(token, forceCheck || polls.current % 4 === 0);
      setData(next);
      setError(null);
      if (next.status !== 'pending') rememberCheckoutToken(next.status === 'paid' && next.needs_password ? token : null);
    } catch (e) {
      setError((e as CheckoutError).message);
    }
  }, [token]);

  useEffect(() => { document.title = 'Pagamento - Mostralo'; refresh(true); }, [refresh]);
  useEffect(() => {
    if (data && data.status !== 'pending') return;
    const id = window.setInterval(() => { if (!document.hidden) refresh(); }, POLL_MS);
    return () => window.clearInterval(id);
  }, [data, refresh]);

  const copy = async () => {
    if (!data?.pix_copia_cola) return;
    try { await navigator.clipboard.writeText(data.pix_copia_cola); } catch { /* sem permissão */ }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 3000);
  };

  if (error && !data) {
    return (
      <CheckoutLayout step={1}>
        <Card className="mx-auto max-w-md text-center"><CardContent className="space-y-4 p-8">
          <p>{error}</p>
          <Button asChild><Link to="/assinar">Começar de novo</Link></Button>
        </CardContent></Card>
      </CheckoutLayout>
    );
  }

  if (!data) {
    return <CheckoutLayout step={1}><div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Carregando" /></div></CheckoutLayout>;
  }

  if (data.status === 'paid') {
    return data.needs_password
      ? <CreatePassword token={token} data={data} onDone={() => { rememberCheckoutToken(null); navigate('/dashboard'); }} />
      : (
        <CheckoutLayout step={2}>
          <Card className="mx-auto max-w-md text-center"><CardContent className="space-y-4 p-8">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <h1 className="text-xl font-bold">Sua conta já está pronta</h1>
            <p className="text-sm text-muted-foreground">Entre com {data.email} e a senha que você criou.</p>
            <Button asChild className="w-full"><Link to="/auth">Entrar no painel</Link></Button>
          </CardContent></Card>
        </CheckoutLayout>
      );
  }

  if (data.status === 'cancelled') {
    return (
      <CheckoutLayout step={1}>
        <Card className="mx-auto max-w-md text-center"><CardContent className="space-y-4 p-8">
          <p>Este pagamento foi cancelado. Fale com a gente ou comece de novo.</p>
          <Button asChild><Link to="/assinar">Começar de novo</Link></Button>
        </CardContent></Card>
      </CheckoutLayout>
    );
  }

  const cycleLabel = data.billing_cycle === 'annual' ? 'anual (12 meses)' : 'mensal';
  const expires = data.pix_expires_at ? new Date(data.pix_expires_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <CheckoutLayout step={1}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><QrCode className="h-5 w-5 text-primary" /> Pague com Pix</CardTitle>
            <p className="text-sm text-muted-foreground">Abra o app do seu banco, escolha Pix e escaneie o código ou use o copia e cola.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex justify-center">
              {data.pix_qrcode_base64
                ? <img src={data.pix_qrcode_base64.startsWith('data:') ? data.pix_qrcode_base64 : `data:image/png;base64,${data.pix_qrcode_base64}`} alt="QR Code Pix" className="h-56 w-56 rounded-lg border bg-white p-2" />
                : <div className="flex h-56 w-56 items-center justify-center rounded-lg border text-sm text-muted-foreground">Gerando QR Code...</div>}
            </div>
            {data.pix_copia_cola && (
              <div className="space-y-2">
                <Label htmlFor="copia-cola">Pix copia e cola</Label>
                <div className="flex gap-2">
                  <Input id="copia-cola" readOnly value={data.pix_copia_cola} className="font-mono text-xs" onFocus={e => e.currentTarget.select()} />
                  <Button type="button" onClick={copy} variant={copied ? 'secondary' : 'default'} className="shrink-0">
                    <Copy className="mr-1 h-4 w-4" /> {copied ? 'Copiado!' : 'Copiar'}
                  </Button>
                </div>
              </div>
            )}
            <div className="flex items-center justify-center gap-2 rounded-lg bg-muted p-3 text-sm" role="status" aria-live="polite">
              <Loader2 className="h-4 w-4 animate-spin text-primary" /> Aguardando o pagamento... esta tela atualiza sozinha.
            </div>
            {expires && <p className="text-center text-xs text-muted-foreground">Este código vale até {expires}. Depois disso, um novo é gerado aqui mesmo.</p>}
            <Button type="button" variant="outline" className="w-full" onClick={() => refresh(true)}>Já paguei</Button>
          </CardContent>
        </Card>
        <aside>
          <Card>
            <CardContent className="space-y-2 p-5 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Resumo</p>
              <p className="text-lg font-semibold">{data.company_name}</p>
              <p>Plano {data.plan_name} · {cycleLabel}</p>
              <p className="text-2xl font-bold text-primary">{formatPlanMoney(data.amount)}</p>
              {data.email && <p className="text-muted-foreground">Login: {data.email}</p>}
            </CardContent>
          </Card>
        </aside>
      </div>
    </CheckoutLayout>
  );
}

function CreatePassword({ token, data, onDone }: { token: string; data: CheckoutStatus; onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const rules = [
    { ok: password.length >= 8, label: '8 caracteres ou mais' },
    { ok: /[A-Za-z]/.test(password) && /\d/.test(password), label: 'letras e números' },
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!rules.every(r => r.ok)) { setError('A senha precisa ter 8 caracteres ou mais, com letras e números.'); return; }
    if (password !== confirm) { setError('As senhas não são iguais.'); return; }
    setLoading(true);
    try {
      const { email } = await setCheckoutPassword(token, password);
      const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signErr) throw new Error('Senha criada! Entre com seu e-mail e senha.');
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CheckoutLayout step={2}>
      <Card className="mx-auto max-w-md">
        <CardHeader className="text-center">
          <PartyPopper className="mx-auto h-10 w-10 text-primary" />
          <CardTitle className="text-xl">Pagamento confirmado!</CardTitle>
          <p className="text-sm text-muted-foreground">Agora crie a senha para entrar no painel da <b>{data.company_name}</b>.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1">
              <Label>E-mail de acesso</Label>
              <Input value={data.email ?? ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Crie sua senha</Label>
              <div className="relative">
                <Input id="password" type={show ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShow(s => !s)} aria-label={show ? 'Esconder senha' : 'Mostrar senha'}>
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <ul className="flex gap-3 text-xs">{rules.map(r => <li key={r.label} className={r.ok ? 'text-green-600' : 'text-muted-foreground'}>{r.ok ? '✓' : '○'} {r.label}</li>)}</ul>
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm">Repita a senha</Label>
              <Input id="confirm" type={show ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} />
            </div>
            {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...</> : 'Criar senha e entrar no painel'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </CheckoutLayout>
  );
}
