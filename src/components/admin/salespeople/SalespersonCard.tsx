import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Eye, User, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SalespersonCardProps {
  salesperson: {
    id: string;
    full_name: string;
    cnpj?: string | null;
    cpf?: string | null;
    referral_code: string;
    status: string;
    created_at: string;
    company_name?: string | null;
    company_trade_name?: string | null;
    cnae_codes?: string[] | null;
    salesperson_type?: string | null;
    current_month_earnings?: number | null;
    monthly_earnings_limit?: number | null;
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

  const isAffiliate = salesperson.salesperson_type === 'affiliate';
  const monthlyUsed = salesperson.current_month_earnings || 0;
  const monthlyLimit = salesperson.monthly_earnings_limit || 1900;
  const monthlyPercentage = Math.min((monthlyUsed / monthlyLimit) * 100, 100);

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
          <div className="flex flex-col items-end gap-1">
            {getStatusBadge(salesperson.status)}
            {isAffiliate ? (
              <Badge variant="outline" className="gap-1 text-xs">
                <User className="h-3 w-3" />
                Afiliado
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-xs bg-primary/5">
                <Building2 className="h-3 w-3" />
                Parceiro PJ
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          {isAffiliate ? (
            <div>
              <span className="text-muted-foreground">CPF:</span>{" "}
              <span className="font-mono">{salesperson.cpf || "—"}</span>
            </div>
          ) : (
            <>
              <div>
                <span className="text-muted-foreground">CNPJ:</span>{" "}
                <span className="font-mono">{salesperson.cnpj || "—"}</span>
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
            </>
          )}

          {/* Limite mensal para afiliados */}
          {isAffiliate && salesperson.status === 'active' && (
            <div className="pt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Limite mensal:</span>
                <span>R$ {monthlyUsed.toFixed(2)} / R$ {monthlyLimit.toFixed(2)}</span>
              </div>
              <Progress 
                value={monthlyPercentage} 
                className={`h-1.5 ${monthlyPercentage >= 80 ? '[&>div]:bg-amber-500' : ''}`}
              />
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
