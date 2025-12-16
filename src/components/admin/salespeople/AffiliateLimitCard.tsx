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
      return <Badge variant="destructive" className="text-[10px] md:text-xs h-5">Limite Atingido</Badge>;
    }
    if (percentage >= 80) {
      return <Badge className="bg-orange-500 hover:bg-orange-600 text-[10px] md:text-xs h-5">Próximo</Badge>;
    }
    return <Badge variant="secondary" className="text-[10px] md:text-xs h-5">Normal</Badge>;
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
      <CardContent className="p-3 md:pt-4 md:p-4 space-y-3 md:space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 rounded-full bg-muted shrink-0">
              <User className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-xs md:text-sm truncate">{affiliate.full_name}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">{formatCPF(affiliate.cpf)}</p>
            </div>
            {/* Badge visível apenas no desktop ao lado */}
            <div className="hidden md:block shrink-0">{getStatusBadge()}</div>
          </div>
          {/* Badge visível no mobile abaixo */}
          <div className="md:hidden">{getStatusBadge()}</div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5 md:space-y-2">
          <div className="flex justify-between text-xs md:text-sm">
            <span className="text-muted-foreground">Ganhos</span>
            <span className="font-medium text-right">
              <span className="md:hidden">R$ {affiliate.current_month_earnings.toFixed(0)} / {affiliate.monthly_earnings_limit.toFixed(0)}</span>
              <span className="hidden md:inline">R$ {affiliate.current_month_earnings.toFixed(2)} / R$ {affiliate.monthly_earnings_limit.toFixed(2)}</span>
            </span>
          </div>
          <Progress value={Math.min(percentage, 100)} className="h-1.5 md:h-2" />
          <div className="flex justify-between text-[10px] md:text-xs">
            <span className="text-muted-foreground">{percentage.toFixed(0)}%</span>
            {remaining > 0 ? (
              <span className="text-green-600">
                <span className="md:hidden">R$ {remaining.toFixed(0)} disp.</span>
                <span className="hidden md:inline">R$ {remaining.toFixed(2)} disponível</span>
              </span>
            ) : (
              <span className="text-destructive">Limite atingido</span>
            )}
          </div>
        </div>

        {/* Last Reset */}
        <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-muted-foreground pt-2 border-t">
          <Calendar className="h-3 w-3 shrink-0" />
          <span className="truncate">
            Reset:{' '}
            {affiliate.last_earnings_reset_at
              ? format(new Date(affiliate.last_earnings_reset_at), "dd/MM/yy", { locale: ptBR })
              : 'Nunca'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
