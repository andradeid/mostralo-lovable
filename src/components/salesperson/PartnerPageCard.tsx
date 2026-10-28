import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QRCodeDisplay } from '@/components/share/QRCodeDisplay';
import { formatPlanMoney } from '@/lib/mostraloPricing';
import { FOUNDER_PLAN, FOUNDER_PRICE, normalizeCoupon, partnerPageUrl } from '@/lib/partnerOffer';
import { formatIsoDate } from '@/lib/partnerPayout';

interface PartnerStats {
  coupon_code: string | null;
  referral_code: string;
  views_total: number;
  views_30d: number;
  started: number;
  paid: number;
  commission: { type: 'percentage' | 'fixed'; value: number; applies_to: string };
  founder: { count: number; remaining: number; nextNumber: number | null };
  next_payout?: { date: string; amount: number; status: string } | null;
  received_total?: number;
}

const APPLIES: Record<string, string> = {
  all: 'de cada mensalidade paga, todo mês',
  recurring: 'de cada mensalidade paga, todo mês',
  first_payment: 'do primeiro pagamento do cliente',
};

/** Painel do parceiro: escolher o cupom, copiar o link da página e acompanhar os números. */
export function PartnerPageCard() {
  const qc = useQueryClient();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['my-partner-stats'],
    queryFn: async (): Promise<PartnerStats> => {
      const { data, error } = await supabase.rpc('my_partner_stats' as never);
      if (error) throw error;
      return data as PartnerStats;
    },
  });
  const [coupon, setCoupon] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (stats?.coupon_code) setCoupon(stats.coupon_code); }, [stats?.coupon_code]);

  if (isLoading || !stats) {
    return <Card><CardContent className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" aria-label="Carregando" /></CardContent></Card>;
  }

  const code = stats.coupon_code ?? stats.referral_code;
  const link = partnerPageUrl(window.location.origin, code);
  const changed = normalizeCoupon(coupon) !== (stats.coupon_code ?? '');
  const commission = stats.commission.type === 'fixed'
    ? `${formatPlanMoney(Number(stats.commission.value))} ${APPLIES[stats.commission.applies_to] ?? ''}`
    : `${Number(stats.commission.value)}% ${APPLIES[stats.commission.applies_to] ?? ''}`;

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.rpc('set_my_partner_coupon' as never, { p_code: coupon } as never);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Cupom salvo. Seu link já mudou.');
    qc.invalidateQueries({ queryKey: ['my-partner-stats'] });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Não foi possível copiar'); }
  };

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg md:text-xl">Minha página de indicação</CardTitle>
        <CardDescription>Quem entra pelo seu link ou usa o seu cupom fica ligado a você.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="partner-coupon">Seu cupom</Label>
            <div className="flex gap-2">
              <Input id="partner-coupon" value={coupon} onChange={e => setCoupon(normalizeCoupon(e.target.value))} placeholder="Ex.: JULIANA" className="h-11 font-semibold tracking-wider" />
              <Button type="button" variant="outline" className="h-11" onClick={save} disabled={!changed || normalizeCoupon(coupon).length < 4 || saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Salvando" /> : 'Salvar'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">De 4 a 15 letras ou números. Use seu nome ou @, fica mais fácil de lembrar.</p>
          </div>

          <div className="space-y-1.5">
            <Label>Seu link</Label>
            <div className="flex gap-2">
              <span className="flex h-11 min-w-0 flex-1 items-center truncate rounded-md bg-muted px-3 text-sm">{link.replace(/^https?:\/\//, '')}</span>
              <Button type="button" className="h-11" onClick={copy}>
                {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}Copiar
              </Button>
            </div>
            <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:underline">
              Ver minha página <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="rounded-lg bg-muted/60 p-3 text-sm">
            <p className="font-semibold">Quem chega por você ganha</p>
            <p className="text-muted-foreground">
              {stats.founder.remaining > 0
                ? `Vaga de sócio fundador: ${formatPlanMoney(FOUNDER_PRICE)} por mês para sempre no plano ${FOUNDER_PLAN}. Restam ${stats.founder.remaining} vagas.`
                : 'As vagas de sócio fundador acabaram: o indicado assina pelo preço normal e a indicação continua contando para você.'}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat value={stats.views_30d} label="visitas (30 dias)" />
            <Stat value={stats.started} label="começaram o cadastro" />
            <Stat value={stats.paid} label="assinaram" highlight />
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Sua comissão: <b className="text-foreground">{commission}</b>, sobre o valor que o cliente pagou.</p>
            <p>O que entra no mês é pago no <b className="text-foreground">dia 15 do mês seguinte</b>.</p>
            {stats.next_payout && (
              <p>Próximo pagamento: <b className="text-foreground">{formatPlanMoney(Number(stats.next_payout.amount))} em {formatIsoDate(stats.next_payout.date)}</b></p>
            )}
          </div>
          <QRCodeDisplay url={link} label="QR Code da sua página" size={120} />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ value, label, highlight }: { value: number; label: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border p-3">
      <p className={highlight ? 'text-2xl font-bold text-primary' : 'text-2xl font-bold'}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
