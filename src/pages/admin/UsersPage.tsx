import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { UserEditDialog } from '@/components/admin/UserEditDialog';
import { UserBlockDialog } from '@/components/admin/UserBlockDialog';
import { AdvancedDeleteUserModal } from '@/components/admin/AdvancedDeleteUserModal';
import { UserAuditLogDialog } from '@/components/admin/UserAuditLogDialog';
import { UserPasswordResetDialog } from '@/components/admin/UserPasswordResetDialog';
import { FixUserLoginDialog } from '@/components/admin/FixUserLoginDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Search, 
  Crown,
  Store,
  User as UserIcon,
  Mail,
  Calendar,
  Loader2,
  MoreHorizontal,
  Edit,
  Ban,
  Trash2,
  History,
  CheckCircle,
  Truck,
  ShoppingCart,
  UserX,
  Key,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Headphones,
  MessageCircle,
  Phone
} from 'lucide-react';
import { formatPhone } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface UnifiedUser {
  id: string;
  email: string;
  full_name: string | null;
  user_type: string;
  avatar_url?: string | null;
  phone?: string | null;
  whatsapp_valid?: boolean | null;
  created_at: string;
  updated_at: string;
  is_blocked: boolean;
  blocked_at?: string | null;
  blocked_reason?: string | null;
  is_deleted: boolean;
  deleted_at?: string | null;
  roles?: any[];
  customer_data?: any[];
  hasStore?: boolean;
}

const UsersPage = () => {
  const [users, setUsers] = useState<UnifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked' | 'deleted'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  const [editUser, setEditUser] = useState<UnifiedUser | null>(null);
  const [blockUser, setBlockUser] = useState<UnifiedUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<UnifiedUser | null>(null);
  const [auditUserId, setAuditUserId] = useState<string | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UnifiedUser | null>(null);
  const [fixLoginEmail, setFixLoginEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, itemsPerPage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let profileQuery = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter === 'active') {
        profileQuery = profileQuery.or('is_blocked.is.null,is_blocked.eq.false').or('is_deleted.is.null,is_deleted.eq.false');
      } else if (statusFilter === 'blocked') {
        profileQuery = profileQuery.eq('is_blocked', true);
      } else if (statusFilter === 'deleted') {
        profileQuery = profileQuery.eq('is_deleted', true);
      }

      const { data: profiles, error: profileError } = await profileQuery;

      if (profileError) {
        console.error('❌ Erro ao buscar profiles:', profileError);
        throw profileError;
      }

      if (!profiles || profiles.length === 0) {
        console.warn('⚠️ Nenhum profile encontrado');
        setUsers([]);
        return;
      }

      const userIds = profiles.map(p => p.id);
      let rolesMap: Record<string, any[]> = {};

      try {
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select(`id, role, store_id, user_id, stores (id, name, logo_url)`)
          .in('user_id', userIds);

        if (!rolesError && roles) {
          roles.forEach((role: any) => {
            const embeddedStore = Array.isArray(role.stores) ? role.stores[0] : role.stores;
            if (!rolesMap[role.user_id]) rolesMap[role.user_id] = [];
            rolesMap[role.user_id].push({
              id: role.id, role: role.role, store_id: role.store_id,
              store_name: embeddedStore?.name, store_logo: embeddedStore?.logo_url,
            });
          });

          const storeIdsToFetch = Array.from(
            new Set(
              Object.values(rolesMap).flat()
                .filter((r: any) => !!r.store_id && (!r.store_name || !r.store_logo))
                .map((r: any) => r.store_id)
            )
          );

          if (storeIdsToFetch.length > 0) {
            const { data: storesData, error: storesDataError } = await supabase
              .from('stores').select('id, name, logo_url').in('id', storeIdsToFetch);
            if (!storesDataError && storesData) {
              const storeLookup = storesData.reduce<Record<string, { name: string; logo_url: string | null }>>((acc, store) => {
                acc[store.id] = { name: store.name, logo_url: store.logo_url };
                return acc;
              }, {});
              Object.values(rolesMap).forEach((rolesArr: any[]) => {
                rolesArr.forEach((r: any) => {
                  if (!r.store_id) return;
                  const store = storeLookup[r.store_id];
                  if (!store) return;
                  if (!r.store_name) r.store_name = store.name;
                  if (!r.store_logo && store.logo_url) r.store_logo = store.logo_url;
                });
              });
            }
          }
        }
      } catch (rolesErr) {
        console.warn('⚠️ Erro ao buscar roles (não crítico):', rolesErr);
      }

      let storeOwnersSet: Set<string> = new Set();
      try {
        const { data: stores, error: storesError } = await supabase
          .from('stores').select('owner_id').not('owner_id', 'is', null);
        if (!storesError && stores) {
          stores.forEach((store) => { if (store.owner_id) storeOwnersSet.add(store.owner_id); });
        }
      } catch (storesErr) {
        console.warn('⚠️ Erro ao buscar stores (não crítico):', storesErr);
      }

      let customersPhoneMap: Record<string, string> = {};
      try {
        const { data: customers, error: customersError } = await supabase
          .from('customers').select('auth_user_id, phone').not('auth_user_id', 'is', null);
        if (!customersError && customers) {
          customers.forEach((customer) => {
            if (customer.auth_user_id && customer.phone) customersPhoneMap[customer.auth_user_id] = customer.phone;
          });
        }
      } catch (customersErr) {
        console.warn('⚠️ Erro ao buscar customers (não crítico):', customersErr);
      }

      const transformedData = profiles.map(profile => ({
        ...profile,
        phone: profile.phone || customersPhoneMap[profile.id] || null,
        roles: rolesMap[profile.id] || [],
        hasStore: storeOwnersSet.has(profile.id),
      }));

      setUsers(transformedData as UnifiedUser[]);
    } catch (error: any) {
      console.error('❌ Erro geral ao buscar usuários:', error);
      toast.error(`Erro ao carregar usuários: ${error.message || 'Desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeInfo = (user: UnifiedUser) => {
    if (user.is_deleted) return { label: 'Excluído', variant: 'secondary' as const, icon: UserX, color: 'text-muted-foreground', dotColor: 'bg-muted-foreground' };
    if (user.is_blocked) return { label: 'Bloqueado', variant: 'destructive' as const, icon: Ban, color: 'text-destructive', dotColor: 'bg-destructive' };
    if (user.user_type === 'master_admin') return { label: 'Super Admin', variant: 'default' as const, icon: Crown, color: 'text-purple-500', dotColor: 'bg-purple-500' };
    
    const hasSalesperson = user.roles?.some(r => r.role === 'salesperson');
    const hasAttendant = user.roles?.some(r => r.role === 'attendant');
    const hasDeliveryDriver = user.roles?.some(r => r.role === 'delivery_driver');
    const hasCustomer = user.roles?.some(r => r.role === 'customer');

    if (hasSalesperson) return { label: 'Vendedor', variant: 'outline' as const, icon: Briefcase, color: 'text-yellow-500', dotColor: 'bg-yellow-500' };
    if (hasAttendant) return { label: 'Atendente', variant: 'outline' as const, icon: Headphones, color: 'text-teal-500', dotColor: 'bg-teal-500' };
    if (hasDeliveryDriver) return { label: 'Entregador', variant: 'outline' as const, icon: Truck, color: 'text-orange-500', dotColor: 'bg-orange-500' };
    if (user.user_type === 'store_admin' && user.hasStore) return { label: 'Dono de Loja', variant: 'default' as const, icon: Store, color: 'text-blue-500', dotColor: 'bg-blue-500' };
    if (hasCustomer) return { label: 'Cliente', variant: 'outline' as const, icon: ShoppingCart, color: 'text-green-500', dotColor: 'bg-green-500' };
    return { label: 'Usuário', variant: 'secondary' as const, icon: UserIcon, color: 'text-muted-foreground', dotColor: 'bg-muted-foreground' };
  };

  const filteredUsers = users.filter(user => {
    const hasDeliveryDriver = user.roles?.some(r => r.role === 'delivery_driver');
    const hasCustomer = user.roles?.some(r => r.role === 'customer');
    const hasSalesperson = user.roles?.some(r => r.role === 'salesperson');
    const hasAttendant = user.roles?.some(r => r.role === 'attendant');
    const isMasterAdmin = user.user_type === 'master_admin';
    const isStoreOwner = user.user_type === 'store_admin' && user.hasStore;
    const isOnlyCustomer = hasCustomer && !isMasterAdmin && !isStoreOwner && !hasDeliveryDriver && !hasSalesperson && !hasAttendant;
    
    if (isOnlyCustomer && typeFilter !== 'customer') return false;

    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesType = true;
    if (typeFilter !== 'all') {
      if (typeFilter === 'master_admin') matchesType = user.user_type === 'master_admin';
      else if (typeFilter === 'store_admin') matchesType = user.user_type === 'store_admin' && user.hasStore;
      else if (typeFilter === 'delivery_driver') matchesType = user.roles?.some(r => r.role === 'delivery_driver') || false;
      else if (typeFilter === 'salesperson') matchesType = hasSalesperson;
      else if (typeFilter === 'attendant') matchesType = hasAttendant;
      else if (typeFilter === 'customer') matchesType = isOnlyCustomer;
    }
    
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const startIndex = filteredUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredUsers.length);

  const kpis = [
    { label: 'Total', value: users.filter(u => !u.is_deleted).length, icon: Users, color: 'text-primary' },
    { label: 'Ativos', value: users.filter(u => !u.is_blocked && !u.is_deleted).length, icon: CheckCircle, color: 'text-green-500' },
    { label: 'Bloqueados', value: users.filter(u => u.is_blocked).length, icon: Ban, color: 'text-destructive' },
    { label: 'Lojas', value: users.filter(u => u.user_type === 'store_admin' && u.hasStore).length, icon: Store, color: 'text-blue-500' },
    { label: 'Vendedores', value: users.filter(u => u.roles?.some(r => r.role === 'salesperson')).length, icon: Briefcase, color: 'text-yellow-500' },
    { label: 'Atendentes', value: users.filter(u => u.roles?.some(r => r.role === 'attendant')).length, icon: Headphones, color: 'text-teal-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 md:p-4 lg:p-6 space-y-4">
      {/* Header + KPIs inline */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-foreground">Usuários</h1>
              <p className="text-xs text-muted-foreground">{users.filter(u => !u.is_deleted).length} cadastrados</p>
            </div>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
                <Icon className={`h-4 w-4 ${kpi.color} shrink-0`} />
                <div className="min-w-0">
                  <div className="text-base md:text-lg font-bold text-foreground leading-none">{kpi.value}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{kpi.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filtros inline */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9 bg-card border-border text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-[120px] h-9 text-xs bg-card">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="blocked">Bloqueados</SelectItem>
              <SelectItem value="deleted">Excluídos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px] h-9 text-xs bg-card">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="master_admin">Master</SelectItem>
              <SelectItem value="store_admin">Lojista</SelectItem>
              <SelectItem value="attendant">Atendente</SelectItem>
              <SelectItem value="delivery_driver">Entregador</SelectItem>
              <SelectItem value="salesperson">Vendedor</SelectItem>
              <SelectItem value="customer">Cliente</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(itemsPerPage)} onValueChange={(value) => setItemsPerPage(Number(value))}>
            <SelectTrigger className="w-[90px] h-9 text-xs bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10/pág</SelectItem>
              <SelectItem value="20">20/pág</SelectItem>
              <SelectItem value="50">50/pág</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resultado info */}
      {filteredUsers.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {startIndex}–{endIndex} de {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Grid de usuários */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-foreground">Nenhum usuário encontrado</p>
          <p className="text-xs text-muted-foreground mt-1">Tente ajustar os filtros</p>
        </div>
      ) : (
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {paginatedUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              userTypeInfo={getUserTypeInfo(user)}
              onEdit={() => setEditUser(user)}
              onBlock={() => setBlockUser(user)}
              onDelete={() => setDeleteUser(user)}
              onAudit={() => setAuditUserId(user.id)}
              onResetPassword={() => setResetPasswordUser(user)}
              onFixLogin={() => setFixLoginEmail(user.email)}
            />
          ))}
        </div>
      )}

      {/* Paginação */}
      {filteredUsers.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Pág. {currentPage}/{totalPages}
          </p>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 px-2">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages <= 3 ? totalPages : 3, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 3) pageNum = i + 1;
              else if (currentPage <= 2) pageNum = i + 1;
              else if (currentPage >= totalPages - 1) pageNum = totalPages - 2 + i;
              else pageNum = currentPage - 1 + i;
              return (
                <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" className="w-8 h-8 p-0 text-xs" onClick={() => setCurrentPage(pageNum)}>
                  {pageNum}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 px-2">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs - mantidos exatamente iguais */}
      <UserEditDialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)} user={editUser} onSuccess={fetchUsers} />
      <UserBlockDialog open={!!blockUser} onOpenChange={(open) => !open && setBlockUser(null)} user={blockUser} onSuccess={fetchUsers} />
      <AdvancedDeleteUserModal
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
        user={deleteUser ? {
          id: deleteUser.id,
          full_name: deleteUser.full_name || deleteUser.email,
          email: deleteUser.email,
          store_name: deleteUser.roles?.find((r: any) => r.role === 'store_admin')?.store_name
        } : null}
        onSuccess={fetchUsers}
      />
      <UserAuditLogDialog open={!!auditUserId} onOpenChange={(open) => !open && setAuditUserId(null)} userId={auditUserId} />
      <UserPasswordResetDialog
        open={!!resetPasswordUser}
        onOpenChange={(open) => !open && setResetPasswordUser(null)}
        userId={resetPasswordUser?.id || ''}
        userEmail={resetPasswordUser?.email || ''}
        userName={resetPasswordUser?.full_name || resetPasswordUser?.email || ''}
        userPhone={resetPasswordUser?.phone}
      />
      <FixUserLoginDialog open={!!fixLoginEmail} onOpenChange={(open) => !open && setFixLoginEmail(null)} userEmail={fixLoginEmail || undefined} />
    </div>
  );
};

/* ─── User Card Component ─── */
function UserCard({ user, userTypeInfo, onEdit, onBlock, onDelete, onAudit, onResetPassword, onFixLogin }: {
  user: UnifiedUser;
  userTypeInfo: { label: string; variant: any; icon: any; color: string; dotColor: string };
  onEdit: () => void;
  onBlock: () => void;
  onDelete: () => void;
  onAudit: () => void;
  onResetPassword: () => void;
  onFixLogin: () => void;
}) {
  const TypeIcon = userTypeInfo.icon;
  const isSalesperson = user.roles?.some(r => r.role === 'salesperson');

  return (
    <Card className={`group hover:border-primary/30 transition-all ${
      isSalesperson ? 'border-yellow-500/30 bg-yellow-500/5' : 'bg-card'
    } ${user.is_blocked ? 'opacity-70' : ''}`}>
      <CardContent className="p-3">
        {/* Top row: avatar + info + menu */}
        <div className="flex items-start gap-2.5">
          {/* Avatar */}
          {user.avatar_url ? (
            <img 
              src={user.avatar_url} 
              alt={user.full_name || 'Avatar'}
              className="w-9 h-9 rounded-full object-cover border-2 border-border shrink-0"
            />
          ) : (
            <div className={`w-9 h-9 rounded-full flex items-center justify-center bg-muted shrink-0 ${userTypeInfo.color}`}>
              <TypeIcon className="w-4 h-4" />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="font-semibold text-sm text-foreground truncate">
                {user.full_name || 'Sem nome'}
              </h3>
              <Badge variant={userTypeInfo.variant} className="text-[10px] h-[18px] px-1.5 shrink-0">
                {userTypeInfo.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <Mail className="w-3 h-3 shrink-0" />
              {user.email}
            </p>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onEdit}><Edit className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
              <DropdownMenuItem onClick={onResetPassword}><Key className="h-4 w-4 mr-2" />Resetar Senha</DropdownMenuItem>
              <DropdownMenuItem onClick={onFixLogin}><Wrench className="h-4 w-4 mr-2" />Diagnosticar Login</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onBlock}>
                {user.is_blocked ? <><CheckCircle className="h-4 w-4 mr-2" />Desbloquear</> : <><Ban className="h-4 w-4 mr-2" />Bloquear</>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />Exclusão Avançada
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onAudit}><History className="h-4 w-4 mr-2" />Ver Histórico</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {new Date(user.created_at).toLocaleDateString('pt-BR')}
          </div>
          {user.phone ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-help">
                    <MessageCircle className={`w-3 h-3 ${user.whatsapp_valid ? 'text-green-500' : ''}`} />
                    {formatPhone(user.phone)}
                  </div>
                </TooltipTrigger>
                <TooltipContent><p>{user.whatsapp_valid ? 'WhatsApp válido' : 'WhatsApp não validado'}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
              <Phone className="w-3 h-3" /> Sem tel.
            </span>
          )}
        </div>

        {/* Roles extras */}
        {user.roles && user.roles.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {user.roles
              .filter((role: any) => {
                if (role.role === 'master_admin' && user.user_type === 'master_admin') return false;
                if (role.role === 'store_admin' && user.user_type === 'store_admin' && !role.store_id) return false;
                return true;
              })
              .slice(0, 3)
              .map((role: any, idx: number) => (
                <div key={idx} className="flex items-center gap-1">
                  {role.store_logo && (
                    <img src={role.store_logo} alt={role.store_name || 'Loja'} className="w-4 h-4 rounded-full object-cover border border-border" />
                  )}
                  <Badge variant="outline" className="text-[9px] h-[16px] px-1">
                    {role.role === 'professional' ? 'Prof.' :
                     role.role === 'delivery_driver' ? 'Entreg.' : 
                     role.role === 'salesperson' ? 'Vend.' : 
                     role.role === 'attendant' ? 'Atend.' : 
                     role.role === 'store_admin' ? 'Lojista' : 
                     role.role === 'master_admin' ? '👑' : 
                     role.role === 'admin' ? '🛡️' : 
                     role.role === 'moderator' ? '🔧' : 
                     role.role === 'customer' ? 'Cliente' : role.role}
                    {role.store_name && <span className="hidden sm:inline ml-0.5">· {role.store_name}</span>}
                  </Badge>
                </div>
              ))}
            {user.roles.filter((role: any) => {
              if (role.role === 'master_admin' && user.user_type === 'master_admin') return false;
              if (role.role === 'store_admin' && user.user_type === 'store_admin' && !role.store_id) return false;
              return true;
            }).length > 3 && (
              <Badge variant="outline" className="text-[9px] h-[16px] px-1">
                +{user.roles.filter((role: any) => {
                  if (role.role === 'master_admin' && user.user_type === 'master_admin') return false;
                  if (role.role === 'store_admin' && user.user_type === 'store_admin' && !role.store_id) return false;
                  return true;
                }).length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Blocked reason */}
        {user.blocked_reason && (
          <p className="text-[10px] text-destructive mt-1.5 line-clamp-1">⚠ {user.blocked_reason}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default UsersPage;
