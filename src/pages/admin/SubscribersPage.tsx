import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { SubscriberEditDialog } from '@/components/admin/SubscriberEditDialog';
import { CreateStoreOwnerDialog } from '@/components/admin/CreateStoreOwnerDialog';
import { UserBlockDialog } from '@/components/admin/UserBlockDialog';
import { UserDeleteDialog } from '@/components/admin/UserDeleteDialog';
import { StoreModulesDialog } from '@/components/admin/StoreModulesDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Store,
  Search,
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
  TrendingUp,
  Plus,
  Package,
  ChevronDown,
  ChevronRight,
  Building2
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
  coupon_discount?: number | null;
  coupon_code?: string | null;
}

/** Assinante agrupado por user_id */
interface GroupedSubscriber {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  isBlocked: boolean;
  stores: Subscriber[];
}

// Helper function para calcular preço efetivo
const getEffectivePrice = (subscriber: Subscriber): number => {
  if (subscriber.custom_monthly_price !== null && subscriber.custom_monthly_price !== undefined && Number(subscriber.custom_monthly_price) > 0) {
    return Number(subscriber.custom_monthly_price);
  }
  const planPrice = Number(subscriber.plan_price || 0);
  const couponDiscount = Number(subscriber.coupon_discount || 0);
  return planPrice - couponDiscount;
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

/** Agrupa subscribers[] por user_id */
function groupByUser(subscribers: Subscriber[]): GroupedSubscriber[] {
  const map = new Map<string, GroupedSubscriber>();
  for (const sub of subscribers) {
    const existing = map.get(sub.id);
    if (existing) {
      existing.stores.push(sub);
    } else {
      map.set(sub.id, {
        userId: sub.id,
        fullName: sub.full_name,
        email: sub.email,
        avatarUrl: sub.avatar_url,
        isBlocked: sub.is_blocked,
        stores: [sub],
      });
    }
  }
  return Array.from(map.values());
}

// ─── Sub-componente: linha de loja dentro do card agrupado ───
function StoreRow({
  store,
  onEdit,
  onModules,
  onBlock,
  onDelete,
}: {
  store: Subscriber;
  onEdit: () => void;
  onModules: () => void;
  onBlock: () => void;
  onDelete: () => void;
}) {
  const status = getSubscriptionStatus(store);

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
      {/* Cabeçalho da loja */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Store className="w-4 h-4 text-primary shrink-0" />
          <span className="font-medium text-sm truncate">{store.store_name}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={store.plan_name ? 'default' : 'secondary'} className="text-xs">
            {store.plan_name || 'Sem Plano'}
          </Badge>
          <Badge variant={status.variant} className="text-xs">
            {status.label}
          </Badge>
        </div>
      </div>

      {/* Detalhes */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {store.plan_price ? (
          <span className="flex items-center gap-1">
            {(store.custom_monthly_price || store.coupon_discount) && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] px-1">
                {store.coupon_code ? `🎟️ ${store.coupon_code}` : '🏷️'}
                {' '}-{Math.round((1 - getEffectivePrice(store) / Number(store.plan_price)) * 100)}%
              </Badge>
            )}
            <span className="font-semibold text-foreground">
              R$ {getEffectivePrice(store).toFixed(2)}/{store.plan_billing_cycle === 'monthly' ? 'mês' : 'ano'}
            </span>
            {(store.custom_monthly_price || store.coupon_discount) && (
              <span className="line-through">R$ {Number(store.plan_price).toFixed(2)}</span>
            )}
          </span>
        ) : (
          <span>—</span>
        )}

        {store.subscription_expires_at && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Expira: {new Date(store.subscription_expires_at).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onEdit}>
          <Edit className="h-3 w-3 mr-1" />
          Editar
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => window.open(`/${store.store_slug}`, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Loja
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onModules}>
              <Package className="h-4 w-4 mr-2" />
              Módulos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onBlock}>
              {store.is_blocked ? (
                <><CheckCircle className="h-4 w-4 mr-2" /> Desbloquear</>
              ) : (
                <><Ban className="h-4 w-4 mr-2" /> Bloquear</>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
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
  const [modulesStore, setModulesStore] = useState<{ id: string; name: string } | null>(null);
  // Controle de cards expandidos (multi-loja)
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

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

      // Buscar cupons aplicados por store_id
      const { data: couponsData } = await supabase
        .from('payment_approvals')
        .select(`
          store_id,
          coupon_discount,
          coupons:coupon_id (code)
        `)
        .not('coupon_id', 'is', null);

      const couponMap = new Map<string, { coupon_discount: number; coupon_code: string }>();
      couponsData?.forEach((item: any) => {
        if (item.store_id && item.coupon_discount) {
          couponMap.set(item.store_id, {
            coupon_discount: item.coupon_discount,
            coupon_code: item.coupons?.code || ''
          });
        }
      });

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
          custom_monthly_price: store.custom_monthly_price && Number(store.custom_monthly_price) > 0 ? store.custom_monthly_price : null,
          discount_reason: store.discount_reason,
          coupon_discount: couponMap.get(store.id)?.coupon_discount || null,
          coupon_code: couponMap.get(store.id)?.coupon_code || null,
        })) || [];

      setSubscribers(transformedData);
    } catch (error: any) {
      console.error('Erro ao buscar assinantes:', error);
      toast.error('Não foi possível carregar os assinantes.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Filtragem ───
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
      matchesStatus = !!sub.plan_id && (
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

  // Agrupar por usuário
  const grouped = groupByUser(filteredSubscribers);

  // ─── Stats ───
  const activeSubscribers = subscribers.filter(s => 
    s.plan_id && (!s.subscription_expires_at || new Date(s.subscription_expires_at) >= new Date())
  );
  const expiredSubscribers = subscribers.filter(s => 
    s.subscription_expires_at && new Date(s.subscription_expires_at) < new Date()
  );
  const uniqueUsers = new Set(subscribers.map(s => s.id)).size;

  const monthlyRevenue = activeSubscribers.reduce((acc, sub) => {
    if (sub.plan_billing_cycle === 'monthly') {
      return acc + getEffectivePrice(sub);
    }
    return acc;
  }, 0);

  const statsCards = [
    {
      title: '👥 Assinantes Únicos',
      value: uniqueUsers,
      description: 'Donos de loja cadastrados (agrupados)',
      icon: Store,
      color: 'text-blue-600'
    },
    {
      title: '✅ Lojas Ativas',
      value: activeSubscribers.length,
      description: 'Lojas com plano ativo e dentro da validade',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: '⚠️ Lojas Expiradas',
      value: expiredSubscribers.length,
      description: 'Lojas com assinatura vencida',
      icon: AlertCircle,
      color: 'text-red-600'
    },
    {
      title: '📊 MRR Projetado',
      value: `R$ ${monthlyRevenue.toFixed(2)}`,
      description: 'Receita mensal recorrente (com descontos)',
      icon: TrendingUp,
      color: 'text-emerald-600'
    }
  ];

  const toggleExpanded = (userId: string) => {
    setExpandedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

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
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <IconComponent className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
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

      {/* Subscribers List — Agrupado por usuário */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Assinantes ({grouped.length} pessoas · {filteredSubscribers.length} lojas)</CardTitle>
          <CardDescription>
            Assinantes agrupados por pessoa — clique para expandir lojas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {grouped.length === 0 ? (
            <div className="text-center py-8">
              <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum assinante encontrado</h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros ou termos de busca.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {grouped.map((group) => {
                const hasMultipleStores = group.stores.length > 1;
                const isExpanded = expandedUsers.has(group.userId);

                // Para single-store, mostrar direto sem collapsible
                if (!hasMultipleStores) {
                  const store = group.stores[0];
                  const status = getSubscriptionStatus(store);
                  return (
                    <Card key={group.userId} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{group.fullName}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="text-xs text-muted-foreground truncate">{group.email}</span>
                            </div>
                          </div>
                          {group.isBlocked && (
                            <Badge variant="destructive" className="shrink-0 ml-2">Bloqueado</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <StoreRow
                          store={store}
                          onEdit={() => setEditSubscriber(store)}
                          onModules={() => setModulesStore({ id: store.store_id, name: store.store_name })}
                          onBlock={() => setBlockUser({ id: store.id, full_name: store.full_name, email: store.email, is_blocked: store.is_blocked })}
                          onDelete={() => setDeleteUser({ id: store.id, full_name: store.full_name, email: store.email })}
                        />
                      </CardContent>
                    </Card>
                  );
                }

                // Multi-store: card expansível
                return (
                  <Card key={group.userId} className="overflow-hidden">
                    <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(group.userId)}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-base truncate">{group.fullName}</CardTitle>
                                <Badge variant="outline" className="shrink-0 flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {group.stores.length} lojas
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                                <span className="text-xs text-muted-foreground truncate">{group.email}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              {group.isBlocked && (
                                <Badge variant="destructive">Bloqueado</Badge>
                              )}
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>

                          {/* Resumo compacto quando fechado */}
                          {!isExpanded && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {group.stores.map(s => {
                                const st = getSubscriptionStatus(s);
                                return (
                                  <Badge key={s.store_id} variant={st.variant} className="text-[10px]">
                                    {s.store_name}
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </CardHeader>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-3">
                          {group.stores.map(store => (
                            <StoreRow
                              key={store.store_id}
                              store={store}
                              onEdit={() => setEditSubscriber(store)}
                              onModules={() => setModulesStore({ id: store.store_id, name: store.store_name })}
                              onBlock={() => setBlockUser({ id: store.id, full_name: store.full_name, email: store.email, is_blocked: store.is_blocked })}
                              onDelete={() => setDeleteUser({ id: store.id, full_name: store.full_name, email: store.email })}
                            />
                          ))}
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
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

      {modulesStore && (
        <StoreModulesDialog
          open={!!modulesStore}
          onOpenChange={(open) => !open && setModulesStore(null)}
          storeId={modulesStore.id}
          storeName={modulesStore.name}
        />
      )}
    </div>
  );
};

export default SubscribersPage;
