import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertCircle,
  Timer,
  UtensilsCrossed,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KitchenStatsProps {
  totalPending: number;
  totalPreparing: number;
  totalReady?: number;
}

export function KitchenStats({ totalPending, totalPreparing, totalReady = 0 }: KitchenStatsProps) {
  const totalActive = totalPending + totalPreparing;
  const allClear = totalActive === 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{totalPending}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{totalPreparing}</p>
              <p className="text-xs text-muted-foreground">Em Preparo</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{totalActive}</p>
              <p className="text-xs text-muted-foreground">Total Ativos</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{totalReady}</p>
              <p className="text-xs text-muted-foreground">Prontos hoje</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
