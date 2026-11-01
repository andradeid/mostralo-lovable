// Quatro cards do topo da tela de cupons: ativos, usos, conversão e públicos.
import { Card, CardContent } from '@/components/ui/card';
import { Ticket, TrendingUp, Eye, Target } from 'lucide-react';
import type { Coupon } from '@/lib/coupons/adminCoupons';

interface Props {
  coupons: Coupon[];
  activeCoupons: number;
  scheduledCoupons: number;
  totalUses: number;
  conversionRate: string;
}

export function CouponsKpiCards({ coupons, activeCoupons, scheduledCoupons, totalUses, conversionRate }: Props) {
  return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ativos</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Ticket className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-3xl font-bold">{activeCoupons}</p>
            {scheduledCoupons > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">{scheduledCoupons} agendado(s)</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Usos Totais</span>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold">{totalUses}</p>
            <p className="text-xs text-muted-foreground mt-0.5">cupons utilizados</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Conversão</span>
              <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Target className="h-4 w-4 text-orange-600" />
              </div>
            </div>
            <p className="text-3xl font-bold">{conversionRate}{conversionRate !== '—' ? '%' : ''}</p>
            <p className="text-xs text-muted-foreground mt-0.5">usos / limite</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Públicos</span>
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Eye className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold">{coupons.filter(c => c.is_public).length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">visíveis na home</p>
          </CardContent>
        </Card>
      </div>
  );
}
