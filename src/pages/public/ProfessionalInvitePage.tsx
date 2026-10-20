import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface InviteInfo {
  professional_name: string;
  store_name: string;
  store_logo: string | null;
  email: string;
}

/** Página do convite: o profissional cria a própria senha e entra no painel dele. */
const ProfessionalInvitePage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.functions.invoke('professional-invite', { body: { action: 'resolve', token } });
      if (cancelled) return;
      if (data?.success) setInfo(data as InviteInfo);
      else setError(data?.error || 'Este link não é válido.');
      setLoading(false);
    })().catch(() => {
      if (!cancelled) {
        setError('Este link não é válido ou expirou.');
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (password.length < 6) return setFormError('A senha precisa ter pelo menos 6 caracteres.');
    if (password !== confirm) return setFormError('As senhas não são iguais.');
    if (!info) return;
    setSaving(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('professional-invite', {
        body: { action: 'accept', token, password },
      });
      if (fnError || !data?.success) {
        setFormError(data?.error || 'Não foi possível criar o acesso. Tente de novo.');
        return;
      }
      const { error: signError } = await supabase.auth.signInWithPassword({ email: info.email, password });
      setDone(true);
      setTimeout(() => navigate(signError ? '/auth' : '/profissional'), 1200);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              Carregando convite...
            </div>
          ) : error ? (
            <div className="text-center space-y-3 py-6">
              <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
              <p className="font-medium">{error}</p>
              <Button asChild variant="outline"><Link to="/auth">Ir para o login</Link></Button>
            </div>
          ) : done ? (
            <div className="text-center space-y-3 py-6">
              <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
              <p className="font-medium">Acesso criado! Abrindo seu painel...</p>
            </div>
          ) : info && (
            <>
              <div className="text-center space-y-2">
                {info.store_logo && (
                  <img src={info.store_logo} alt={info.store_name} className="h-16 w-16 rounded-full object-cover mx-auto" />
                )}
                <h1 className="text-xl font-bold">Olá, {info.professional_name.split(' ')[0]}!</h1>
                <p className="text-sm text-muted-foreground">
                  Crie sua senha para acessar a agenda e as comissões na <strong>{info.store_name}</strong>.
                </p>
              </div>
              <form onSubmit={submit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>E-mail de acesso</Label>
                  <Input value={info.email} readOnly className="bg-muted/50" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inv-pass">Crie uma senha</Label>
                  <Input id="inv-pass" type="password" autoComplete="new-password" value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inv-pass2">Repita a senha</Label>
                  <Input id="inv-pass2" type="password" autoComplete="new-password" value={confirm}
                    onChange={(e) => setConfirm(e.target.value)} />
                </div>
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar acesso e entrar
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessionalInvitePage;
