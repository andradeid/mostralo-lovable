import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ImpersonationButton } from '@/components/admin/ImpersonationButton';
import { SubscriberEditDialog } from '@/components/admin/SubscriberEditDialog';
import { CreateStoreOwnerDialog } from '@/components/admin/CreateStoreOwnerDialog';
import { UserBlockDialog } from '@/components/admin/UserBlockDialog';
import { UserDeleteDialog } from '@/components/admin/UserDeleteDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Store,
  Search,
  CreditCard,
  Mail,
  Calendar,
  Loader2,
  MoreVertical,
  Edit,
  Ban,
  Trash2,
  CheckCircle,
  ExternalLink,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

interface Subscriber {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  is_blocked: boolean;
  is_deleted: boolean;
  store_id: string;
  store_name: string;
  store_slug: string;
  store_status: string;
  store_created_at: string;
  plan_id?: string | null;
  plan_name?: string | null;
  plan_price?: number | null;
  plan_billing_cycle?: string | null;
  subscription_expires_at?: string | null;
  custom_monthly_price?: number | null;
  discount_reason?: string | null;
}

const SubscribersPage = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'no_plan'>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  
  const [editSubscriber, setEditSubscriber] = useState<Subscriber | null>(null);
  const [blockUser, setBlockUser] = useState<any>(null);
  const [deleteUser, setDeleteUser] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchSubscribers();
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const { data } = await supabase
      .from('plans')
      .select('id, name')
      .order('name');
    
    if (data) setPlans(data);
  };

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      // Buscar diretamente da tabela stores para garantir apenas donos reais
      const { data: storesData, error } = await supabase
        .from('stores')
        .select(`
          id,
          name,
          slug,
          status,
          created_at,
          plan_id,
          subscription_expires_at,
          custom_monthly_price,
          discount_reason,
          owner:profiles!stores_owner_id_fkey (
            id,
            email,
            full_name,
            avatar_url,
            is_blocked,
            is_deleted
          ),
          plans (
            name,
            price,
            billing_cycle
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transformar para o formato Subscriber[]
      const transformedData: Subscriber[] = storesData
        ?.filter((store: any) => store.owner && !store.owner.is_deleted)
        .map((store: any) => ({
          id: store.owner.id,
          full_name: store.owner.full_name || 'Sem nome',
          email: store.owner.email,
          avatar_url: store.owner.avatar_url,
          is_blocked: store.owner.is_blocked || false,
          is_deleted: store.owner.is_deleted || false,
          store_id: store.id,
          store_name: store.name,
          store_slug: store.slug,
          store_status: store.status,
          store_created_at: store.created_at,
          plan_id: store.plan_id,
          plan_name: store.plans?.name,
          plan_price: store.plans?.price,
          plan_billing_cycle: store.plans?.billing_cycle,
          subscription_expires_at: store.subscription_expires_at,
          custom_monthly_price: store.custom_monthly_price,
          discount_reason: store.discount_reason,
        })) || [];

      setSubscribers(transformedData);
    } catch (error: any) {
      console.error('Erro ao buscar assinantes:', error);
      toast.error('Não foi possível carregar os assinantes.');
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionStatus = (subscriber: Subscriber) => {
    if (!subscriber.plan_id) {
      return { label: 'Sem Plano', variant: 'secondary' as const, color: 'text-gray-600' };
    }

    if (!subscriber.subscription_expires_at) {
      return { label: 'Ativo', variant: 'default' as const, color: 'text-green-600' };
    }

    const expiresAt = new Date(subscriber.subscription_expires_at);
    const now = new Date();

    if (expiresAt < now) {
      return { label: 'Expirado', variant: 'destructive' as const, color: 'text-red-600' };
    }

    const daysUntilExpiration = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration <= 7) {
      return { label: `Expira em ${daysUntilExpiration}d`, variant: 'outline' as const, color: 'text-orange-600' };
    }

    return { label: 'Ativo', variant: 'default' as const, color: 'text-green-600' };
  };

  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch = 
      sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.store_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'no_plan') {
      matchesStatus = !sub.plan_id;
    } else if (statusFilter === 'expired') {
      matchesStatus = sub.subscription_expires_at 
        ? new Date(sub.subscription_expires_at) < new Date()
        : false;
    } else if (statusFilter === 'active') {
      matchesStatus = sub.plan_id && (
        !sub.subscription_expires_at || 
        new Date(sub.subscription_expires_at) >= new Date()
      );
    }

    const matchesPlan = planFilter === 'all' || sub.plan_id === planFilter;
    
    let matchesUserStatus = true;
    if (userStatusFilter === 'active') {
      matchesUserStatus = !sub.is_blocked;
    } else if (userStatusFilter === 'blocked') {
      matchesUserStatus = sub.is_blocked;
    }
    
    return matchesSearch && matchesStatus && matchesPlan && matchesUserStatus;
  });

  const activeSubscribers = subscribers.filter(s => 
    s.plan_id && (!s.subscription_expires_at || new Date(s.subscription_expires_at) >= new Date())
  );

  const expiredSubscribers = subscribers.filter(s => 
    s.subscription_expires_at && new Date(s.subscription_expires_at) < new Date()
  );

  const noPlanSubscribers = subscribers.filter(s => !s.plan_id);

  const monthlyRevenue = activeSubscribers.reduce((acc, sub) => {
    const effectivePrice = sub.custom_monthly_price || sub.plan_price || 0;
    if (sub.plan_billing_cycle === 'monthly') {
      return acc + Number(effectivePrice);
    }
    return acc;
  }, 0);

  const statsCards = [
    {
      title: 'Total de Assinantes',
      value: subscribers.length,
      description: 'Donos de loja no sistema',
      icon: Store,
      color: 'text-blue-600'
    },
    {
      title: 'Assinaturas Ativas',
      value: activeSubscribers.length,
      description: 'Com plano ativo',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Assinaturas Expiradas',
      value: expiredSubscribers.length,
      description: 'Precisam renovar',
      icon: AlertCircle,
      color: 'text-red-600'
    },
    {
      title: 'Receita Mensal',
      value: `R$ ${monthlyRevenue.toFixed(2)}`,
      description: 'Potencial de assinaturas',
      icon: DollarSign,
      color: 'text-emerald-600'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gerenciar Assinantes</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie planos e assinaturas dos donos de loja
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Criar Novo Lojista
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <IconComponent className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{typeof card.value === 'number' ? card.value : card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros e Busca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou loja..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status da Assinatura</label>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="active">Ativas</SelectItem>
                    <SelectItem value="expired">Expiradas</SelectItem>
                    <SelectItem value="no_plan">Sem Plano</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Plano</label>
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {plans.map(plan => (
                      <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status do Usuário</label>
                <Select value={userStatusFilter} onValueChange={(value: any) => setUserStatusFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="blocked">Bloqueados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium opacity-0">Ações</label>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setPlanFilter('all');
                    setUserStatusFilter('all');
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscribers List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Assinantes ({filteredSubscribers.length})</CardTitle>
          <CardDescription>
            Assinantes encontrados com os filtros aplicados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSubscribers.length === 0 ? (
            <div className="text-center py-8">
              <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum assinante encontrado</h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros ou termos de busca.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {filteredSubscribers.map((subscriber) => {
                const subscriptionStatus = getSubscriptionStatus(subscriber);

                return (
                  <Card key={subscriber.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{subscriber.full_name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="text-xs text-muted-foreground truncate">{subscriber.email}</span>
                          </div>
                        </div>
                        {subscriber.is_blocked && (
                          <Badge variant="destructive" className="shrink-0 ml-2">Bloqueado</Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Loja:</span>
                          <Badge variant="outline" className="truncate max-w-[60%]">
                            {subscriber.store_name}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Plano:</span>
                          <Badge variant={subscriber.plan_name ? 'default' : 'secondary'}>
                            {subscriber.plan_name || 'Sem Plano'}
                          </Badge>
                        </div>

                        {subscriber.plan_price && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Valor:</span>
                              <div className="flex items-center gap-2">
                                {subscriber.custom_monthly_price && (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 text-xs border-green-200">
                                    🏷️ -{Math.round((1 - subscriber.custom_monthly_price / subscriber.plan_price) * 100)}%
                                  </Badge>
                                )}
                                <span className="text-sm font-semibold">
                                  R$ {Number(subscriber.custom_monthly_price || subscriber.plan_price).toFixed(2)}/{subscriber.plan_billing_cycle === 'monthly' ? 'mês' : 'ano'}
                                </span>
                              </div>
                            </div>
                            {subscriber.custom_monthly_price && (
                              <div className="text-xs text-muted-foreground line-through text-right">
                                Original: R$ {Number(subscriber.plan_price).toFixed(2)}/mês
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Status:</span>
                          <Badge variant={subscriptionStatus.variant}>
                            {subscriptionStatus.label}
                          </Badge>
                        </div>

                        {subscriber.subscription_expires_at && (
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>
                              Expira: {new Date(subscriber.subscription_expires_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setEditSubscriber(subscriber)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>

                        {!subscriber.is_blocked && (
                          <ImpersonationButton 
                            user={{
                              id: subscriber.id,
                              email: subscriber.email,
                              full_name: subscriber.full_name,
                              user_type: 'store_admin',
                              avatar_url: subscriber.avatar_url || undefined
                            }}
                            size="sm"
                            variant="outline"
                          />
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => window.open(`/${subscriber.store_slug}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Ver Loja
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                              onClick={() => setBlockUser({
                                id: subscriber.id,
                                full_name: subscriber.full_name,
                                email: subscriber.email,
                                is_blocked: subscriber.is_blocked
                              })}
                            >
                              {subscriber.is_blocked ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Desbloquear
                                </>
                              ) : (
                                <>
                                  <Ban className="h-4 w-4 mr-2" />
                                  Bloquear
                                </>
                              )}
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem 
                              onClick={() => setDeleteUser({
                                id: subscriber.id,
                                full_name: subscriber.full_name,
                                email: subscriber.email
                              })}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {editSubscriber && (
        <SubscriberEditDialog
          open={!!editSubscriber}
          onOpenChange={(open) => !open && setEditSubscriber(null)}
          subscriber={editSubscriber}
          onSuccess={fetchSubscribers}
        />
      )}

      {blockUser && (
        <UserBlockDialog
          open={!!blockUser}
          onOpenChange={(open) => !open && setBlockUser(null)}
          user={blockUser}
          onSuccess={fetchSubscribers}
        />
      )}

      {deleteUser && (
        <UserDeleteDialog
          open={!!deleteUser}
          onOpenChange={(open) => !open && setDeleteUser(null)}
          user={deleteUser}
          onSuccess={fetchSubscribers}
        />
      )}

      <CreateStoreOwnerDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchSubscribers}
      />
    </div>
  );
};

export default SubscribersPage;
