import { useEffect, useState, lazy, Suspense } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SubscriptionPaymentsManagementPage = lazy(() => import('./SubscriptionPaymentsManagementPage'));

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
  Building2,
  MessageSquare,
  Send
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
  billing_contact_phone?: string | null;
  billing_contact_name?: string | null;
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
  return Number(subscriber.plan_price || 0);
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
  hasAutoCharge,
}: {
  store: Subscriber;
  onEdit: () => void;
  onModules: () => void;
  onBlock: () => void;
  onDelete: () => void;
  hasAutoCharge?: boolean;
}) {
  const status = getSubscriptionStatus(store);
  const [sendingCharge, setSendingCharge] = useState(false);

  const isExpiredOrNear = status.label === 'Expirado' || status.label.startsWith('Expira em');

  const handleQuickCharge = async () => {
    const phone = store.billing_contact_phone;
    if (!phone) {
      toast.error('Sem telefone de contato financeiro. Edite a assinatura primeiro.');
      return;
    }

    const amount = getEffectivePrice(store);
    if (amount <= 0) {
      toast.error('Valor da cobrança deve ser maior que zero');
      return;
    }

    setSendingCharge(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

      const { data, error } = await supabase.functions.invoke('send-subscription-charge', {
        body: {
          store_id: store.store_id,
          phone: fullPhone,
          contact_name: store.billing_contact_name || store.full_name,
          amount,
          description: `Assinatura Mostralo - ${store.store_name}`,
        }
      });

      if (error) throw error;
      if (data?.success) {
        toast.success(`Cobrança de R$ ${amount.toFixed(2)} enviada via WhatsApp!`);
      } else {
        throw new Error(data?.error || 'Erro ao enviar cobrança');
      }
    } catch (err: any) {
      console.error('Erro ao enviar cobrança:', err);
      toast.error(err.message || 'Erro ao enviar cobrança via WhatsApp');
    } finally {
      setSendingCharge(false);
    }
  };

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-border/50 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
      {/* Store header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Store className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium text-[13px] text-foreground truncate">{store.store_name}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {hasAutoCharge && (
            <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-600 dark:text-purple-400">
              Auto
            </span>
          )}
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
            store.plan_name 
              ? 'bg-muted text-foreground/70' 
              : 'bg-muted text-muted-foreground'
          }`}>
            {store.plan_name || 'Sem Plano'}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
            status.label === 'Ativo' 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
              : status.label === 'Expirado' 
                ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                : status.label === 'Sem Plano'
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              status.label === 'Ativo' ? 'bg-emerald-500' : status.label === 'Expirado' ? 'bg-red-500' : status.label === 'Sem Plano' ? 'bg-gray-400' : 'bg-amber-500'
            }`} />
            {status.label}
          </span>
        </div>
      </div>

      {/* Price + details */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        {store.plan_price ? (
          <div className="flex items-center gap-2">
            {store.custom_monthly_price && Number(store.custom_monthly_price) > 0 && (
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                -{Math.round((1 - getEffectivePrice(store) / Number(store.plan_price)) * 100)}%
              </span>
            )}
            <span className="text-[15px] font-bold text-foreground">
              R$ {getEffectivePrice(store).toFixed(2)}
            </span>
            <span className="text-[11px] text-muted-foreground">
              /{store.plan_billing_cycle === 'monthly' ? 'mês' : 'ano'}
            </span>
            {store.custom_monthly_price && Number(store.custom_monthly_price) > 0 && (
              <span className="text-[11px] text-muted-foreground line-through">R$ {Number(store.plan_price).toFixed(2)}</span>
            )}
          </div>
        ) : (
          <span className="text-[12px] text-muted-foreground">—</span>
        )}

        {store.subscription_expires_at && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {new Date(store.subscription_expires_at).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <Button size="sm" variant="outline" className="h-7 text-[11px] border-border/50" onClick={onEdit}>
          <Edit className="h-3 w-3 mr-1" />
          Editar
        </Button>

        {isExpiredOrNear && store.plan_id && (
          <Button
            size="sm"
            variant={status.label === 'Expirado' ? 'destructive' : 'outline'}
            className="h-7 text-[11px]"
            onClick={handleQuickCharge}
            disabled={sendingCharge}
          >
            {sendingCharge ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Send className="h-3 w-3 mr-1" />
            )}
            Cobrar
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
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
  const [autoChargeStoreIds, setAutoChargeStoreIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSubscribers();
    fetchPlans();
    fetchAutoChargeConfigs();
  }, []);

  const fetchAutoChargeConfigs = async () => {
    const { data } = await supabase
      .from('subscription_billing_config')
      .select('store_id')
      .eq('auto_send_enabled', true)
      .not('store_id', 'is', null);
    
    if (data) {
      setAutoChargeStoreIds(new Set(data.map(c => c.store_id).filter(Boolean) as string[]));
    }
  };

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
          billing_contact_phone,
          billing_contact_name,
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
          billing_contact_phone: store.billing_contact_phone,
          billing_contact_name: store.billing_contact_name,
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
    <div className="space-y-8 p-4 md:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Assinantes</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Gerencie planos, cobranças e assinaturas dos donos de loja
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="h-9 px-4 text-[13px] shadow-sm">
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Novo Lojista
        </Button>
      </div>

      {/* Tabs de Navegação */}
      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="w-full sm:w-auto bg-muted/50 p-0.5">
          <TabsTrigger value="overview" className="flex-1 sm:flex-none text-[13px] data-[state=active]:shadow-sm">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex-1 sm:flex-none text-[13px] data-[state=active]:shadow-sm">
            Faturas & Aprovações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card, index) => {
          const IconComponent = card.icon;
          const isMRR = index === 3;
          return (
            <div
              key={index}
              className={`rounded-xl border bg-card p-4 transition-all hover:shadow-md ${isMRR ? 'ring-1 ring-primary/20' : ''}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isMRR ? 'bg-primary/10' : 'bg-muted'}`}>
                  <IconComponent className={`h-4 w-4 ${isMRR ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
              </div>
              <div className={`text-2xl font-bold tracking-tight ${isMRR ? 'text-primary' : 'text-foreground'}`}>
                {card.value}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">
                {card.title.replace(/^[^\s]+\s/, '')}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filters — compact horizontal bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-xl border bg-card p-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou loja..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-[13px] border-0 bg-muted/50 focus-visible:ring-1"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="h-9 w-[140px] text-[13px] bg-muted/50 border-0">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="expired">Expiradas</SelectItem>
              <SelectItem value="no_plan">Sem Plano</SelectItem>
            </SelectContent>
          </Select>

          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="h-9 w-[130px] text-[13px] bg-muted/50 border-0">
              <SelectValue placeholder="Plano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {plans.map(plan => (
                <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={userStatusFilter} onValueChange={(value: any) => setUserStatusFilter(value)}>
            <SelectTrigger className="h-9 w-[130px] text-[13px] bg-muted/50 border-0">
              <SelectValue placeholder="Usuário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="blocked">Bloqueados</SelectItem>
            </SelectContent>
          </Select>

          {(searchTerm || statusFilter !== 'all' || planFilter !== 'all' || userStatusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-[12px] text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPlanFilter('all');
                setUserStatusFilter('all');
              }}
            >
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Subscribers List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">{grouped.length} assinantes</h2>
            <p className="text-[12px] text-muted-foreground">{filteredSubscribers.length} lojas no total</p>
          </div>
        </div>

        {grouped.length === 0 ? (
          <div className="text-center py-16 rounded-xl border bg-card">
            <Store className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-[15px] font-medium text-foreground mb-1">Nenhum assinante encontrado</h3>
            <p className="text-[13px] text-muted-foreground">
              Tente ajustar os filtros ou termos de busca.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {grouped.map((group) => {
              const hasMultipleStores = group.stores.length > 1;
              const isExpanded = expandedUsers.has(group.userId);

              if (!hasMultipleStores) {
                const store = group.stores[0];
                const status = getSubscriptionStatus(store);
                return (
                  <div key={group.userId} className="group rounded-xl border bg-card overflow-hidden transition-all hover:shadow-md hover:border-border/80">
                    {/* User header */}
                    <div className="p-4 pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[14px] font-semibold text-foreground truncate">{group.fullName}</h3>
                          <p className="text-[12px] text-muted-foreground truncate mt-0.5">{group.email}</p>
                        </div>
                        {group.isBlocked && (
                          <span className="shrink-0 ml-2 inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                            Bloqueado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Store content */}
                    <div className="px-4 pb-4">
                      <StoreRow
                        store={store}
                        onEdit={() => setEditSubscriber(store)}
                        onModules={() => setModulesStore({ id: store.store_id, name: store.store_name })}
                        onBlock={() => setBlockUser({ id: store.id, full_name: store.full_name, email: store.email, is_blocked: store.is_blocked })}
                        onDelete={() => setDeleteUser({ id: store.id, full_name: store.full_name, email: store.email })}
                        hasAutoCharge={autoChargeStoreIds.has(store.store_id)}
                      />
                    </div>
                  </div>
                );
              }

              return (
                <div key={group.userId} className="group rounded-xl border bg-card overflow-hidden transition-all hover:shadow-md hover:border-border/80">
                  <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(group.userId)}>
                    <CollapsibleTrigger asChild>
                      <div className="p-4 pb-3 cursor-pointer hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-[14px] font-semibold text-foreground truncate">{group.fullName}</h3>
                              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                <Building2 className="w-3 h-3" />
                                {group.stores.length}
                              </span>
                            </div>
                            <p className="text-[12px] text-muted-foreground truncate mt-0.5">{group.email}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {group.isBlocked && (
                              <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                                Bloqueado
                              </span>
                            )}
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform" />
                            )}
                          </div>
                        </div>

                        {!isExpanded && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {group.stores.map(s => {
                              const st = getSubscriptionStatus(s);
                              const dotColor = st.label === 'Ativo' ? 'bg-emerald-500' : st.label === 'Expirado' ? 'bg-red-400' : st.label === 'Sem Plano' ? 'bg-gray-400' : 'bg-amber-400';
                              return (
                                <span key={s.store_id} className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-medium text-foreground/70">
                                  <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                                  {s.store_name}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-2.5">
                        {group.stores.map(store => (
                          <StoreRow
                            key={store.store_id}
                            store={store}
                            onEdit={() => setEditSubscriber(store)}
                            onModules={() => setModulesStore({ id: store.store_id, name: store.store_name })}
                            onBlock={() => setBlockUser({ id: store.id, full_name: store.full_name, email: store.email, is_blocked: store.is_blocked })}
                            onDelete={() => setDeleteUser({ id: store.id, full_name: store.full_name, email: store.email })}
                            hasAutoCharge={autoChargeStoreIds.has(store.store_id)}
                          />
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
        </TabsContent>

        <TabsContent value="invoices">
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-96">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          }>
            <SubscriptionPaymentsManagementPage />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubscribersPage;
