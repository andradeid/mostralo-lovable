// Cabeçalho da tela de Profissionais com os selos de total/ativos/inativos.
// JSX movido da ProfessionalsPage sem mudança.
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserX } from 'lucide-react';
import type { ProfessionalsKpis } from '@/lib/professionals/professionalsList';

interface ProfessionalsHeaderProps {
  kpis: ProfessionalsKpis;
}

export function ProfessionalsHeader({ kpis }: ProfessionalsHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Profissionais
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os profissionais que realizam atendimentos
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="gap-1">
          <Users className="h-3 w-3" />
          {kpis.total} Total
        </Badge>
        <Badge variant="default" className="gap-1 bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20">
          <UserCheck className="h-3 w-3" />
          {kpis.active} Ativos
        </Badge>
        {kpis.inactive > 0 && (
          <Badge variant="secondary" className="gap-1">
            <UserX className="h-3 w-3" />
            {kpis.inactive} Inativos
          </Badge>
        )}
      </div>
    </div>
  );
}
