import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { supabase } from '@/integrations/supabase/client';
import { usePageSEO } from '@/hooks/useSEO';
import {
  ShoppingCart,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  UtensilsCrossed,
  Timer,
  Package,
  ArrowRight,
  Activity,
  Loader2
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { format, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DailyStats {
  totalOrders: number;
  pendingOrders: number;
  preparingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageTicket: number;
  totalCustomers: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
  order_type: string;
}

interface HourlyData {
  hour: string;
  pedidos: number;
  receita: number;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  'novo': { label: 'Novo', variant: 'destructive' },
  'confirmado': { label: 'Confirmado', variant: 'default' },
  'preparando': { label: 'Preparando', variant: 'secondary' },
  'pronto': { label: 'Pronto', variant: 'outline' },
  'saiu_entrega': { label: 'Em entrega', variant: 'secondary' },
  'entregue': { label: 'Entregue', variant: 'default' },
  'cancelado': { label: 'Cancelado', variant: 'destructive' },
};

export default function AttendantDashboardPage() {
  usePageSEO({ title: 'Painel do Atendente' });
  const { profile } = useAuth();
  const { storeId } = useStoreAccess();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DailyStats>({
    totalOrders: 0, pendingOrders: 0, preparingOrders: 0,
    completedOrders: 0, cancelledOrders: 0, totalRevenue: 0,
    averageTicket: 0, totalCustomers: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [kitchenPending, setKitchenPending] = useState(0);

  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    if (!storeId) return;
    fetchDashboardData();

    // Real-time subscription para pedidos
    const channel = supabase
      .channel('attendant-dashboard-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `store_id=eq.${storeId}`,
      }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [storeId]);

  async function fetchDashboardData() {
    if (!storeId) return;
    setLoading(true);

    const todayStart = startOfDay(today).toISOString();
    const todayEnd = endOfDay(today).toISOString();

    try {
      // Buscar pedidos do dia
      const { data: orders } = await supabase
        .from('orders')
        .select('id, order_number, total, status, created_at, order_type, customer_id')
        .eq('store_id', storeId)
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)
        .order('created_at', { ascending: false });

      if (orders) {
        const pending = orders.filter(o => ['novo'].includes(o.status)).length;
        const preparing = orders.filter(o => ['confirmado', 'preparando'].includes(o.status)).length;
        const completed = orders.filter(o => ['entregue', 'pronto', 'retirado'].includes(o.status)).length;
        const cancelled = orders.filter(o => o.status === 'cancelado').length;
        const validOrders = orders.filter(o => o.status !== 'cancelado');
        const revenue = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const uniqueCustomers = new Set(orders.map(o => o.customer_id).filter(Boolean)).size;

        setStats({
          totalOrders: orders.length,
          pendingOrders: pending,
          preparingOrders: preparing,
          completedOrders: completed,
          cancelledOrders: cancelled,
          totalRevenue: revenue,
          averageTicket: validOrders.length > 0 ? revenue / validOrders.length : 0,
          totalCustomers: uniqueCustomers,
        });

        // Dados por hora
        const hourMap: Record<string, { pedidos: number; receita: number }> = {};
        for (let h = 0; h <= 23; h++) {
          const key = `${String(h).padStart(2, '0')}h`;
          hourMap[key] = { pedidos: 0, receita: 0 };
        }
        orders.forEach(o => {
          const hour = new Date(o.created_at).getHours();
          const key = `${String(hour).padStart(2, '0')}h`;
          if (hourMap[key]) {
            hourMap[key].pedidos += 1;
            if (o.status !== 'cancelado') hourMap[key].receita += o.total || 0;
          }
        });
        setHourlyData(Object.entries(hourMap).map(([hour, data]) => ({ hour, ...data })));
      }

      // Buscar pedidos recentes com nome do cliente
      const { data: recent } = await supabase
        .from('orders')
        .select('id, order_number, total, status, created_at, order_type, customers(name)')
        .eq('store_id', storeId)
        .gte('created_at', todayStart)
        .order('created_at', { ascending: false })
        .limit(8);

      if (recent) {
        setRecentOrders(recent.map((r: any) => ({
          id: r.id,
          order_number: r.order_number,
          customer_name: r.customers?.name || 'Cliente',
          total: r.total,
          status: r.status,
          created_at: r.created_at,
          order_type: r.order_type,
        })));
      }

      // Itens pendentes na cozinha
      const { count } = await supabase
        .from('comanda_items')
        .select('id', { count: 'exact', head: true })
        .in('preparation_status', ['pending', 'preparing'])
        .eq('comanda_id', storeId); // This needs join - simplified

      // Buscar via comandas da loja
      const { data: comandas } = await supabase
        .from('comandas')
        .select('id')
        .eq('store_id', storeId)
        .eq('status', 'open');

      if (comandas && comandas.length > 0) {
        const comandaIds = comandas.map(c => c.id);
        const { count: kitchenCount } = await supabase
          .from('comanda_items')
          .select('id', { count: 'exact', head: true })
          .in('comanda_id', comandaIds)
          .in('preparation_status', ['pending', 'preparing']);
        setKitchenPending(kitchenCount || 0);
      }

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const firstName = profile?.full_name?.split(' ')[0] || 'Atendente';

  if (loading && stats.totalOrders === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting}, {firstName}! 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(today, "EEEE, dd 'de' MMMM", { locale: ptBR })} — Resumo do seu dia
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 text-sm font-medium">
            <Activity className="h-3.5 w-3.5" />
            Tempo real
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <KPICard
          icon={ShoppingCart}
          label="Pedidos Hoje"
          value={stats.totalOrders}
          iconColor="text-blue-500"
          iconBg="bg-blue-500/10"
        />
        <KPICard
          icon={AlertCircle}
          label="Pendentes"
          value={stats.pendingOrders}
          iconColor="text-red-500"
          iconBg="bg-red-500/10"
          highlight={stats.pendingOrders > 0}
        />
        <KPICard
          icon={DollarSign}
          label="Receita Hoje"
          value={`R$ ${stats.totalRevenue.toFixed(2)}`}
          iconColor="text-green-500"
          iconBg="bg-green-500/10"
        />
        <KPICard
          icon={TrendingUp}
          label="Ticket Médio"
          value={`R$ ${stats.averageTicket.toFixed(2)}`}
          iconColor="text-purple-500"
          iconBg="bg-purple-500/10"
        />
      </div>

      {/* Status Pipeline + Atalhos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pipeline de Status */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Status dos Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatusPill
                icon={AlertCircle}
                label="Novos"
                count={stats.pendingOrders}
                color="text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900"
              />
              <StatusPill
                icon={Timer}
                label="Preparando"
                count={stats.preparingOrders}
                color="text-orange-600 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900"
              />
              <StatusPill
                icon={CheckCircle2}
                label="Concluídos"
                count={stats.completedOrders}
                color="text-green-600 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900"
              />
              <StatusPill
                icon={UtensilsCrossed}
                label="Cozinha"
                count={kitchenPending}
                color="text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900"
              />
            </div>
          </CardContent>
        </Card>

        {/* Atalhos Rápidos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickAction to="/dashboard/orders" icon={ShoppingCart} label="Ver Pedidos" count={stats.pendingOrders} />
            <QuickAction to="/dashboard/cozinha" icon={UtensilsCrossed} label="Painel Cozinha" count={kitchenPending} />
            <QuickAction to="/dashboard/pdv" icon={Package} label="Abrir PDV" />
            <QuickAction to="/dashboard/customers" icon={Users} label="Clientes" count={stats.totalCustomers} />
          </CardContent>
        </Card>
      </div>

      {/* Gráfico + Pedidos Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfico por hora */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Pedidos por Hora</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="colorPedidos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'receita' ? `R$ ${value.toFixed(2)}` : value,
                      name === 'receita' ? 'Receita' : 'Pedidos'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="pedidos"
                    stroke="hsl(var(--primary))"
                    fill="url(#colorPedidos)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pedidos Recentes */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Pedidos Recentes</CardTitle>
            <NavLink to="/dashboard/orders" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </NavLink>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum pedido hoje ainda
                </p>
              ) : (
                recentOrders.map(order => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-foreground">
                          #{order.order_number}
                        </span>
                        <Badge variant={statusConfig[order.status]?.variant || 'secondary'} className="text-[10px] px-1.5 py-0">
                          {statusConfig[order.status]?.label || order.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {order.customer_name} · {format(new Date(order.created_at), 'HH:mm')}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-foreground ml-2 whitespace-nowrap">
                      R$ {order.total?.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────

function KPICard({ icon: Icon, label, value, iconColor, iconBg, highlight }: {
  icon: any; label: string; value: string | number;
  iconColor: string; iconBg: string; highlight?: boolean;
}) {
  return (
    <Card className={highlight ? 'ring-2 ring-red-500/30 animate-pulse' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{value}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusPill({ icon: Icon, label, count, color }: {
  icon: any; label: string; count: number; color: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 p-3 rounded-xl border ${color}`}>
      <Icon className="h-5 w-5 shrink-0" />
      <div>
        <p className="text-lg font-bold leading-none">{count}</p>
        <p className="text-[11px] mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label, count }: {
  to: string; icon: any; label: string; count?: number;
}) {
  return (
    <NavLink
      to={to}
      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted transition-colors group"
    >
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {count !== undefined && count > 0 && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
            {count}
          </Badge>
        )}
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </NavLink>
  );
}
