import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Bot, Clock, Zap, DollarSign, ShoppingCart, Loader2, Smartphone, Monitor, CreditCard, BarChart3 } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

interface WhatsAppKPICardsProps {
  storeId: string | null;
  dateFrom: string;
  dateTo: string;
}

export interface KPIData {
  totalConversations: number;
  totalMessages: number;
  botMessages: number;
  humanMessages: number;
  avgDurationMinutes: number;
  autonomyRate: number;
  whatsappRevenue: number;
  whatsappOrdersCount: number;
  cellphoneMessages: number;
  systemMessages: number;
  panelAdoptionRate: number;
  pixPaymentsCount: number;
  pixTotalAmount: number;
  pixAvgAmount: number;
}

export function WhatsAppKPICards({ storeId, dateFrom, dateTo }: WhatsAppKPICardsProps) {
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    fetchKPIs();
  }, [storeId, dateFrom, dateTo]);

  const fetchKPIs = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('whatsapp-reports-kpis', {
        body: {
          store_id: storeId,
          date_from: `${dateFrom}T00:00:00-03:00`,
          date_to: `${dateTo}T23:59:59-03:00`,
        },
      });
      if (error) throw error;
      setData(result);
    } catch (err) {
      console.error('Erro ao buscar KPIs:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const mainKpis = [
    {
      title: 'Conversas',
      value: data?.totalConversations || 0,
      icon: MessageSquare,
      description: `${data?.totalMessages || 0} mensagens total`,
      tooltip: 'Total de conversas iniciadas no WhatsApp no período selecionado.',
    },
    {
      title: 'Msgs da IA',
      value: data?.botMessages || 0,
      icon: Bot,
      description: `${data?.humanMessages || 0} do humano`,
      tooltip: 'Mensagens enviadas automaticamente pela IA. Abaixo, mensagens de atendentes humanos.',
    },
    {
      title: 'Tempo Médio',
      value: `${data?.avgDurationMinutes || 0}min`,
      icon: Clock,
      description: 'por atendimento',
      tooltip: 'Duração média de cada atendimento. Quanto menor, mais eficiente.',
    },
    {
      title: 'Autonomia IA',
      value: `${data?.autonomyRate || 0}%`,
      icon: Zap,
      description: 'sem intervenção humana',
      tooltip: 'Percentual de conversas resolvidas só pela IA. Meta ideal: acima de 80%.',
      highlight: (data?.autonomyRate || 0) >= 80,
    },
    {
      title: 'Faturamento WhatsApp',
      value: formatCurrency(data?.whatsappRevenue || 0),
      icon: DollarSign,
      description: `${data?.whatsappOrdersCount || 0} pedidos`,
      tooltip: 'Receita gerada por pedidos criados pelo chat do WhatsApp.',
    },
    {
      title: 'Pedidos WhatsApp',
      value: data?.whatsappOrdersCount || 0,
      icon: ShoppingCart,
      description: 'criados pelo chat',
      tooltip: 'Pedidos criados através do carrinho no chat do WhatsApp.',
    },
  ];

  const sourceKpis = [
    {
      title: 'Msgs Celular',
      value: data?.cellphoneMessages || 0,
      icon: Smartphone,
      description: 'enviadas pelo aparelho',
      tooltip: 'Mensagens enviadas pelo celular ou WhatsApp Web, fora do painel. Essas mensagens não são rastreáveis pela equipe.',
    },
    {
      title: 'Msgs Painel',
      value: data?.systemMessages || 0,
      icon: Monitor,
      description: 'enviadas pelo dashboard',
      tooltip: 'Mensagens enviadas manualmente por atendentes via dashboard (não inclui IA).',
    },
    {
      title: 'Cobranças PIX',
      value: data?.pixPaymentsCount || 0,
      icon: CreditCard,
      description: formatCurrency(data?.pixTotalAmount || 0),
      tooltip: 'Total de solicitações de pagamento PIX enviadas pelo chat. Abaixo, o valor total cobrado.',
    },
    {
      title: 'Adoção Painel',
      value: `${data?.panelAdoptionRate || 0}%`,
      icon: BarChart3,
      description: 'msgs via painel + IA',
      tooltip: 'Percentual de mensagens enviadas pelo painel ou IA vs celular. Meta: quanto maior, melhor rastreabilidade.',
      highlight: (data?.panelAdoptionRate || 0) >= 80,
    },
  ];

  return (
    <div className="space-y-3">
      {/* KPIs principais */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {mainKpis.map((kpi) => (
          <Card key={kpi.title} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center">
                  <kpi.icon className="h-4 w-4 text-primary" />
                </div>
                <InfoTooltip text={kpi.tooltip} />
              </div>
              <p className={`text-2xl md:text-3xl font-bold text-foreground truncate ${kpi.highlight ? 'text-primary' : ''}`}>
                {kpi.value}
              </p>
              <p className="text-[11px] font-medium text-muted-foreground mt-1 truncate">{kpi.title}</p>
              <p className="text-[10px] text-muted-foreground/70 truncate">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* KPIs de origem e cobranças */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sourceKpis.map((kpi) => (
          <Card key={kpi.title} className="relative overflow-hidden border-dashed">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center">
                  <kpi.icon className="h-4 w-4 text-primary" />
                </div>
                <InfoTooltip text={kpi.tooltip} />
              </div>
              <p className={`text-2xl md:text-3xl font-bold text-foreground truncate ${kpi.highlight ? 'text-primary' : ''}`}>
                {kpi.value}
              </p>
              <p className="text-[11px] font-medium text-muted-foreground mt-1 truncate">{kpi.title}</p>
              <p className="text-[10px] text-muted-foreground/70 truncate">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
