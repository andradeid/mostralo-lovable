import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Percent, DollarSign, RefreshCw, CircleDot } from "lucide-react";

interface CurrentCommissionCardProps {
  config?: {
    commission_type: string;
    commission_value: number;
    applies_to: string;
  } | null;
}

export function CurrentCommissionCard({ config }: CurrentCommissionCardProps) {
  if (!config) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CircleDot className="h-4 w-4" />
            <span className="text-sm">Nenhuma configuração de comissão definida</span>
            <Badge variant="secondary" className="ml-auto">Padrão: 10%</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTypeLabel = () => {
    return config.commission_type === "percentage" 
      ? "Percentual sobre vendas" 
      : "Valor fixo por venda";
  };

  const getValueDisplay = () => {
    return config.commission_type === "percentage"
      ? `${config.commission_value}%`
      : `R$ ${config.commission_value.toFixed(2)}`;
  };

  const getAppliesLabel = () => {
    switch (config.applies_to) {
      case "first_payment":
        return "Apenas primeiro pagamento";
      case "recurring":
        return "Pagamentos recorrentes";
      case "all":
        return "Todos os pagamentos";
      default:
        return config.applies_to;
    }
  };

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            {config.commission_type === "percentage" ? (
              <Percent className="h-4 w-4 text-primary" />
            ) : (
              <DollarSign className="h-4 w-4 text-primary" />
            )}
            <span className="text-sm text-muted-foreground">{getTypeLabel()}</span>
          </div>
          
          <Badge variant="default" className="text-lg font-bold">
            {getValueDisplay()}
          </Badge>
          
          <div className="flex items-center gap-2 ml-auto">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{getAppliesLabel()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
