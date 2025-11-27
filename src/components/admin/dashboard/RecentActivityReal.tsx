import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Store, Users, ShoppingCart, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Activity {
  id: string;
  type: 'store' | 'user' | 'order' | 'approval';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'pending' | 'rejected';
}

export function RecentActivityReal() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchRecentActivity, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecentActivity = async () => {
    try {
      const activityList: Activity[] = [];

      // Últimas lojas criadas (últimas 5)
      const { data: stores } = await supabase
        .from('stores')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      stores?.forEach(store => {
        activityList.push({
          id: `store-${store.id}`,
          type: 'store',
          title: 'Nova loja cadastrada',
          description: store.name,
          timestamp: store.created_at,
          status: 'success'
        });
      });

      // Últimos usuários registrados (últimos 5)
      const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      users?.forEach(user => {
        activityList.push({
          id: `user-${user.id}`,
          type: 'user',
          title: 'Novo usuário registrado',
          description: user.full_name || user.email,
          timestamp: user.created_at,
          status: 'success'
        });
      });

      // Últimos pedidos (últimos 5)
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          total,
          created_at,
          stores:store_id (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      orders?.forEach(order => {
        const storeName = (order as any).stores?.name || 'Loja desconhecida';
        activityList.push({
          id: `order-${order.id}`,
          type: 'order',
          title: 'Novo pedido',
          description: `${order.customer_name} • ${storeName} • R$ ${Number(order.total).toFixed(2)}`,
          timestamp: order.created_at,
          status: 'success'
        });
      });

      // Últimas aprovações (últimas 5)
      const { data: approvals } = await supabase
        .from('payment_approvals')
        .select(`
          id,
          status,
          company_name,
          created_at,
          approved_at
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      approvals?.forEach(approval => {
        activityList.push({
          id: `approval-${approval.id}`,
          type: 'approval',
          title: approval.status === 'approved' ? 'Pagamento aprovado' : 
                 approval.status === 'rejected' ? 'Pagamento rejeitado' : 
                 'Pagamento pendente',
          description: approval.company_name || 'Solicitação de aprovação',
          timestamp: approval.approved_at || approval.created_at,
          status: approval.status === 'approved' ? 'success' : 
                  approval.status === 'rejected' ? 'rejected' : 
                  'pending'
        });
      });

      // Ordenar todas as atividades por data (mais recente primeiro)
      activityList.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Pegar apenas as 10 mais recentes
      setActivities(activityList.slice(0, 10));
    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'store': return Store;
      case 'user': return Users;
      case 'order': return ShoppingCart;
      case 'approval': return CheckCircle;
      default: return Calendar;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'store': return 'text-green-600';
      case 'user': return 'text-blue-600';
      case 'order': return 'text-purple-600';
      case 'approval': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Concluído</Badge>;
      case 'pending':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
      case 'rejected':
        return <Badge variant="default" className="bg-red-100 text-red-800 border-red-200">Rejeitado</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Atividade Recente
          </CardTitle>
          <CardDescription>Últimas atividades do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Atividade Recente
        </CardTitle>
        <CardDescription>
          Últimas atividades do sistema • Atualização automática
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma atividade recente
            </p>
          ) : (
            activities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              const colorClass = getActivityColor(activity.type);
              
              return (
                <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b last:border-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass} bg-opacity-10`}>
                    <Icon className={`w-4 h-4 ${colorClass}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      {getStatusBadge(activity.status)}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.timestamp), { 
                        addSuffix: true,
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
