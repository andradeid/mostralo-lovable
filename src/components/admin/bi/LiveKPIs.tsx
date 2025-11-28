import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, DollarSign, TrendingUp, Users, Target, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface KPIData {
  activeStores: number;
  currentMRR: number;
  projectedARR: number;
  avgTicket: number;
  churnRate: number;
  activeSalespeople: number;
  pendingSalespeople: number;
  totalSalespeople: number;
  conversionRate: number;
}

export function LiveKPIs() {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      // Lojas ativas
      const { count: activeStores } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // MRR atual (soma dos planos das lojas ativas)
      const { data: storesWithPlans } = await supabase
        .from('stores')
        .select('plan_id, plans:plan_id(price)')
        .eq('status', 'active');

      const currentMRR = storesWithPlans?.reduce((sum, store: any) => {
        return sum + (store.plans?.price || 0);
      }, 0) || 0;

      const projectedARR = currentMRR * 12;
      const avgTicket = activeStores ? currentMRR / activeStores : 0;

      // Vendedores
      const { data: salespeople } = await supabase
        .from('salespeople')
        .select('status');

      const activeSalespeople = salespeople?.filter(s => s.status === 'active').length || 0;
      const pendingSalespeople = salespeople?.filter(s => s.status === 'pending_approval' || s.status === 'pending_contract').length || 0;
      const totalSalespeople = salespeople?.length || 0;

      // Conversão de leads (aprovados vs total cadastrados)
      const { count: totalApprovals } = await supabase
        .from('payment_approvals')
        .select('*', { count: 'exact', head: true });

      const { count: approvedApprovals } = await supabase
        .from('payment_approvals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      const conversionRate = totalApprovals ? ((approvedApprovals || 0) / totalApprovals) * 100 : 0;

      // Churn rate (lojas inativas vs total)
      const { count: totalStores } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true });

      const churnRate = totalStores ? (((totalStores - (activeStores || 0)) / totalStores) * 100) : 0;

      setKpis({
        activeStores: activeStores || 0,
        currentMRR,
        projectedARR,
        avgTicket,
        churnRate,
        activeSalespeople,
        pendingSalespeople,
        totalSalespeople,
        conversionRate
      });
    } catch (error) {
      console.error('Erro ao buscar KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-32 mb-2" />
              <div className="h-3 bg-muted rounded w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!kpis) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lojas Ativas</CardTitle>
          <Store className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.activeStores}</div>
          <p className="text-xs text-muted-foreground">
            Churn: {kpis.churnRate.toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">MRR Atual</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {kpis.currentMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">
            Receita Mensal Recorrente
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ARR Projetado</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {kpis.projectedARR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">
            Receita Anual Recorrente
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {kpis.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">
            Por loja/mês
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendedores Ativos</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.activeSalespeople}</div>
          <p className="text-xs text-muted-foreground">
            {kpis.pendingSalespeople} pendentes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Vendedores</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.totalSalespeople}</div>
          <p className="text-xs text-muted-foreground">
            Cadastrados no sistema
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversão de Leads</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.conversionRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            Aprovados vs Total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valuation (5x ARR)</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {(kpis.projectedARR * 5).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">
            Avaliação estimada
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
