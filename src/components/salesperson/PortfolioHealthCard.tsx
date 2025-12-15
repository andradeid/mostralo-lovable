import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Calendar,
  Lightbulb,
  TrendingUp,
  Users,
  Clock
} from "lucide-react";

interface PortfolioHealthCardProps {
  salesperson: {
    id: string;
    commission_tier?: string;
    active_clients_count?: number;
    tier_warning_sent_at?: string | null;
    last_tier_evaluation_at?: string | null;
  };
}

interface ActivityRules {
  tier_full_commission: number;
  tier_reduced_commission: number;
  tier_minimum_commission: number;
  evaluation_period_days: number;
  grace_period_days: number;
}

const tierConfig = {
  full: {
    label: 'INTEGRAL',
    percentage: 100,
    color: 'bg-green-500',
    textColor: 'text-green-600',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    icon: CheckCircle2,
    message: 'Você está seguro nesta faixa!'
  },
  reduced: {
    label: 'REDUZIDA',
    percentage: 80,
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    icon: AlertTriangle,
    message: 'Conquiste mais clientes para comissão integral'
  },
  minimum: {
    label: 'MÍNIMA',
    percentage: 50,
    color: 'bg-orange-500',
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    icon: AlertTriangle,
    message: 'Atenção! Sua comissão está reduzida'
  },
  suspended: {
    label: 'SUSPENSA',
    percentage: 0,
    color: 'bg-red-500',
    textColor: 'text-red-600',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    icon: XCircle,
    message: 'Comissão suspensa! Feche vendas para reativar'
  }
};

const tips = [
  { icon: Users, text: 'Mantenha contato regular com seus clientes' },
  { icon: Calendar, text: 'Acompanhe datas de renovação das assinaturas' },
  { icon: TrendingUp, text: 'Entre em contato antes do vencimento' },
  { icon: Lightbulb, text: 'Ofereça suporte para aumentar retenção' }
];

export default function PortfolioHealthCard({ salesperson }: PortfolioHealthCardProps) {
  const [rules, setRules] = useState<ActivityRules | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const { data, error } = await supabase
        .from('salesperson_activity_rules')
        .select('*')
        .eq('is_active', true)
        .single();

      if (!error && data) {
        // Mapear campos do banco para interface local
        setRules({
          tier_full_commission: data.tier_full_commission,
          tier_reduced_commission: data.tier_reduced_commission,
          tier_minimum_commission: data.tier_minimum_commission,
          evaluation_period_days: parseInt(data.evaluation_period?.replace(' days', '') || '90'),
          grace_period_days: data.grace_period_days
        });
      } else {
        // Usar valores padrão
        setRules({
          tier_full_commission: 10,
          tier_reduced_commission: 5,
          tier_minimum_commission: 2,
          evaluation_period_days: 90,
          grace_period_days: 30
        });
      }
    } catch (error) {
      console.error('Erro ao carregar regras:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  const currentTier = (salesperson.commission_tier as keyof typeof tierConfig) || 'full';
  const config = tierConfig[currentTier] || tierConfig.full;
  const TierIcon = config.icon;
  const activeClients = salesperson.active_clients_count || 0;
  const targetClients = rules?.tier_full_commission || 10;
  const progressPercentage = Math.min((activeClients / targetClients) * 100, 100);

  // Calcular próxima avaliação
  const lastEvaluation = salesperson.last_tier_evaluation_at 
    ? new Date(salesperson.last_tier_evaluation_at) 
    : new Date();
  const nextEvaluation = new Date(lastEvaluation);
  nextEvaluation.setDate(nextEvaluation.getDate() + (rules?.evaluation_period_days || 90));

  // Verificar se está em período de graça
  const inGracePeriod = !!salesperson.tier_warning_sent_at;
  let graceDaysRemaining = 0;
  if (inGracePeriod && salesperson.tier_warning_sent_at) {
    const warningDate = new Date(salesperson.tier_warning_sent_at);
    const graceEndDate = new Date(warningDate);
    graceEndDate.setDate(graceEndDate.getDate() + (rules?.grace_period_days || 30));
    graceDaysRemaining = Math.max(0, Math.ceil((graceEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  }

  // Calcular quantos clientes faltam para próxima faixa
  const getClientsToNextTier = () => {
    if (!rules) return null;
    if (currentTier === 'suspended') {
      return { needed: rules.tier_minimum_commission - activeClients, nextTier: 'Mínima (50%)' };
    }
    if (currentTier === 'minimum') {
      return { needed: rules.tier_reduced_commission - activeClients, nextTier: 'Reduzida (80%)' };
    }
    if (currentTier === 'reduced') {
      return { needed: rules.tier_full_commission - activeClients, nextTier: 'Integral (100%)' };
    }
    return null;
  };

  const nextTierInfo = getClientsToNextTier();

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Target className={`h-5 w-5 ${config.textColor}`} />
          Saúde da Carteira
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Badge da faixa atual */}
        <div className="flex items-center justify-between">
          <Badge className={`${config.color} text-white px-3 py-1 text-sm font-semibold`}>
            <TierIcon className="h-4 w-4 mr-1" />
            {config.label} {config.percentage}%
          </Badge>
          <span className="text-sm text-muted-foreground">
            Comissão atual
          </span>
        </div>

        {/* Progresso de clientes */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Clientes ativos
            </span>
            <span className="font-medium">
              {activeClients} de {targetClients}
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-3"
          />
        </div>

        {/* Próxima avaliação */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Próxima avaliação: {nextEvaluation.toLocaleDateString('pt-BR')}</span>
        </div>

        {/* Alerta de período de graça */}
        {inGracePeriod && (
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>⚠️ Atenção!</strong> Você está em período de graça. 
              Restam <strong>{graceDaysRemaining} dias</strong> para recuperar clientes 
              e evitar rebaixamento de faixa.
            </AlertDescription>
          </Alert>
        )}

        {/* Mensagem da faixa */}
        <Alert className={`${config.bgColor} ${config.borderColor}`}>
          <TierIcon className={`h-4 w-4 ${config.textColor}`} />
          <AlertDescription className={config.textColor}>
            {config.message}
            {nextTierInfo && nextTierInfo.needed > 0 && (
              <span className="block mt-1">
                Faltam <strong>{nextTierInfo.needed}</strong> cliente(s) para {nextTierInfo.nextTier}
              </span>
            )}
          </AlertDescription>
        </Alert>

        {/* Dicas */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-1">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Dicas para manter sua carteira
          </h4>
          <ul className="space-y-1">
            {tips.map((tip, index) => (
              <li key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                <tip.icon className="h-3 w-3 shrink-0" />
                {tip.text}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
