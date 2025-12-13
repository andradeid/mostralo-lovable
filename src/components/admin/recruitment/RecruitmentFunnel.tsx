import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  CheckCircle, 
  FileText, 
  Users, 
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  Clock,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface FunnelData {
  pending_approval: number;
  pending_contract: number;
  contract_accepted: number;
  active: number;
  rejected: number;
  inactive: number;
  oldest_pending: string | null;
}

interface RecruitmentFunnelProps {
  onRefresh?: () => void;
}

export function RecruitmentFunnel({ onRefresh }: RecruitmentFunnelProps) {
  const [data, setData] = useState<FunnelData>({
    pending_approval: 0,
    pending_contract: 0,
    contract_accepted: 0,
    active: 0,
    rejected: 0,
    inactive: 0,
    oldest_pending: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFunnelData();
  }, []);

  const fetchFunnelData = async () => {
    try {
      setLoading(true);
      const { data: salespeople, error } = await supabase
        .from('salespeople')
        .select('status, created_at');

      if (error) throw error;

      const counts: FunnelData = {
        pending_approval: 0,
        pending_contract: 0,
        contract_accepted: 0,
        active: 0,
        rejected: 0,
        inactive: 0,
        oldest_pending: null
      };

      let oldestPendingDate: Date | null = null;

      salespeople?.forEach(sp => {
        const status = sp.status as keyof typeof counts;
        if (status in counts && typeof counts[status] === 'number') {
          (counts[status] as number)++;
        }

        // Track oldest pending
        if (sp.status === 'pending_approval') {
          const createdAt = new Date(sp.created_at);
          if (!oldestPendingDate || createdAt < oldestPendingDate) {
            oldestPendingDate = createdAt;
          }
        }
      });

      if (oldestPendingDate) {
        counts.oldest_pending = oldestPendingDate.toISOString();
      }

      setData(counts);
    } catch (error) {
      console.error('Erro ao buscar dados do funil:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalCandidates = data.pending_approval + data.pending_contract + data.contract_accepted + data.active;
  const conversionRate = totalCandidates > 0 ? Math.round((data.active / totalCandidates) * 100) : 0;

  const getDaysAgo = (dateString: string | null) => {
    if (!dateString) return 0;
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  };

  const oldestPendingDays = getDaysAgo(data.oldest_pending);

  const stages = [
    {
      id: 'pending_approval',
      label: 'Candidatos',
      icon: UserPlus,
      count: data.pending_approval,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      textColor: 'text-yellow-600 dark:text-yellow-400',
      action: { label: 'Analisar', href: '/dashboard/salespeople?status=pending_approval' }
    },
    {
      id: 'pending_contract',
      label: 'Aprovados',
      icon: CheckCircle,
      count: data.pending_contract,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      action: { label: 'Cobrar Contrato', href: '/dashboard/salespeople?status=pending_contract' }
    },
    {
      id: 'contract_accepted',
      label: 'Contrato',
      icon: FileText,
      count: data.contract_accepted,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      textColor: 'text-purple-600 dark:text-purple-400',
      action: { label: 'Ativar', href: '/dashboard/salespeople?status=contract_accepted' }
    },
    {
      id: 'active',
      label: 'Ativos',
      icon: Users,
      count: data.active,
      color: 'bg-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-600 dark:text-green-400',
      action: { label: 'Ver Ativos', href: '/dashboard/salespeople?status=active' }
    }
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Funil de Recrutamento
          </CardTitle>
          <div className="flex items-center gap-3">
            {data.rejected > 0 && (
              <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 dark:bg-red-950/30">
                <XCircle className="h-3 w-3 mr-1" />
                {data.rejected} rejeitados
              </Badge>
            )}
            <Badge variant="secondary" className="text-base px-3 py-1">
              📊 {conversionRate}% conversão
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Funnel Stages */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <div key={stage.id} className="relative">
                <div className={cn(
                  "p-4 rounded-xl border-2 transition-all hover:shadow-md",
                  stage.bgColor,
                  stage.borderColor
                )}>
                  {/* Stage Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn("p-2 rounded-lg", stage.color)}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    {index < stages.length - 1 && (
                      <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-10" />
                    )}
                  </div>
                  
                  {/* Count */}
                  <p className={cn("text-4xl font-bold mb-1", stage.textColor)}>
                    {loading ? '-' : stage.count}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    {stage.label}
                  </p>
                  
                  {/* Action Button */}
                  <Link to={stage.action.href}>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs"
                      disabled={stage.count === 0}
                    >
                      {stage.action.label}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Conversão</p>
              <p className="font-semibold">{conversionRate}%</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Users className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Total no Funil</p>
              <p className="font-semibold">{totalCandidates}</p>
            </div>
          </div>
          
          <div className={cn(
            "flex items-center gap-2 p-3 rounded-lg",
            oldestPendingDays > 7 ? "bg-red-500/10" : "bg-muted/50"
          )}>
            <Clock className={cn(
              "h-4 w-4",
              oldestPendingDays > 7 ? "text-red-500" : "text-muted-foreground"
            )} />
            <div>
              <p className="text-xs text-muted-foreground">Pendente mais antigo</p>
              <p className={cn(
                "font-semibold",
                oldestPendingDays > 7 && "text-red-600"
              )}>
                {data.oldest_pending ? `${oldestPendingDays} dias` : '-'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <XCircle className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Inativos</p>
              <p className="font-semibold">{data.inactive}</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(data.pending_approval > 0 || oldestPendingDays > 7) && (
          <div className="space-y-2">
            {data.pending_approval > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  <strong>{data.pending_approval}</strong> candidato(s) aguardando análise
                </p>
                <Link to="/dashboard/salespeople?status=pending_approval" className="ml-auto">
                  <Button variant="outline" size="sm" className="text-xs">
                    Analisar Agora
                  </Button>
                </Link>
              </div>
            )}
            
            {oldestPendingDays > 7 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-700 dark:text-red-400">
                  Candidato há <strong>{oldestPendingDays} dias</strong> sem resposta - risco de perder interesse!
                </p>
              </div>
            )}
            
            {data.pending_contract > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <FileText className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  <strong>{data.pending_contract}</strong> vendedor(es) aprovado(s) aguardando assinatura do contrato
                </p>
                <Link to="/dashboard/salespeople?status=pending_contract" className="ml-auto">
                  <Button variant="outline" size="sm" className="text-xs">
                    Cobrar Contrato
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
