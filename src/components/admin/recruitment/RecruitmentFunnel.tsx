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
  ExternalLink,
  Star
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
  avg_score: number;
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
    oldest_pending: null,
    avg_score: 0
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
        .select('status, created_at, qualification_score');

      if (error) throw error;

      const counts: FunnelData = {
        pending_approval: 0,
        pending_contract: 0,
        contract_accepted: 0,
        active: 0,
        rejected: 0,
        inactive: 0,
        oldest_pending: null,
        avg_score: 0
      };

      let oldestPendingDate: Date | null = null;
      let totalScore = 0;
      let scoreCount = 0;

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

        // Calculate average score
        if (sp.qualification_score && sp.qualification_score > 0) {
          totalScore += sp.qualification_score;
          scoreCount++;
        }
      });

      if (oldestPendingDate) {
        counts.oldest_pending = oldestPendingDate.toISOString();
      }

      counts.avg_score = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

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
      <CardHeader className="p-4 md:p-6 pb-3 md:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-sm md:text-lg flex items-center gap-2">
            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            Funil de Recrutamento
          </CardTitle>
          <div className="flex flex-wrap items-center gap-1.5 md:gap-3">
            {data.rejected > 0 && (
              <Badge variant="outline" className="text-[10px] md:text-xs text-red-600 border-red-200 bg-red-50 dark:bg-red-950/30">
                <XCircle className="h-3 w-3 mr-1" />
                {data.rejected} rej.
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs md:text-base px-2 md:px-3 py-0.5 md:py-1">
              📊 {conversionRate}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-4 md:space-y-6">
        {/* Funnel Stages */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <div key={stage.id} className="relative">
                <div className={cn(
                  "p-3 md:p-4 rounded-xl border-2 transition-all hover:shadow-md",
                  stage.bgColor,
                  stage.borderColor
                )}>
                  {/* Stage Header */}
                  <div className="flex items-center justify-between mb-2 md:mb-3">
                    <div className={cn("p-1.5 md:p-2 rounded-lg", stage.color)}>
                      <Icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
                    </div>
                    {index < stages.length - 1 && (
                      <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-10" />
                    )}
                  </div>
                  
                  {/* Count */}
                  <p className={cn("text-2xl md:text-4xl font-bold mb-0.5 md:mb-1", stage.textColor)}>
                    {loading ? '-' : stage.count}
                  </p>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground mb-2 md:mb-3">
                    {stage.label}
                  </p>
                  
                  {/* Action Button */}
                  <Link to={stage.action.href}>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-[10px] md:text-xs h-7 md:h-8"
                      disabled={stage.count === 0}
                    >
                      <span className="truncate">{stage.action.label}</span>
                      <ExternalLink className="h-3 w-3 ml-1 shrink-0" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 pt-3 md:pt-4 border-t">
          <div className="flex items-center gap-2 p-2 md:p-3 rounded-lg bg-muted/50">
            <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-muted-foreground">Conversão</p>
              <p className="font-semibold text-sm md:text-base">{conversionRate}%</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 md:p-3 rounded-lg bg-muted/50">
            <Users className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-muted-foreground">Total</p>
              <p className="font-semibold text-sm md:text-base">{totalCandidates}</p>
            </div>
          </div>
          
          <div className={cn(
            "flex items-center gap-2 p-2 md:p-3 rounded-lg",
            oldestPendingDays > 7 ? "bg-red-500/10" : "bg-muted/50"
          )}>
            <Clock className={cn(
              "h-4 w-4 shrink-0",
              oldestPendingDays > 7 ? "text-red-500" : "text-muted-foreground"
            )} />
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">Pend. antigo</p>
              <p className={cn(
                "font-semibold text-sm md:text-base",
                oldestPendingDays > 7 && "text-red-600"
              )}>
                {data.oldest_pending ? `${oldestPendingDays}d` : '-'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 md:p-3 rounded-lg bg-muted/50">
            <Star className="h-4 w-4 text-yellow-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-muted-foreground">Score</p>
              <p className="font-semibold text-sm md:text-base">{data.avg_score > 0 ? `${data.avg_score}` : '-'}</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(data.pending_approval > 0 || oldestPendingDays > 7) && (
          <div className="space-y-2">
            {data.pending_approval > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 md:p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
                  <p className="text-xs md:text-sm text-yellow-700 dark:text-yellow-400">
                    <strong>{data.pending_approval}</strong> aguardando
                  </p>
                </div>
                <Link to="/dashboard/salespeople?status=pending_approval">
                  <Button variant="outline" size="sm" className="text-xs h-7 w-full sm:w-auto">
                    Analisar
                  </Button>
                </Link>
              </div>
            )}
            
            {oldestPendingDays > 7 && (
              <div className="flex items-center gap-2 p-2 md:p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                <p className="text-xs md:text-sm text-red-700 dark:text-red-400">
                  Candidato há <strong>{oldestPendingDays}d</strong> sem resposta!
                </p>
              </div>
            )}
            
            {data.pending_contract > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 md:p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                  <p className="text-xs md:text-sm text-blue-700 dark:text-blue-400">
                    <strong>{data.pending_contract}</strong> aguardando contrato
                  </p>
                </div>
                <Link to="/dashboard/salespeople?status=pending_contract">
                  <Button variant="outline" size="sm" className="text-xs h-7 w-full sm:w-auto">
                    Cobrar
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
