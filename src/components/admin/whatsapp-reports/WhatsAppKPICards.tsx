import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Bot, Clock, Zap, DollarSign, ShoppingCart } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface WhatsAppKPICardsProps {
  storeId: string | null;
  dateFrom: string;
  dateTo: string;
}

interface KPIData {
  totalConversations: number;
  totalMessages: number;
  botMessages: number;
  humanMessages: number;
  avgDurationMinutes: number;
  autonomyRate: number;
  whatsappRevenue: number;
  whatsappOrdersCount: number;
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
          date_from: `${dateFrom}T00:00:00`,
          date_to: `${dateTo}T23:59:59`,
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

  const kpis = [
    {
      title: 'Conversas',
      value: data?.totalConversations || 0,
      icon: MessageSquare,
      description: `${data?.totalMessages || 0} mensagens total`,
    },
    {
      title: 'Msgs da IA',
      value: data?.botMessages || 0,
      icon: Bot,
      description: `${data?.humanMessages || 0} do humano`,
    },
    {
      title: 'Tempo Médio',
      value: `${data?.avgDurationMinutes || 0}min`,
      icon: Clock,
      description: 'por atendimento',
    },
    {
      title: 'Autonomia IA',
      value: `${data?.autonomyRate || 0}%`,
      icon: Zap,
      description: 'sem intervenção humana',
    },
    {
      title: 'Faturamento WhatsApp',
      value: formatCurrency(data?.whatsappRevenue || 0),
      icon: DollarSign,
      description: `${data?.whatsappOrdersCount || 0} pedidos`,
    },
    {
      title: 'Pedidos WhatsApp',
      value: data?.whatsappOrdersCount || 0,
      icon: ShoppingCart,
      description: 'criados pelo chat',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground truncate">{kpi.title}</span>
            </div>
            <p className="text-lg font-bold text-foreground truncate">{kpi.value}</p>
            <p className="text-xs text-muted-foreground truncate">{kpi.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
