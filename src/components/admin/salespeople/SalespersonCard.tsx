import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, XCircle, Eye, User, Building2, Trophy, Star, Sparkles, Medal, Users, Target, Ban } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getLevelConfig, type QualificationLevel } from "@/lib/qualificationLevels";

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
    profile_photo_url?: string | null;
    qualification_score?: number | null;
    qualification_level?: string | null;
    leads_count?: number;
    clients_count?: number;
    is_blocked?: boolean;
    blocked_reason?: string | null;
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
    return <Badge variant={config.variant} className="text-[10px] md:text-xs h-5">{config.label}</Badge>;
  };

  const isAffiliate = salesperson.salesperson_type === 'affiliate';
  const monthlyUsed = salesperson.current_month_earnings || 0;
  const monthlyLimit = salesperson.monthly_earnings_limit || 1900;
  const monthlyPercentage = Math.min((monthlyUsed / monthlyLimit) * 100, 100);

  const showActionButtons = salesperson.status === 'pending_approval' && onApprove && onReject;

  const qualificationLevel = (salesperson.qualification_level || 'evaluation') as QualificationLevel;
  const levelConfig = getLevelConfig(qualificationLevel);
  const score = salesperson.qualification_score || 0;

  const getQualificationIcon = () => {
    switch (qualificationLevel) {
      case 'top': return <Trophy className="h-3 w-3" />;
      case 'promising': return <Star className="h-3 w-3" />;
      case 'beginner': return <Sparkles className="h-3 w-3" />;
      default: return <Medal className="h-3 w-3" />;
    }
  };

  const initials = salesperson.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card>
      <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
        {/* Header com avatar e info */}
        <div className="flex items-start gap-2 md:gap-3 mb-3 md:mb-4">
          {/* Avatar responsivo */}
          <Avatar className="h-10 w-10 md:h-14 md:w-14 border-2 border-muted shrink-0">
            <AvatarImage src={salesperson.profile_photo_url || undefined} alt={salesperson.full_name} />
            <AvatarFallback className="text-sm md:text-lg font-semibold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base md:text-lg truncate">{salesperson.full_name}</h3>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              Código: {salesperson.referral_code}
            </p>
            
            {/* Badges inline no mobile */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {salesperson.is_blocked && (
                <Badge variant="destructive" className="gap-1 text-[10px] h-5">
                  <Ban className="h-2.5 w-2.5" />
                  Bloq.
                </Badge>
              )}
              {!salesperson.is_blocked && getStatusBadge(salesperson.status)}
              {isAffiliate ? (
                <Badge variant="outline" className="gap-1 text-[10px] h-5">
                  <User className="h-2.5 w-2.5" />
                  <span className="hidden md:inline">Afiliado</span>
                  <span className="md:hidden">Afil.</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-[10px] h-5 bg-primary/5">
                  <Building2 className="h-2.5 w-2.5" />
                  PJ
                </Badge>
              )}
              {/* Qualification Badge */}
              {score > 0 && (
                <Badge variant="outline" className={`gap-1 text-[10px] h-5 ${levelConfig.color}`}>
                  {getQualificationIcon()}
                  <span className="hidden md:inline">{levelConfig.shortLabel}</span>
                  <span className="md:hidden">{score}pts</span>
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Métricas de Performance */}
        <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-muted/50 mb-3">
          <div className="flex items-center gap-2 p-1.5 md:p-2">
            <Target className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-muted-foreground">Leads</p>
              <p className="font-semibold text-sm md:text-base">{salesperson.leads_count || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-1.5 md:p-2">
            <Users className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-muted-foreground">Clientes</p>
              <p className="font-semibold text-sm md:text-base">{salesperson.clients_count || 0}</p>
            </div>
          </div>
        </div>

        <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
          {isAffiliate ? (
            <div className="truncate">
              <span className="text-muted-foreground">CPF:</span>{" "}
              <span className="font-mono text-xs">{salesperson.cpf || "—"}</span>
            </div>
          ) : (
            <>
              <div className="truncate">
                <span className="text-muted-foreground">CNPJ:</span>{" "}
                <span className="font-mono text-xs">{salesperson.cnpj || "—"}</span>
              </div>
              
              {salesperson.company_name && (
                <div className="truncate">
                  <span className="text-muted-foreground">Razão:</span>{" "}
                  <span className="text-xs">{salesperson.company_name}</span>
                </div>
              )}
            </>
          )}

          {/* Limite mensal para afiliados */}
          {isAffiliate && salesperson.status === 'active' && (
            <div className="pt-1 space-y-1">
              <div className="flex justify-between text-[10px] md:text-xs">
                <span className="text-muted-foreground">Limite:</span>
                <span>R$ {monthlyUsed.toFixed(0)} / R$ {monthlyLimit.toFixed(0)}</span>
              </div>
              <Progress 
                value={monthlyPercentage} 
                className={`h-1 md:h-1.5 ${monthlyPercentage >= 80 ? '[&>div]:bg-amber-500' : ''}`}
              />
            </div>
          )}

          <div className="text-[10px] md:text-xs text-muted-foreground pt-1">
            Cadastrado: {format(new Date(salesperson.created_at), "dd/MM/yy", { locale: ptBR })}
          </div>
        </div>
      </CardContent>

      {/* Footer com botões responsivos */}
      <CardFooter className="flex flex-col gap-2 px-3 md:px-6 pb-3 md:pb-6 pt-0">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onViewDetails} 
          className="w-full h-8 md:h-9 text-xs md:text-sm"
        >
          <Eye className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5" />
          Ver Detalhes
        </Button>
        
        {showActionButtons && (
          <div className="flex gap-2 w-full">
            <Button 
              variant="default" 
              size="sm" 
              onClick={onApprove}
              className="flex-1 h-8 md:h-9 text-xs md:text-sm"
            >
              <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-1.5" />
              <span className="hidden md:inline">Aprovar</span>
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={onReject}
              className="flex-1 h-8 md:h-9 text-xs md:text-sm"
            >
              <XCircle className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-1.5" />
              <span className="hidden md:inline">Rejeitar</span>
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
