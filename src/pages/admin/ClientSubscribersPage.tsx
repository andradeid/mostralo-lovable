import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, Plus, Search, Loader2, Phone, Mail, Calendar, 
  Pause, Play, X, RotateCcw, Eye, CreditCard 
} from 'lucide-react';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useClientSubscriptions, ClientSubscription } from '@/hooks/useClientSubscriptions';
import { AddSubscriberDialog } from '@/components/admin/subscriptions/AddSubscriberDialog';
import { SubscriptionDetailsDialog } from '@/components/admin/subscriptions/SubscriptionDetailsDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Ativo', variant: 'default' },
  paused: { label: 'Pausado', variant: 'secondary' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
  expired: { label: 'Expirado', variant: 'outline' },
  pending_payment: { label: 'Pagamento Pendente', variant: 'secondary' }
};

export default function ClientSubscribersPage() {
  const { storeId } = useStoreAccess();
  const { 
    subscriptions, 
    loading, 
    fetchSubscriptions,
    pauseSubscription,
    resumeSubscription,
    cancelSubscription,
    renewSubscription
  } = useClientSubscriptions(storeId);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<ClientSubscription | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (storeId) {
      fetchSubscriptions();
    }
  }, [storeId, fetchSubscriptions]);

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = !search || 
      sub.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      sub.customer?.phone?.includes(search) ||
      sub.plan?.name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleAction = async (action: string, subscription: ClientSubscription) => {
    setActionLoading(subscription.id);
    try {
      switch (action) {
        case 'pause':
          await pauseSubscription(subscription.id);
          break;
        case 'resume':
          await resumeSubscription(subscription.id);
          break;
        case 'cancel':
          await cancelSubscription(subscription.id);
          break;
        case 'renew':
          await renewSubscription(subscription.id);
          break;
      }
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    paused: subscriptions.filter(s => s.status === 'paused').length,
    cancelled: subscriptions.filter(s => s.status === 'cancelled').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Assinantes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os clientes assinantes da sua loja
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Assinante
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.paused}</div>
            <p className="text-xs text-muted-foreground">Pausados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <p className="text-xs text-muted-foreground">Cancelados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou plano..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'paused', 'cancelled'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'Todos' : statusConfig[status]?.label || status}
            </Button>
          ))}
        </div>
      </div>

      {/* Subscriptions List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredSubscriptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum assinante encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              {search || statusFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Adicione seu primeiro assinante ao clube'}
            </p>
            {!search && statusFilter === 'all' && (
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Assinante
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSubscriptions.map((subscription) => (
            <Card key={subscription.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Customer Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{subscription.customer?.name || 'Cliente'}</h3>
                      <Badge variant={statusConfig[subscription.status]?.variant || 'secondary'}>
                        {statusConfig[subscription.status]?.label || subscription.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {subscription.customer?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {subscription.customer.phone}
                        </span>
                      )}
                      {subscription.customer?.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {subscription.customer.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Plan Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <span className="font-medium">{subscription.plan?.name || 'Plano'}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Expira: {formatDate(subscription.current_period_end)}
                      </span>
                      <span>
                        Usos: {subscription.usages_this_period}
                        {subscription.plan?.usage_limit ? `/${subscription.plan.usage_limit}` : ' (ilimitado)'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedSubscription(subscription)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Detalhes
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={actionLoading === subscription.id}
                        >
                          {actionLoading === subscription.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Ações'
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {subscription.status === 'active' && (
                          <DropdownMenuItem onClick={() => handleAction('pause', subscription)}>
                            <Pause className="h-4 w-4 mr-2" />
                            Pausar
                          </DropdownMenuItem>
                        )}
                        {subscription.status === 'paused' && (
                          <DropdownMenuItem onClick={() => handleAction('resume', subscription)}>
                            <Play className="h-4 w-4 mr-2" />
                            Reativar
                          </DropdownMenuItem>
                        )}
                        {['active', 'paused'].includes(subscription.status) && (
                          <DropdownMenuItem onClick={() => handleAction('cancel', subscription)}>
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                          </DropdownMenuItem>
                        )}
                        {['expired', 'cancelled'].includes(subscription.status) && (
                          <DropdownMenuItem onClick={() => handleAction('renew', subscription)}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Renovar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Subscriber Dialog */}
      <AddSubscriberDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        storeId={storeId}
        onSuccess={() => {
          setIsAddOpen(false);
          fetchSubscriptions();
        }}
      />

      {/* Details Dialog */}
      <SubscriptionDetailsDialog
        subscription={selectedSubscription}
        onClose={() => setSelectedSubscription(null)}
        storeId={storeId}
      />
    </div>
  );
}
