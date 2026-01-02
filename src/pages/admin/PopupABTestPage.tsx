import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PopupKPICards } from '@/components/admin/popup-analytics/PopupKPICards';
import { VariationChart } from '@/components/admin/popup-analytics/VariationChart';
import { VariationTable } from '@/components/admin/popup-analytics/VariationTable';
import { UTMBreakdownTable } from '@/components/admin/popup-analytics/UTMBreakdownTable';
import { DeviceBreakdown } from '@/components/admin/popup-analytics/DeviceBreakdown';
import { POPUP_VARIATIONS } from '@/components/landing/diagnosticPopupVariations';

interface AnalyticsData {
  variation: string;
  action: string;
  utm_source: string | null;
  utm_campaign: string | null;
  device_type: string | null;
  created_at: string;
}

interface VariationStats {
  variation: string;
  views: number;
  clicks: number;
  closed: number;
  conversionRate: number;
}

const PopupABTestPage = () => {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7');

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      const { data: analytics, error } = await supabase
        .from('popup_analytics')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(analytics || []);
    } catch (error) {
      console.error('Erro ao buscar analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  // Calcular estatísticas por variação
  const variationStats: VariationStats[] = ['A', 'B', 'C', 'D'].map(v => {
    const variationData = data.filter(d => d.variation === v);
    const views = variationData.filter(d => d.action === 'shown').length;
    const clicks = variationData.filter(d => d.action === 'clicked_cta').length;
    const closed = variationData.filter(d => d.action === 'closed' || d.action === 'clicked_outside').length;
    
    return {
      variation: v,
      views,
      clicks,
      closed,
      conversionRate: views > 0 ? (clicks / views) * 100 : 0
    };
  });

  // KPIs gerais
  const totalViews = variationStats.reduce((acc, v) => acc + v.views, 0);
  const totalClicks = variationStats.reduce((acc, v) => acc + v.clicks, 0);
  const overallConversionRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
  
  const bestVariation = variationStats.reduce((best, current) => 
    current.conversionRate > best.conversionRate ? current : best
  , variationStats[0]);

  // UTM Source breakdown
  const utmSourceStats = Object.entries(
    data
      .filter(d => d.action === 'shown' || d.action === 'clicked_cta')
      .reduce((acc, item) => {
        const source = item.utm_source || '(direto)';
        if (!acc[source]) acc[source] = { views: 0, clicks: 0 };
        if (item.action === 'shown') acc[source].views++;
        if (item.action === 'clicked_cta') acc[source].clicks++;
        return acc;
      }, {} as Record<string, { views: number; clicks: number }>)
  ).map(([source, stats]) => ({
    source,
    ...stats,
    conversionRate: stats.views > 0 ? (stats.clicks / stats.views) * 100 : 0
  })).sort((a, b) => b.views - a.views);

  // UTM Campaign breakdown
  const utmCampaignStats = Object.entries(
    data
      .filter(d => d.utm_campaign && (d.action === 'shown' || d.action === 'clicked_cta'))
      .reduce((acc, item) => {
        const campaign = item.utm_campaign!;
        if (!acc[campaign]) acc[campaign] = { views: 0, clicks: 0 };
        if (item.action === 'shown') acc[campaign].views++;
        if (item.action === 'clicked_cta') acc[campaign].clicks++;
        return acc;
      }, {} as Record<string, { views: number; clicks: number }>)
  ).map(([source, stats]) => ({
    source,
    ...stats,
    conversionRate: stats.views > 0 ? (stats.clicks / stats.views) * 100 : 0
  })).sort((a, b) => b.views - a.views);

  // Device breakdown
  const deviceStats = Object.entries(
    data
      .filter(d => d.device_type && (d.action === 'shown' || d.action === 'clicked_cta'))
      .reduce((acc, item) => {
        const device = item.device_type!;
        if (!acc[device]) acc[device] = { views: 0, clicks: 0 };
        if (item.action === 'shown') acc[device].views++;
        if (item.action === 'clicked_cta') acc[device].clicks++;
        return acc;
      }, {} as Record<string, { views: number; clicks: number }>)
  ).map(([device, stats]) => ({
    device,
    ...stats,
    conversionRate: stats.views > 0 ? (stats.clicks / stats.views) * 100 : 0
  })).sort((a, b) => b.conversionRate - a.conversionRate);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Teste A/B - Popup Diagnóstico</h1>
          <p className="text-muted-foreground">Análise de conversão das variações do popup</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <PopupKPICards
        totalViews={totalViews}
        totalClicks={totalClicks}
        conversionRate={overallConversionRate}
        bestVariation={totalViews > 0 ? bestVariation.variation : null}
        bestVariationRate={bestVariation.conversionRate}
      />

      {/* Gráfico e Tabela de Variações */}
      <div className="grid lg:grid-cols-2 gap-6">
        <VariationChart 
          data={variationStats} 
          bestVariation={totalViews > 0 ? bestVariation.variation : null} 
        />
        <VariationTable 
          data={variationStats} 
          bestVariation={totalViews > 0 ? bestVariation.variation : null} 
        />
      </div>

      {/* Variações de texto */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Textos das Variações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {(['A', 'B', 'C', 'D'] as const).map((v) => (
              <div key={v} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-primary">Variação {v}</span>
                  {v === bestVariation.variation && totalViews > 0 && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Melhor</span>
                  )}
                </div>
                <p className="font-medium text-sm">{POPUP_VARIATIONS[v].title}</p>
                <p className="text-sm text-muted-foreground mt-1">{POPUP_VARIATIONS[v].subtitle}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* UTM e Device Breakdown */}
      <div className="grid lg:grid-cols-3 gap-6">
        <UTMBreakdownTable 
          data={utmSourceStats} 
          title="Por Fonte (utm_source)"
          emptyMessage="Nenhum dado de UTM source ainda"
        />
        <UTMBreakdownTable 
          data={utmCampaignStats} 
          title="Por Campanha (utm_campaign)"
          emptyMessage="Nenhum dado de campanha ainda"
        />
        <DeviceBreakdown data={deviceStats} />
      </div>
    </div>
  );
};

export default PopupABTestPage;
