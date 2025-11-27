import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, Store, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { NavLink } from 'react-router-dom';

interface PendingData {
  pendingApprovals: number;
  expiringIn7Days: number;
  expiringIn15Days: number;
  expiringIn30Days: number;
  freeStores: number;
  inactiveStores: number;
}

export function PendingActions() {
  const [data, setData] = useState<PendingData>({
    pendingApprovals: 0,
    expiringIn7Days: 0,
    expiringIn15Days: 0,
    expiringIn30Days: 0,
    freeStores: 0,
    inactiveStores: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingActions();
    
    // Atualizar a cada minuto
    const interval = setInterval(fetchPendingActions, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingActions = async () => {
    try {
      // Aprovações pendentes
      const { data: approvals } = await supabase
        .from('payment_approvals')
        .select('id')
        .eq('status', 'pending');

      // Assinaturas expirando
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { data: expiring7 } = await supabase
        .from('stores')
        .select('id')
        .eq('status', 'active')
        .lte('subscription_expires_at', in7Days.toISOString())
        .gte('subscription_expires_at', now.toISOString());

      const { data: expiring15 } = await supabase
        .from('stores')
        .select('id')
        .eq('status', 'active')
        .lte('subscription_expires_at', in15Days.toISOString())
        .gte('subscription_expires_at', in7Days.toISOString());

      const { data: expiring30 } = await supabase
        .from('stores')
        .select('id')
        .eq('status', 'active')
        .lte('subscription_expires_at', in30Days.toISOString())
        .gte('subscription_expires_at', in15Days.toISOString());

      // Lojas no plano Free (oportunidades de upsell)
      const { data: freePlan } = await supabase
        .from('plans')
        .select('id')
        .eq('name', 'Free')
        .single();

      const { data: freeStores } = await supabase
        .from('stores')
        .select('id')
        .eq('status', 'active')
        .eq('plan_id', freePlan?.id || '');

      // Lojas inativas
      const { data: inactive } = await supabase
        .from('stores')
        .select('id')
        .eq('status', 'inactive');

      setData({
        pendingApprovals: approvals?.length || 0,
        expiringIn7Days: expiring7?.length || 0,
        expiringIn15Days: expiring15?.length || 0,
        expiringIn30Days: expiring30?.length || 0,
        freeStores: freeStores?.length || 0,
        inactiveStores: inactive?.length || 0
      });
    } catch (error) {
      console.error('Erro ao buscar ações pendentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const alerts = [
    {
      title: 'Aprovações Pendentes',
      count: data.pendingApprovals,
      description: 'Solicitações aguardando revisão',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      priority: 'high',
      link: '/dashboard/subscribers'
    },
    {
      title: 'Expirando em 7 dias',
      count: data.expiringIn7Days,
      description: 'Assinaturas próximas do vencimento',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      priority: 'high',
      link: '/dashboard/stores'
    },
    {
      title: 'Expirando em 15 dias',
      count: data.expiringIn15Days,
      description: 'Assinaturas vencendo em breve',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      priority: 'medium',
      link: '/dashboard/stores'
    },
    {
      title: 'Expirando em 30 dias',
      count: data.expiringIn30Days,
      description: 'Assinaturas para renovação',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      priority: 'low',
      link: '/dashboard/stores'
    },
    {
      title: 'Lojas no Free',
      count: data.freeStores,
      description: 'Oportunidades de upgrade',
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      priority: 'medium',
      link: '/dashboard/stores'
    },
    {
      title: 'Lojas Inativas',
      count: data.inactiveStores,
      description: 'Risco de churn',
      icon: Store,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      priority: 'medium',
      link: '/dashboard/stores'
    }
  ];

  // Filtrar apenas alertas com contagem > 0
  const activeAlerts = alerts.filter(alert => alert.count > 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Ações Urgentes
          </CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Ações Urgentes
        </CardTitle>
        <CardDescription>
          {activeAlerts.length > 0 
            ? `${activeAlerts.length} item(ns) requer(em) atenção`
            : 'Nenhuma ação pendente no momento'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activeAlerts.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              ✅ Tudo em dia! Nenhuma ação urgente no momento.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAlerts.map((alert, index) => (
              <NavLink key={index} to={alert.link}>
                <div className={`flex items-center justify-between p-3 rounded-lg border hover:border-primary transition-colors cursor-pointer ${alert.bgColor} bg-opacity-10`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${alert.bgColor}`}>
                      <alert.icon className={`w-5 h-5 ${alert.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="default"
                      className={`${alert.color} ${alert.bgColor} border-0`}
                    >
                      {alert.count}
                    </Badge>
                  </div>
                </div>
              </NavLink>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
