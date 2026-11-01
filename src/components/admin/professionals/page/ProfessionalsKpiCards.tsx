// Resumo em números (total, ativos, inativos, com comissão).
// JSX movido da ProfessionalsPage sem mudança.
import { Card } from '@/components/ui/card';
import { Users, Percent, UserCheck, UserX } from 'lucide-react';
import type { ProfessionalsKpis } from '@/lib/professionals/professionalsList';

interface ProfessionalsKpiCardsProps {
  kpis: ProfessionalsKpis;
}

export function ProfessionalsKpiCards({ kpis }: ProfessionalsKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-lg sm:text-2xl font-bold">{kpis.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
      </Card>
      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10">
            <UserCheck className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-lg sm:text-2xl font-bold text-green-600">{kpis.active}</p>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </div>
        </div>
      </Card>
      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-muted">
            <UserX className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg sm:text-2xl font-bold text-muted-foreground">{kpis.inactive}</p>
            <p className="text-xs text-muted-foreground">Inativos</p>
          </div>
        </div>
      </Card>
      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10">
            <Percent className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-lg sm:text-2xl font-bold text-blue-600">{kpis.withCommission}</p>
            <p className="text-xs text-muted-foreground">Com Comissão</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
