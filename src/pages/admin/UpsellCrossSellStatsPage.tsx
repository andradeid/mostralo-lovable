import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, Eye, CheckCircle, XCircle, DollarSign, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface UpsellStat {
  id: string;
  shown_count: number;
  accepted_count: number;
  rejected_count: number;
  revenue_generated: number;
  product_upsell: {
    product: { name: string };
    upsell_product: { name: string };
  };
}

interface CrossSellStat {
  id: string;
  shown_count: number;
  accepted_count: number;
  rejected_count: number;
  revenue_generated: number;
  rule: {
    trigger_category: { name: string };
    suggest_category: { name: string };
  };
}

export default function UpsellCrossSellStatsPage() {
  const { storeId } = useStoreAccess();
  const [period, setPeriod] = useState('30');

  // Buscar estatísticas de Upsell
  const { data: upsellStats, isLoading: loadingUpsell } = useQuery({
    queryKey: ['upsell-stats', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      
      const { data, error } = await supabase
        .from('upsell_statistics')
        .select(`
          *,
          product_upsell:product_upsells (
            product:products!product_upsells_product_id_fkey (name),
            upsell_product:products!product_upsells_upsell_product_id_fkey (name)
          )
        `)
        .eq('store_id', storeId)
        .order('revenue_generated', { ascending: false });

      if (error) throw error;
      return (data || []) as UpsellStat[];
    },
    enabled: !!storeId
  });

  // Buscar estatísticas de Cross-sell
  const { data: crossSellStats, isLoading: loadingCrossSell } = useQuery({
    queryKey: ['crosssell-stats', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      
      const { data, error } = await supabase
        .from('crosssell_statistics')
        .select(`
          *,
          rule:category_crosssell_rules (
            trigger_category:categories!category_crosssell_rules_trigger_category_id_fkey (name),
            suggest_category:categories!category_crosssell_rules_suggest_category_id_fkey (name)
          )
        `)
        .eq('store_id', storeId)
        .order('revenue_generated', { ascending: false });

      if (error) throw error;
      return (data || []) as CrossSellStat[];
    },
    enabled: !!storeId
  });

  // Calcular totais
  const upsellTotals = {
    shown: upsellStats?.reduce((sum, s) => sum + s.shown_count, 0) || 0,
    accepted: upsellStats?.reduce((sum, s) => sum + s.accepted_count, 0) || 0,
    rejected: upsellStats?.reduce((sum, s) => sum + s.rejected_count, 0) || 0,
    revenue: upsellStats?.reduce((sum, s) => sum + s.revenue_generated, 0) || 0
  };

  const crossSellTotals = {
    shown: crossSellStats?.reduce((sum, s) => sum + s.shown_count, 0) || 0,
    accepted: crossSellStats?.reduce((sum, s) => sum + s.accepted_count, 0) || 0,
    rejected: crossSellStats?.reduce((sum, s) => sum + s.rejected_count, 0) || 0,
    revenue: crossSellStats?.reduce((sum, s) => sum + s.revenue_generated, 0) || 0
  };

  const totalRevenue = upsellTotals.revenue + crossSellTotals.revenue;
  const totalShown = upsellTotals.shown + crossSellTotals.shown;
  const totalAccepted = upsellTotals.accepted + crossSellTotals.accepted;
  const conversionRate = totalShown > 0 ? ((totalAccepted / totalShown) * 100).toFixed(1) : '0';

  const loading = loadingUpsell || loadingCrossSell;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Estatísticas de Vendas Sugeridas</h1>
          <p className="text-muted-foreground">
            Acompanhe a performance de upsell e cross-sell
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="all">Todo período</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Exibições</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShown.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Ofertas mostradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aceitos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAccepted.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Produtos adicionados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Aceitos / Exibidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Gerada</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Total em vendas extras
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Detalhes */}
      <Tabs defaultValue="upsell" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upsell">
            Upsell
            <Badge variant="secondary" className="ml-2">
              {formatCurrency(upsellTotals.revenue)}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="crosssell">
            Cross-sell
            <Badge variant="secondary" className="ml-2">
              {formatCurrency(crossSellTotals.revenue)}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upsell">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Upsell</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : upsellStats?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum dado de upsell ainda
                </div>
              ) : (
                <div className="space-y-4">
                  {upsellStats?.slice(0, 10).map((stat) => {
                    const rate = stat.shown_count > 0 
                      ? ((stat.accepted_count / stat.shown_count) * 100).toFixed(1)
                      : '0';

                    return (
                      <div 
                        key={stat.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <div className="font-medium">
                            {stat.product_upsell?.product?.name || 'Produto'} → {stat.product_upsell?.upsell_product?.name || 'Upsell'}
                          </div>
                          <div className="text-sm text-muted-foreground flex gap-4 mt-1">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" /> {stat.shown_count}
                            </span>
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" /> {stat.accepted_count}
                            </span>
                            <span className="flex items-center gap-1 text-red-500">
                              <XCircle className="h-3 w-3" /> {stat.rejected_count}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            {formatCurrency(stat.revenue_generated)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {rate}% conversão
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crosssell">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Regra de Cross-sell</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : crossSellStats?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum dado de cross-sell ainda
                </div>
              ) : (
                <div className="space-y-4">
                  {crossSellStats?.slice(0, 10).map((stat) => {
                    const rate = stat.shown_count > 0 
                      ? ((stat.accepted_count / stat.shown_count) * 100).toFixed(1)
                      : '0';

                    return (
                      <div 
                        key={stat.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <div className="font-medium">
                            {stat.rule?.trigger_category?.name || 'Categoria'} → {stat.rule?.suggest_category?.name || 'Sugestão'}
                          </div>
                          <div className="text-sm text-muted-foreground flex gap-4 mt-1">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" /> {stat.shown_count}
                            </span>
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" /> {stat.accepted_count}
                            </span>
                            <span className="flex items-center gap-1 text-red-500">
                              <XCircle className="h-3 w-3" /> {stat.rejected_count}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            {formatCurrency(stat.revenue_generated)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {rate}% conversão
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
