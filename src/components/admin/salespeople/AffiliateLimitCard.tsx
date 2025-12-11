import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Affiliate {
  id: string;
  full_name: string;
  cpf: string;
  current_month_earnings: number;
  monthly_earnings_limit: number;
  last_earnings_reset_at: string | null;
  status: string;
}

interface AffiliateLimitCardProps {
  affiliate: Affiliate;
}

export function AffiliateLimitCard({ affiliate }: AffiliateLimitCardProps) {
  const percentage = (affiliate.current_month_earnings / affiliate.monthly_earnings_limit) * 100;
  const remaining = affiliate.monthly_earnings_limit - affiliate.current_month_earnings;

  const getStatusColor = (): string => {
    if (percentage >= 100) return 'bg-destructive';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusBadge = () => {
    if (percentage >= 100) {
      return <Badge variant="destructive">Limite Atingido</Badge>;
    }
    if (percentage >= 80) {
      return <Badge className="bg-orange-500 hover:bg-orange-600">Próximo do Limite</Badge>;
    }
    return <Badge variant="secondary">Normal</Badge>;
  };

  const formatCPF = (cpf: string | null): string => {
    if (!cpf) return '-';
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return cpf;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  };

  return (
    <Card className="overflow-hidden">
      <div className={`h-1 ${getStatusColor()}`} />
      <CardContent className="pt-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-muted">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm line-clamp-1">{affiliate.full_name}</p>
              <p className="text-xs text-muted-foreground">{formatCPF(affiliate.cpf)}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Ganhos do Mês</span>
            <span className="font-medium">
              R$ {affiliate.current_month_earnings.toFixed(2)} / R$ {affiliate.monthly_earnings_limit.toFixed(2)}
            </span>
          </div>
          <Progress value={Math.min(percentage, 100)} className="h-2" />
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{percentage.toFixed(1)}% utilizado</span>
            {remaining > 0 ? (
              <span className="text-green-600">R$ {remaining.toFixed(2)} disponível</span>
            ) : (
              <span className="text-destructive">Limite atingido</span>
            )}
          </div>
        </div>

        {/* Last Reset */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <Calendar className="h-3 w-3" />
          <span>
            Último reset:{' '}
            {affiliate.last_earnings_reset_at
              ? format(new Date(affiliate.last_earnings_reset_at), "dd/MM/yyyy", { locale: ptBR })
              : 'Nunca'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
