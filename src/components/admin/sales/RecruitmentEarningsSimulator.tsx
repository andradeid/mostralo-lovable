import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, Award, ArrowRight } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { BonusTier, calculateEarnings, formatCurrency } from '@/utils/recruitmentPromptGenerator';
import { cn } from '@/lib/utils';

type Plan = Database['public']['Tables']['plans']['Row'];

interface RecruitmentEarningsSimulatorProps {
  plans: Plan[];
  bonusTiers: BonusTier[];
}

export function RecruitmentEarningsSimulator({ plans, bonusTiers }: RecruitmentEarningsSimulatorProps) {
  const [salesPerMonth, setSalesPerMonth] = useState(10);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[Math.floor(plans.length / 2)]?.id || plans[0]?.id || '');
  const [affiliateType, setAffiliateType] = useState<'pf' | 'pj'>('pj');

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

  // Determinar tier alcançado (só PJ)
  const achievedTier = useMemo(() => {
    if (affiliateType === 'pf' || !bonusTiers.length) return null;
    const quarterlySales = salesPerMonth * 3;
    const sortedTiers = [...bonusTiers].sort((a, b) => b.min_sales - a.min_sales);
    return sortedTiers.find(tier => quarterlySales >= tier.min_sales);
  }, [salesPerMonth, affiliateType, bonusTiers]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Simulador de Ganhos para Candidatos
        </CardTitle>
        <CardDescription>
          Teste diferentes cenários para mostrar o potencial de ganhos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  "flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all",
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
                  "flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all",
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

        {/* Resultados */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            📊 Resultado da Simulação
            {achievedTier && (
              <Badge variant="default" className="ml-2">
                <Award className="h-3 w-3 mr-1" />
                {achievedTier.tier_name}
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

          {/* Comparação PF vs PJ */}
          {affiliateType === 'pj' && pfEarnings && earnings.pfDifference && earnings.pfDifference > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <TrendingUp className="h-5 w-5" />
                <span className="font-semibold">Vantagem PJ vs PF</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
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
            </div>
          )}

          {/* Aviso para PF */}
          {affiliateType === 'pf' && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-4">
              <p className="text-sm text-yellow-700">
                💡 <strong>Dica:</strong> Como PJ você ganharia{' '}
                <strong>{formatCurrency(calculateEarnings(salesPerMonth, planPrice, 'pj', bonusTiers).monthlyAverage)}/mês</strong>{' '}
                (+{formatCurrency(calculateEarnings(salesPerMonth, planPrice, 'pj', bonusTiers).monthlyAverage - earnings.monthlyCommission)} a mais!)
              </p>
            </div>
          )}
        </div>

        {/* Informações do plano */}
        {selectedPlan && (
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>
              Plano: {selectedPlan.name} ({formatCurrency(planPrice)}) • 
              Taxa: {affiliateType === 'pf' ? '7%' : '10%'} • 
              {salesPerMonth} vendas/mês = {salesPerMonth * 3} vendas/trimestre
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
