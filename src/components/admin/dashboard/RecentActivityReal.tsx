import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Store, Users, ShoppingCart, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';

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
          title: 'Nova loja',
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
          title: 'Novo usuário',
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
        const storeName = (order as any).stores?.name || 'Loja';
        activityList.push({
          id: `order-${order.id}`,
          type: 'order',
          title: 'Pedido',
          description: `${order.customer_name} • R$ ${Number(order.total).toFixed(2)}`,
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
          title: approval.status === 'approved' ? 'Aprovado' : 
                 approval.status === 'rejected' ? 'Rejeitado' : 
                 'Pendente',
          description: approval.company_name || 'Solicitação',
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

      // Pegar apenas as 8 mais recentes
      setActivities(activityList.slice(0, 8));
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
      case 'store': return 'text-green-600 bg-green-100';
      case 'user': return 'text-blue-600 bg-blue-100';
      case 'order': return 'text-purple-600 bg-purple-100';
      case 'approval': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusDot = (status?: string) => {
    switch (status) {
      case 'success':
        return <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />;
      case 'pending':
        return <span className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0" />;
      case 'rejected':
        return <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2 p-3 md:p-4">
          <CardTitle className="flex items-center text-sm md:text-base">
            <Calendar className="w-4 h-4 mr-2" />
            Atividade Recente
          </CardTitle>
          <CardDescription className="text-xs">Carregando...</CardDescription>
        </CardHeader>
        <CardContent className="p-3 md:p-4 pt-0">
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-7 h-7 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 bg-muted rounded w-3/4 mb-1"></div>
                  <div className="h-2 bg-muted rounded w-1/2"></div>
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
      <CardHeader className="pb-2 p-3 md:p-4">
        <CardTitle className="flex items-center text-sm md:text-base">
          <Calendar className="w-4 h-4 mr-2" />
          Atividade Recente
        </CardTitle>
        <CardDescription className="text-xs">
          Atualização automática
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 md:p-4 pt-0">
        <ScrollArea className="max-h-[300px] md:max-h-[380px]">
          <div className="space-y-2">
            {activities.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhuma atividade recente
              </p>
            ) : (
              activities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                const colorClass = getActivityColor(activity.type);
                
                return (
                  <div key={activity.id} className="flex items-start gap-2 pb-2 border-b last:border-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {getStatusDot(activity.status)}
                        <p className="text-xs font-medium truncate">{activity.title}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{activity.description}</p>
                      <p className="text-[10px] text-muted-foreground">
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
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
