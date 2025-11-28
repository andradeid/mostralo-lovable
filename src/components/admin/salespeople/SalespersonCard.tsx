import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SalespersonCardProps {
  salesperson: {
    id: string;
    full_name: string;
    cnpj: string;
    referral_code: string;
    status: string;
    created_at: string;
    company_name?: string;
    company_trade_name?: string;
    cnae_codes?: string[];
  };
  onViewDetails: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}

export function SalespersonCard({ 
  salesperson, 
  onViewDetails, 
  onApprove, 
  onReject 
}: SalespersonCardProps) {
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending_approval: { label: "Pendente", variant: "secondary" },
      pending_contract: { label: "Aguardando Contrato", variant: "outline" },
      active: { label: "Ativo", variant: "default" },
      inactive: { label: "Inativo", variant: "destructive" },
      rejected: { label: "Rejeitado", variant: "destructive" },
    };
    
    const config = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const showActionButtons = salesperson.status === 'pending_approval' && onApprove && onReject;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{salesperson.full_name}</h3>
            <p className="text-sm text-muted-foreground">
              Código: {salesperson.referral_code}
            </p>
          </div>
          {getStatusBadge(salesperson.status)}
        </div>

        <div className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">CNPJ:</span>{" "}
            <span className="font-mono">{salesperson.cnpj}</span>
          </div>
          
          {salesperson.company_name && (
            <div>
              <span className="text-muted-foreground">Razão Social:</span>{" "}
              {salesperson.company_name}
            </div>
          )}

          {salesperson.cnae_codes && salesperson.cnae_codes.length > 0 && (
            <div>
              <span className="text-muted-foreground">CNAEs:</span>{" "}
              {salesperson.cnae_codes.join(", ")}
            </div>
          )}

          <div>
            <span className="text-muted-foreground">Cadastrado em:</span>{" "}
            {format(new Date(salesperson.created_at), "dd/MM/yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onViewDetails}>
          <Eye className="h-4 w-4 mr-2" />
          Ver Detalhes
        </Button>
        
        {showActionButtons && (
          <>
            <Button 
              variant="default" 
              size="sm" 
              onClick={onApprove}
              className="flex-1"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Aprovar
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={onReject}
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rejeitar
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
