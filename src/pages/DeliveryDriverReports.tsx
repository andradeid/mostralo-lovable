import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Package, CheckCircle2, Clock, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calculateDriverEarnings, formatCurrency, type EarningsConfig } from '@/utils/driverEarnings';
import { formatOrderNumber, truncateAddress, getFirstName } from '@/utils/addressFormatter';
import { useIsMobile } from '@/hooks/use-mobile';
import { DeliveryReportCard } from '@/components/delivery/DeliveryReportCard';

interface DeliveryStats {
  total: number;
  completed: number;
  cancelled: number;
  avgTime: number;
  totalEarned: number;
}

interface Delivery {
  id: string;
  created_at: string;
  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  status: string;
  store_id: string;
  orders: {
    order_number: string;
    customer_name: string;
    customer_address: string;
    total: number;
    delivery_fee: number;
  };
}

export default function DeliveryDriverReports() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DeliveryStats>({
    total: 0,
    completed: 0,
    cancelled: 0,
    avgTime: 0,
    totalEarned: 0
  });
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [earningsByAssignment, setEarningsByAssignment] = useState<Map<string, number>>(new Map());
  const [configsByStore, setConfigsByStore] = useState<Map<string, EarningsConfig>>(new Map());
  const isMobile = useIsMobile();

  useEffect(() => {
    if (profile) {
      fetchReports();
    }
  }, [profile, period]);

  const getDateRange = () => {
    const end = endOfDay(new Date());
    let start = startOfDay(new Date());

    if (period === 'week') {
      start = startOfDay(subDays(new Date(), 7));
    } else if (period === 'month') {
      start = startOfDay(subDays(new Date(), 30));
    }

    return { start, end };
  };

  const fetchReports = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      const { start, end } = getDateRange();

      // Buscar entregas do período - usar delivered_at para pedidos finalizados
      const { data: deliveriesData, error: deliveriesError } = await supabase
        .from('delivery_assignments')
        .select(`
          *,
          orders (
            order_number,
            customer_name,
            customer_address,
            total,
            delivery_fee,
            store_id
          )
        `)
        .eq('delivery_driver_id', profile.id)
        .gte('delivered_at', start.toISOString())
        .lte('delivered_at', end.toISOString())
        .eq('status', 'delivered')
        .order('delivered_at', { ascending: false });

      if (deliveriesError) throw deliveriesError;

      const deliveriesList = deliveriesData || [];
      setDeliveries(deliveriesList as any);

      // Buscar ganhos registrados do período
      const { data: earningsData, error: earningsError } = await supabase
        .from('driver_earnings')
        .select('delivery_assignment_id, order_id, earnings_amount, delivered_at')
        .eq('driver_id', profile.id)
        .gte('delivered_at', start.toISOString())
        .lte('delivered_at', end.toISOString());

      if (earningsError) {
        console.warn('Erro ao buscar ganhos:', earningsError);
      }

      // Criar mapa de ganhos por delivery_assignment_id
      const earningsMap = new Map<string, number>();
      (earningsData || []).forEach(e => {
        if (e.delivery_assignment_id) {
          earningsMap.set(e.delivery_assignment_id, Number(e.earnings_amount) || 0);
        }
      });
      setEarningsByAssignment(earningsMap);

      // Buscar configurações ativas do entregador para fallback
      const { data: configsData, error: configsError } = await supabase
        .from('driver_earnings_config')
        .select('store_id, payment_type, fixed_amount, commission_percentage')
        .eq('driver_id', profile.id)
        .eq('is_active', true);

      if (configsError) {
        console.warn('Erro ao buscar configurações:', configsError);
      }

      // Criar mapa de configs por store_id
      const configsMap = new Map<string, EarningsConfig>();
      (configsData || []).forEach(c => {
        configsMap.set(c.store_id, {
          payment_type: c.payment_type,
          fixed_amount: c.fixed_amount,
          commission_percentage: c.commission_percentage
        });
      });
      setConfigsByStore(configsMap);

      // Calcular estatísticas
      const completed = deliveriesList.filter(d => d.status === 'delivered');
      const cancelled = deliveriesList.filter(d => d.status === 'cancelled');
      
      // Calcular tempo médio de entrega (em minutos)
      const timesInMinutes = completed
        .filter(d => d.accepted_at && d.delivered_at)
        .map(d => {
          const start = new Date(d.accepted_at!).getTime();
          const end = new Date(d.delivered_at!).getTime();
          return (end - start) / (1000 * 60); // converter para minutos
        });

      const avgTime = timesInMinutes.length > 0
        ? timesInMinutes.reduce((a, b) => a + b, 0) / timesInMinutes.length
        : 0;

      // Calcular total ganho usando driver_earnings ou fallback
      const totalEarned = completed.reduce((sum, d) => {
        // Tentar buscar no mapa de ganhos registrados
        let earnings = earningsMap.get(d.id);
        
        // Se não encontrar, calcular com fallback
        if (earnings === undefined) {
          const deliveryFee = Number((d.orders as any)?.delivery_fee || 0);
          const storeId = (d.orders as any)?.store_id;
          const config = storeId ? configsMap.get(storeId) : undefined;
          earnings = calculateDriverEarnings(deliveryFee, config);
        }
        
        return sum + earnings;
      }, 0);

      setStats({
        total: deliveriesList.length,
        completed: completed.length,
        cancelled: cancelled.length,
        avgTime: Math.round(avgTime),
        totalEarned
      });
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      delivered: { label: 'Entregue', variant: 'default' },
      cancelled: { label: 'Cancelado', variant: 'destructive' },
      picked_up: { label: 'Coletado', variant: 'secondary' },
      accepted: { label: 'Aceito', variant: 'secondary' },
      assigned: { label: 'Atribuído', variant: 'secondary' }
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 max-w-7xl">
      {/* Header com filtros */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">Relatório de Entregas</h1>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant={period === 'today' ? 'default' : 'outline'}
            onClick={() => setPeriod('today')}
            size="sm"
          >
            Hoje
          </Button>
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            onClick={() => setPeriod('week')}
            size="sm"
          >
            Últimos 7 dias
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            onClick={() => setPeriod('month')}
            size="sm"
          >
            Últimos 30 dias
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6 mb-6 md:mb-8">
        <Card>
          <CardHeader className="pb-2 px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="w-4 h-4 md:w-5 md:h-5" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            <div className="text-xl md:text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
              Concluídas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            <div className="text-xl md:text-3xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 md:w-5 md:h-5" />
              Taxa
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            <div className="text-xl md:text-3xl font-bold">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 md:w-5 md:h-5" />
              Tempo Médio
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            <div className="text-xl md:text-3xl font-bold">{stats.avgTime}min</div>
          </CardContent>
        </Card>

        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="pb-2 px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
              Total Ganho
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            <div className="text-lg md:text-2xl lg:text-3xl font-bold">{formatCurrency(stats.totalEarned)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Entregas */}
        <Card>
          <CardHeader className="px-4 md:px-6 py-4 md:py-6">
            <CardTitle className="text-lg md:text-xl">Histórico de Entregas</CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            {deliveries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma entrega encontrada no período selecionado
              </div>
            ) : (
              <>
                {/* MOBILE: Cards */}
                {isMobile ? (
                  <div className="space-y-2">
                    {deliveries.map((delivery) => {
                      let earnings = earningsByAssignment.get(delivery.id);
                      
                      if (earnings === undefined) {
                        const deliveryFee = Number((delivery.orders as any)?.delivery_fee || 0);
                        const storeId = (delivery.orders as any)?.store_id;
                        const config = storeId ? configsByStore.get(storeId) : undefined;
                        earnings = calculateDriverEarnings(deliveryFee, config);
                      }

                      return (
                        <DeliveryReportCard
                          key={delivery.id}
                          delivery={delivery}
                          earnings={earnings}
                        />
                      );
                    })}
                  </div>
                ) : (
                  /* DESKTOP: Tabela otimizada */
                  <div className="overflow-x-auto -mx-4 md:-mx-6">
                    <div className="min-w-[800px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b-2">
                            <TableHead className="text-sm md:text-base font-semibold py-4 px-4">Data/Hora</TableHead>
                            <TableHead className="text-sm md:text-base font-semibold py-4 px-4">Pedido</TableHead>
                            <TableHead className="text-sm md:text-base font-semibold py-4 px-4">Cliente</TableHead>
                            <TableHead className="text-sm md:text-base font-semibold py-4 px-4">Endereço</TableHead>
                            <TableHead className="text-sm md:text-base font-semibold py-4 px-4 text-right">Ganhos</TableHead>
                          </TableRow>
                        </TableHeader>
                      <TableBody>
                        {deliveries.map((delivery) => {
                          let earnings = earningsByAssignment.get(delivery.id);
                          
                          if (earnings === undefined) {
                            const deliveryFee = Number((delivery.orders as any)?.delivery_fee || 0);
                            const storeId = (delivery.orders as any)?.store_id;
                            const config = storeId ? configsByStore.get(storeId) : undefined;
                            earnings = calculateDriverEarnings(deliveryFee, config);
                          }

                          return (
                            <TableRow key={delivery.id} className="hover:bg-muted/50 transition-colors">
                              <TableCell className="py-4 px-4">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-medium text-sm md:text-base">
                                    {format(new Date(delivery.delivered_at || delivery.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                                  </span>
                                  <span className="text-xs md:text-sm text-muted-foreground">
                                    {format(new Date(delivery.delivered_at || delivery.created_at), 'HH:mm', { locale: ptBR })}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="font-bold text-sm md:text-base py-4 px-4">
                                {formatOrderNumber((delivery.orders as any)?.order_number || '')}
                              </TableCell>
                              <TableCell className="py-4 px-4">
                                <span className="font-medium text-sm md:text-base">
                                  {getFirstName((delivery.orders as any)?.customer_name || '')}
                                </span>
                              </TableCell>
                              <TableCell className="py-4 px-4 max-w-md">
                                <span className="text-muted-foreground text-sm md:text-base block truncate">
                                  {truncateAddress((delivery.orders as any)?.customer_address || '', 60)}
                                </span>
                              </TableCell>
                              <TableCell className="py-4 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                                  <span className="font-bold text-base md:text-lg text-green-600">
                                    {formatCurrency(earnings)}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
