import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Calendar, Phone, Mail, CreditCard, Clock } from 'lucide-react';
import { ClientSubscription, useClientSubscriptions, SubscriptionUsage } from '@/hooks/useClientSubscriptions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SubscriptionDetailsDialogProps {
  subscription: ClientSubscription | null;
  onClose: () => void;
  storeId: string | null;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Ativo', variant: 'default' },
  paused: { label: 'Pausado', variant: 'secondary' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
  expired: { label: 'Expirado', variant: 'outline' },
  pending_payment: { label: 'Pagamento Pendente', variant: 'secondary' }
};

export function SubscriptionDetailsDialog({ subscription, onClose, storeId }: SubscriptionDetailsDialogProps) {
  const { listUsages } = useClientSubscriptions(storeId);
  const [usages, setUsages] = useState<SubscriptionUsage[]>([]);
  const [loadingUsages, setLoadingUsages] = useState(false);

  useEffect(() => {
    const fetchUsages = async () => {
      if (!subscription) return;
      
      setLoadingUsages(true);
      try {
        const data = await listUsages(subscription.id);
        setUsages(data);
      } finally {
        setLoadingUsages(false);
      }
    };

    if (subscription) {
      fetchUsages();
    }
  }, [subscription, listUsages]);

  if (!subscription) return null;

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const formatDateTime = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <Dialog open={!!subscription} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalhes da Assinatura
            <Badge variant={statusConfig[subscription.status]?.variant || 'secondary'}>
              {statusConfig[subscription.status]?.label || subscription.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="usages">Histórico de Uso</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            {/* Customer Info */}
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-semibold mb-3">Cliente</h4>
                <div className="space-y-2">
                  <p className="font-medium">{subscription.customer?.name}</p>
                  {subscription.customer?.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {subscription.customer.phone}
                    </p>
                  )}
                  {subscription.customer?.email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {subscription.customer.email}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Plan Info */}
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Plano
                </h4>
                <div className="space-y-2">
                  <p className="font-medium">{subscription.plan?.name}</p>
                  <p className="text-lg font-bold text-primary">
                    {formatPrice(subscription.plan?.price || 0)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{subscription.plan?.billing_cycle}
                    </span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {subscription.usages_this_period} usos
                      {subscription.plan?.usage_limit 
                        ? ` / ${subscription.plan.usage_limit}`
                        : ' (ilimitado)'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Period Info */}
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Período Atual
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Início</p>
                    <p className="font-medium">{formatDate(subscription.current_period_start)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Término</p>
                    <p className="font-medium">{formatDate(subscription.current_period_end)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Assinante desde</p>
                    <p className="font-medium">{formatDate(subscription.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Renovação automática</p>
                    <p className="font-medium">{subscription.auto_renew ? 'Sim' : 'Não'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {subscription.notes && (
              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-semibold mb-2">Observações</h4>
                  <p className="text-sm text-muted-foreground">{subscription.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="usages" className="mt-4">
            {loadingUsages ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : usages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum uso registrado neste período</p>
              </div>
            ) : (
              <div className="space-y-2">
                {usages.map(usage => (
                  <Card key={usage.id}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{usage.service?.name || 'Serviço'}</p>
                          {usage.professional && (
                            <p className="text-xs text-muted-foreground">
                              Por: {usage.professional.name}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(usage.used_at)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
