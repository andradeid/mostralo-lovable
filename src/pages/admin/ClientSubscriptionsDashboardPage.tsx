import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, Package, Users, UserCheck, TrendingUp, 
  ArrowRight, Calendar, Loader2, Plus
} from 'lucide-react';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DashboardStats {
  totalPlans: number;
  activePlans: number;
  totalSubscribers: number;
  activeSubscribers: number;
  pausedSubscribers: number;
  cancelledSubscribers: number;
  estimatedMRR: number;
}

interface RecentSubscription {
  id: string;
  customer_name: string;
  plan_name: string;
  status: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'Ativos', color: 'hsl(var(--chart-2))' },
  paused: { label: 'Pausados', color: 'hsl(var(--chart-4))' },
  cancelled: { label: 'Cancelados', color: 'hsl(var(--destructive))' },
  expired: { label: 'Expirados', color: 'hsl(var(--muted-foreground))' }
};

export default function ClientSubscriptionsDashboardPage() {
  const { storeId } = useStoreAccess();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalPlans: 0,
    activePlans: 0,
    totalSubscribers: 0,
    activeSubscribers: 0,
    pausedSubscribers: 0,
    cancelledSubscribers: 0,
    estimatedMRR: 0
  });
  const [recentSubscriptions, setRecentSubscriptions] = useState<RecentSubscription[]>([]);

  useEffect(() => {
    if (storeId) {
      fetchDashboardData();
    }
  }, [storeId]);

  const fetchDashboardData = async () => {
    if (!storeId) return;
    
    setLoading(true);
    try {
      // Fetch plans
      const { data: plans, error: plansError } = await supabase
        .from('client_subscription_plans')
        .select('id, is_active')
        .eq('store_id', storeId);
      
      if (plansError) throw plansError;

      // Fetch subscriptions with plan and customer info
      const { data: subscriptions, error: subsError } = await supabase
        .from('client_subscriptions')
        .select(`
          id,
          status,
          payment_amount,
          created_at,
          customer:customers(name),
          plan:client_subscription_plans(name, price, billing_cycle)
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });
      
      if (subsError) throw subsError;

      // Calculate stats
      const activeSubscriptions = subscriptions?.filter(s => s.status === 'active') || [];
      const pausedSubscriptions = subscriptions?.filter(s => s.status === 'paused') || [];
      const cancelledSubscriptions = subscriptions?.filter(s => s.status === 'cancelled') || [];

      // Calculate MRR (Monthly Recurring Revenue)
      let mrr = 0;
      activeSubscriptions.forEach(sub => {
        const price = sub.payment_amount || sub.plan?.price || 0;
        const cycle = sub.plan?.billing_cycle || 'monthly';
        
        // Convert to monthly value
        switch (cycle) {
          case 'weekly':
            mrr += price * 4;
            break;
          case 'biweekly':
            mrr += price * 2;
            break;
          case 'monthly':
            mrr += price;
            break;
          case 'quarterly':
            mrr += price / 3;
            break;
          case 'biannual':
            mrr += price / 6;
            break;
          case 'annual':
            mrr += price / 12;
            break;
          default:
            mrr += price;
        }
      });

      setStats({
        totalPlans: plans?.length || 0,
        activePlans: plans?.filter(p => p.is_active).length || 0,
        totalSubscribers: subscriptions?.length || 0,
        activeSubscribers: activeSubscriptions.length,
        pausedSubscribers: pausedSubscriptions.length,
        cancelledSubscribers: cancelledSubscriptions.length,
        estimatedMRR: mrr
      });

      // Recent subscriptions (last 5)
      const recent = subscriptions?.slice(0, 5).map(s => ({
        id: s.id,
        customer_name: s.customer?.name || 'Cliente',
        plan_name: s.plan?.name || 'Plano',
        status: s.status,
        created_at: s.created_at
      })) || [];

      setRecentSubscriptions(recent);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  // Prepare pie chart data
  const chartData = [
    { name: 'Ativos', value: stats.activeSubscribers, color: statusConfig.active.color },
    { name: 'Pausados', value: stats.pausedSubscribers, color: statusConfig.paused.color },
    { name: 'Cancelados', value: stats.cancelledSubscribers, color: statusConfig.cancelled.color }
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Clube de Assinaturas
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão geral do seu programa de assinaturas
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/dashboard/assinaturas/assinantes">
              <Plus className="h-4 w-4 mr-2" />
              Novo Assinante
            </Link>
          </Button>
          <Button asChild>
            <Link to="/dashboard/assinaturas/planos">
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Planos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlans}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activePlans} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Assinantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscribers}</div>
            <p className="text-xs text-muted-foreground">
              em todos os planos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinantes Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeSubscribers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalSubscribers > 0 
                ? `${Math.round((stats.activeSubscribers / stats.totalSubscribers) * 100)}% do total`
                : 'nenhum assinante'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR Estimado</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(stats.estimatedMRR)}</div>
            <p className="text-xs text-muted-foreground">
              receita recorrente mensal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation + Chart */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Navigation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link 
              to="/dashboard/assinaturas/planos"
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Gerenciar Planos</p>
                  <p className="text-sm text-muted-foreground">
                    Criar, editar ou desativar planos
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </Link>

            <Link 
              to="/dashboard/assinaturas/assinantes"
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Gerenciar Assinantes</p>
                  <p className="text-sm text-muted-foreground">
                    Ver, pausar ou cancelar assinaturas
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>

        {/* Status Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} assinantes`, '']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-muted-foreground">
                Nenhum assinante cadastrado
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Subscriptions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Assinaturas Recentes</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard/assinaturas/assinantes">
              Ver todas
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentSubscriptions.length > 0 ? (
            <div className="space-y-3">
              {recentSubscriptions.map((sub) => (
                <div 
                  key={sub.id} 
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{sub.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{sub.plan_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      sub.status === 'active' ? 'default' : 
                      sub.status === 'paused' ? 'secondary' : 
                      'destructive'
                    }>
                      {statusConfig[sub.status]?.label || sub.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(sub.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="font-medium">Nenhuma assinatura ainda</p>
              <p className="text-sm text-muted-foreground mb-4">
                Comece adicionando planos e assinantes
              </p>
              <Button asChild size="sm">
                <Link to="/dashboard/assinaturas/planos">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Plano
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
