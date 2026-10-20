import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Loader2, MessageCircle, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface InviteTarget {
  id: string;
  name: string;
  phone?: string | null;
}

interface ProfessionalInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professional: InviteTarget | null;
  /** Link já gerado (ex.: logo depois do cadastro). Sem ele, a janela pede o e-mail e gera. */
  inviteUrl?: string | null;
  storeName?: string;
}

/**
 * Convite por link: o profissional abre o link, cria a própria senha e entra no painel dele.
 * O dono só copia o link ou manda pelo WhatsApp.
 */
export function ProfessionalInviteDialog({ open, onOpenChange, professional, inviteUrl, storeName }: ProfessionalInviteDialogProps) {
  const [email, setEmail] = useState('');
  const [url, setUrl] = useState<string | null>(inviteUrl ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setUrl(inviteUrl ?? null);
      setEmail('');
    }
  }, [open, inviteUrl]);

  const firstName = professional?.name?.split(' ')[0] || '';
  const message = url
    ? `Olá ${firstName}! Criei seu acesso${storeName ? ` na ${storeName}` : ''} no Mostralo. Abra o link, crie sua senha e veja sua agenda e suas comissões:\n${url}`
    : '';

  const generate = async () => {
    if (!professional) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Informe um e-mail válido');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('professional-invite', {
        body: { action: 'create', professional_id: professional.id, email: email.trim() },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao gerar convite');
      setUrl(data.invite_url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao gerar convite');
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success('Mensagem com o link copiada');
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  const phoneDigits = (professional?.phone || '').replace(/\D/g, '');
  const waNumber = phoneDigits ? (phoneDigits.length <= 11 ? `55${phoneDigits}` : phoneDigits) : '';
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Convite de acesso{firstName ? ` — ${firstName}` : ''}
          </DialogTitle>
          <DialogDescription>
            {url
              ? 'Mande o link para o profissional. Ele cria a própria senha e já entra no painel dele (agenda e comissões). O link vale por 7 dias.'
              : 'Informe o e-mail que o profissional vai usar para entrar. Depois é só mandar o link para ele.'}
          </DialogDescription>
        </DialogHeader>

        {!url ? (
          <div className="space-y-2">
            <Label htmlFor="invite-email">E-mail do profissional</Label>
            <Input
              id="invite-email"
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@email.com"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Link do convite</Label>
            <div className="rounded-md border bg-muted/40 p-2 text-xs break-all select-all">{url}</div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!url ? (
            <Button onClick={generate} disabled={loading} className="w-full sm:w-auto">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Gerar link
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={copy} className="w-full sm:w-auto">
                <Copy className="h-4 w-4 mr-2" /> Copiar mensagem
              </Button>
              <Button asChild className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                <a href={waUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" /> Enviar no WhatsApp
                </a>
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
