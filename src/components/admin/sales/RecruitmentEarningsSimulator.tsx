import { useState, useMemo, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calculator, TrendingUp, Award, ArrowRight, Target, Calendar, Rocket, Clock, Copy, User } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { BonusTier, calculateEarnings, formatCurrency } from '@/utils/recruitmentPromptGenerator';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

type Plan = Database['public']['Tables']['plans']['Row'];

interface RecruitmentEarningsSimulatorProps {
  plans: Plan[];
  bonusTiers: BonusTier[];
}

type DedicationProfile = 'casual' | 'dedicated' | 'fulltime';

const DEDICATION_PROFILES: Record<DedicationProfile, { 
  label: string; 
  emoji: string; 
  hoursPerWeek: number; 
  salesPerMonth: number;
  description: string;
}> = {
  casual: { 
    label: 'Casual', 
    emoji: '☕', 
    hoursPerWeek: 5, 
    salesPerMonth: 4,
    description: 'Algumas horas por semana'
  },
  dedicated: { 
    label: 'Dedicado', 
    emoji: '💼', 
    hoursPerWeek: 15, 
    salesPerMonth: 12,
    description: 'Meio período'
  },
  fulltime: { 
    label: 'Full-time', 
    emoji: '🚀', 
    hoursPerWeek: 30, 
    salesPerMonth: 25,
    description: 'Dedicação total'
  }
};

export function RecruitmentEarningsSimulator({ plans, bonusTiers }: RecruitmentEarningsSimulatorProps) {
  const [salesPerMonth, setSalesPerMonth] = useState(10);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[Math.floor(plans.length / 2)]?.id || plans[0]?.id || '');
  const [affiliateType, setAffiliateType] = useState<'pf' | 'pj'>('pj');
  const [dedicationProfile, setDedicationProfile] = useState<DedicationProfile>('dedicated');
  const [hoursPerWeek, setHoursPerWeek] = useState(15);

  // Sincronizar horas com perfil de dedicação
  const handleProfileChange = (profile: DedicationProfile) => {
    setDedicationProfile(profile);
    setHoursPerWeek(DEDICATION_PROFILES[profile].hoursPerWeek);
    setSalesPerMonth(DEDICATION_PROFILES[profile].salesPerMonth);
  };

  const selectedPlan = useMemo(() => 
    plans.find(p => p.id === selectedPlanId),
    [plans, selectedPlanId]
  );

  const planPrice = useMemo(() => {
    if (!selectedPlan) return 0;
    return selectedPlan.promotion_active && selectedPlan.discount_price 
      ? selectedPlan.discount_price 
      : selectedPlan.price;
  }, [selectedPlan]);

  const earnings = useMemo(() => 
    calculateEarnings(salesPerMonth, planPrice, affiliateType, bonusTiers),
    [salesPerMonth, planPrice, affiliateType, bonusTiers]
  );

  const pfEarnings = useMemo(() => 
    affiliateType === 'pj' 
      ? calculateEarnings(salesPerMonth, planPrice, 'pf', bonusTiers)
      : null,
    [salesPerMonth, planPrice, affiliateType, bonusTiers]
  );

  // Ganhos anuais e 5 anos
  const annualEarnings = useMemo(() => earnings.totalQuarterly * 4, [earnings]);
  const fiveYearEarnings = useMemo(() => annualEarnings * 5, [annualEarnings]);

  // Ganho por hora
  const earningsPerHour = useMemo(() => {
    const hoursPerMonth = hoursPerWeek * 4;
    if (hoursPerMonth === 0) return 0;
    return earnings.monthlyAverage / hoursPerMonth;
  }, [earnings.monthlyAverage, hoursPerWeek]);

  // Determinar tier alcançado e próximo (só PJ)
  const tierInfo = useMemo(() => {
    if (affiliateType === 'pf' || !bonusTiers.length) return null;
    const quarterlySales = salesPerMonth * 3;
    const sortedTiers = [...bonusTiers].sort((a, b) => a.min_sales - b.min_sales);
    
    let achievedTier = null;
    let nextTier = null;
    let salesForNextTier = 0;

    for (let i = 0; i < sortedTiers.length; i++) {
      if (quarterlySales >= sortedTiers[i].min_sales) {
        achievedTier = sortedTiers[i];
        nextTier = sortedTiers[i + 1] || null;
        if (nextTier) {
          salesForNextTier = nextTier.min_sales - quarterlySales;
        }
      }
    }

    // Se não atingiu nenhum tier, o próximo é o primeiro
    if (!achievedTier && sortedTiers.length > 0) {
      nextTier = sortedTiers[0];
      salesForNextTier = sortedTiers[0].min_sales - quarterlySales;
    }

    return { achievedTier, nextTier, salesForNextTier };
  }, [salesPerMonth, affiliateType, bonusTiers]);

  // Copiar resumo para área de transferência
  const handleCopySimulation = useCallback(() => {
    const profile = DEDICATION_PROFILES[dedicationProfile];
    const tierName = tierInfo?.achievedTier?.tier_name || 'Nenhum';
    
    const text = `📊 SIMULAÇÃO DE GANHOS - VENDEDOR ${affiliateType.toUpperCase()}

🎯 Perfil: ${profile.emoji} ${profile.label} (${hoursPerWeek}h/semana)
📈 Vendas: ${salesPerMonth}/mês (${salesPerMonth * 3}/trimestre)
💼 Plano: ${selectedPlan?.name} (${formatCurrency(planPrice)})

💰 GANHOS:
• Comissão Mensal: ${formatCurrency(earnings.monthlyCommission)}
• Comissão Trimestral: ${formatCurrency(earnings.quarterlyCommission)}
• Bônus Trimestral: ${earnings.quarterlyBonus > 0 ? formatCurrency(earnings.quarterlyBonus) : 'N/A (só PJ)'}
• Total Trimestre: ${formatCurrency(earnings.totalQuarterly)}

⏰ GANHO POR HORA: ${formatCurrency(earningsPerHour)}/hora

📅 PROJEÇÕES:
• Anual: ${formatCurrency(annualEarnings)}
• 5 Anos: ${formatCurrency(fiveYearEarnings)}

🏆 Tier: ${tierName}

---
Taxa: ${affiliateType === 'pf' ? '7%' : '10%'} | ${affiliateType === 'pf' ? 'Limite R$ 1.900/mês' : 'Ganhos ilimitados + bônus'}`;

    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copiado!",
        description: "Resumo da simulação copiado para a área de transferência.",
      });
    });
  }, [dedicationProfile, affiliateType, hoursPerWeek, salesPerMonth, selectedPlan, planPrice, earnings, earningsPerHour, annualEarnings, fiveYearEarnings, tierInfo]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Simulador de Ganhos para Candidatos
            </CardTitle>
            <CardDescription>
              Escolha um perfil de dedicação e veja projeções de ganhos
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopySimulation}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar Resumo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Perfis de Dedicação */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Perfil de Dedicação
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {(Object.keys(DEDICATION_PROFILES) as DedicationProfile[]).map((profile) => (
              <button
                key={profile}
                onClick={() => handleProfileChange(profile)}
                className={cn(
                  "p-3 rounded-lg border-2 text-center transition-all",
                  dedicationProfile === profile
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="text-2xl mb-1">{DEDICATION_PROFILES[profile].emoji}</div>
                <div className="font-medium text-sm">{DEDICATION_PROFILES[profile].label}</div>
                <div className="text-xs text-muted-foreground">{DEDICATION_PROFILES[profile].hoursPerWeek}h/semana</div>
                <div className="text-xs text-muted-foreground">~{DEDICATION_PROFILES[profile].salesPerMonth} vendas/mês</div>
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sales">Vendas por mês</Label>
            <Input
              id="sales"
              type="number"
              min={1}
              max={100}
              value={salesPerMonth}
              onChange={(e) => setSalesPerMonth(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Horas por semana
            </Label>
            <Input
              id="hours"
              type="number"
              min={1}
              max={60}
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          <div className="space-y-2">
            <Label>Plano médio</Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => {
                  const price = plan.promotion_active && plan.discount_price 
                    ? plan.discount_price 
                    : plan.price;
                  return (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - {formatCurrency(price)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo de afiliado</Label>
            <div className="flex gap-2">
              <button
                onClick={() => setAffiliateType('pf')}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all",
                  affiliateType === 'pf'
                    ? "border-green-500 bg-green-500/10 text-green-700"
                    : "border-border hover:border-green-500/50"
                )}
              >
                PF (CPF)
              </button>
              <button
                onClick={() => setAffiliateType('pj')}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all",
                  affiliateType === 'pj'
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                PJ (CNPJ)
              </button>
            </div>
          </div>
        </div>

        {/* Ganho por Hora - Destaque */}
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-full">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ganho por hora investida</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(earningsPerHour)}/hora</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{hoursPerWeek}h/semana × 4 = {hoursPerWeek * 4}h/mês</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(earnings.monthlyAverage)} ÷ {hoursPerWeek * 4}h</p>
            </div>
          </div>
        </div>

        {/* Resultados de curto prazo */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            📊 Resultado da Simulação
            {tierInfo?.achievedTier && (
              <Badge variant="default" className="ml-2">
                <Award className="h-3 w-3 mr-1" />
                {tierInfo.achievedTier.tier_name}
              </Badge>
            )}
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Comissão Mensal</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(earnings.monthlyCommission)}</p>
              {affiliateType === 'pf' && earnings.monthlyCommission >= 1900 && (
                <Badge variant="destructive" className="text-xs mt-1">Limite atingido</Badge>
              )}
            </div>

            <div className="text-center p-3 bg-background rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Comissão Trimestral</p>
              <p className="text-xl font-bold">{formatCurrency(earnings.quarterlyCommission)}</p>
            </div>

            <div className="text-center p-3 bg-background rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Bônus Trimestral</p>
              <p className={cn(
                "text-xl font-bold",
                earnings.quarterlyBonus > 0 ? "text-green-600" : "text-muted-foreground"
              )}>
                {earnings.quarterlyBonus > 0 ? formatCurrency(earnings.quarterlyBonus) : '❌ Sem bônus'}
              </p>
              {affiliateType === 'pf' && (
                <Badge variant="outline" className="text-xs mt-1">Só PJ</Badge>
              )}
            </div>

            <div className="text-center p-3 bg-primary/10 rounded-lg border-2 border-primary">
              <p className="text-xs text-muted-foreground mb-1">Total Trimestre</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(earnings.totalQuarterly)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                ≈ {formatCurrency(earnings.monthlyAverage)}/mês
              </p>
            </div>
          </div>
        </div>

        {/* Projeções de longo prazo */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Projeção de Longo Prazo
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-background rounded-lg border">
              <Calendar className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground mb-1">Ganho Anual</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(annualEarnings)}</p>
              <p className="text-xs text-muted-foreground mt-1">4 trimestres</p>
            </div>

            <div className="text-center p-4 bg-background rounded-lg border">
              <Target className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground mb-1">Projeção 5 Anos</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(fiveYearEarnings)}</p>
              <p className="text-xs text-muted-foreground mt-1">se manter ritmo</p>
            </div>

            <div className="text-center p-4 bg-background rounded-lg border">
              <TrendingUp className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground mb-1">Média Mensal (5 anos)</p>
              <p className="text-2xl font-bold">{formatCurrency(fiveYearEarnings / 60)}</p>
              <p className="text-xs text-muted-foreground mt-1">renda recorrente</p>
            </div>
          </div>
        </div>

        {/* Meta para próximo tier */}
        {affiliateType === 'pj' && tierInfo?.nextTier && tierInfo.salesForNextTier > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <Target className="h-5 w-5" />
              <span className="font-semibold">Meta para o próximo tier</span>
            </div>
            <p className="text-sm">
              Faltam <strong>{tierInfo.salesForNextTier} vendas</strong> no trimestre para atingir{' '}
              <Badge variant="outline" className="ml-1">
                {tierInfo.nextTier.tier_name} (+{formatCurrency(tierInfo.nextTier.bonus_amount)})
              </Badge>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Ou seja, mais ~{Math.ceil(tierInfo.salesForNextTier / 3)} vendas por mês
            </p>
          </div>
        )}

        {/* Comparação PF vs PJ */}
        {affiliateType === 'pj' && pfEarnings && earnings.pfDifference && earnings.pfDifference > 0 && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <TrendingUp className="h-5 w-5" />
              <span className="font-semibold">Vantagem PJ vs PF</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="text-muted-foreground">
                Como PF: {formatCurrency(pfEarnings.monthlyCommission)}/mês
              </div>
              <ArrowRight className="h-4 w-4" />
              <div className="text-green-700 font-medium">
                Como PJ: {formatCurrency(earnings.monthlyAverage)}/mês
              </div>
              <Badge variant="default" className="bg-green-600">
                +{formatCurrency(earnings.pfDifference)}/mês
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Em 1 ano, isso representa +{formatCurrency(earnings.pfDifference * 12)} a mais como PJ
            </p>
          </div>
        )}

        {/* Aviso para PF */}
        {affiliateType === 'pf' && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <p className="text-sm text-yellow-700">
              💡 <strong>Dica:</strong> Como PJ você ganharia{' '}
              <strong>{formatCurrency(calculateEarnings(salesPerMonth, planPrice, 'pj', bonusTiers).monthlyAverage)}/mês</strong>{' '}
              (+{formatCurrency(calculateEarnings(salesPerMonth, planPrice, 'pj', bonusTiers).monthlyAverage - earnings.monthlyCommission)} a mais!)
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Abrir MEI é grátis e leva 5 minutos. Desbloqueia ganhos ilimitados + bônus trimestrais.
            </p>
          </div>
        )}

        {/* Informações do plano */}
        {selectedPlan && (
          <div className="text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
            <span>
              Plano: {selectedPlan.name} ({formatCurrency(planPrice)}) • 
              Taxa: {affiliateType === 'pf' ? '7%' : '10%'} • 
              {salesPerMonth} vendas/mês = {salesPerMonth * 3} vendas/trimestre
            </span>
            <span className="text-muted-foreground/60">
              Perfil: {DEDICATION_PROFILES[dedicationProfile].label} ({hoursPerWeek}h/semana)
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}