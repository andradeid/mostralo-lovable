import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ImpersonationButton } from '@/components/admin/ImpersonationButton';
import { UserEditDialog } from '@/components/admin/UserEditDialog';
import { UserBlockDialog } from '@/components/admin/UserBlockDialog';
import { UserDeleteDialog } from '@/components/admin/UserDeleteDialog';
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
  MoreVertical,
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
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

interface UnifiedUser {
  id: string;
  email: string;
  full_name: string | null;
  user_type: string;
  avatar_url?: string | null;
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
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
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
      console.log('🔍 Iniciando busca de usuários...');
      console.log('🔐 Usuário atual:', (await supabase.auth.getUser()).data.user?.id);
      
      // 1ª CHAMADA: Buscar perfis (sem joins)
      let profileQuery = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtro de status
      if (statusFilter === 'active') {
        profileQuery = profileQuery.or('is_blocked.is.null,is_blocked.eq.false').or('is_deleted.is.null,is_deleted.eq.false');
      } else if (statusFilter === 'blocked') {
        profileQuery = profileQuery.eq('is_blocked', true);
      } else if (statusFilter === 'deleted') {
        profileQuery = profileQuery.eq('is_deleted', true);
      }

      const { data: profiles, error: profileError } = await profileQuery;

      console.log('📊 Profiles retornados:', profiles?.length || 0);
      console.log('📝 Profiles data:', profiles);
      console.log('❌ Profile error:', profileError);

      if (profileError) {
        console.error('❌ Erro ao buscar profiles:', profileError);
        throw profileError;
      }

      if (!profiles || profiles.length === 0) {
        console.warn('⚠️ Nenhum profile encontrado');
        setUsers([]);
        return;
      }

      // 2ª CHAMADA: Buscar roles em lote (opcional, resiliente)
      const userIds = profiles.map(p => p.id);
      console.log('🔑 User IDs para buscar roles:', userIds);
      
      let rolesMap: Record<string, any[]> = {};

      try {
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select(`
            id,
            role,
            store_id,
            user_id,
            stores (
              name
            )
          `)
          .in('user_id', userIds);

        console.log('👥 Roles retornados:', roles?.length || 0);
        console.log('📝 Roles data:', roles);
        console.log('❌ Roles error:', rolesError);

        if (!rolesError && roles) {
          // Agrupar roles por user_id
          roles.forEach((role) => {
            if (!rolesMap[role.user_id]) {
              rolesMap[role.user_id] = [];
            }
            rolesMap[role.user_id].push({
              id: role.id,
              role: role.role,
              store_id: role.store_id,
              store_name: role.stores?.name,
            });
          });
        } else {
          console.warn('⚠️ Não foi possível carregar roles:', rolesError);
        }
      } catch (rolesErr) {
        console.warn('⚠️ Erro ao buscar roles (não crítico):', rolesErr);
      }

      // 3ª CHAMADA: Buscar lojas reais (para identificar donos verdadeiros)
      let storeOwnersSet: Set<string> = new Set();

      try {
        const { data: stores, error: storesError } = await supabase
          .from('stores')
          .select('owner_id')
          .not('owner_id', 'is', null);

        console.log('🏪 Stores retornadas:', stores?.length || 0);

        if (!storesError && stores) {
          stores.forEach((store) => {
            if (store.owner_id) {
              storeOwnersSet.add(store.owner_id);
            }
          });
        }
      } catch (storesErr) {
        console.warn('⚠️ Erro ao buscar stores (não crítico):', storesErr);
      }

      console.log('👔 Donos de loja reais:', Array.from(storeOwnersSet));

      // Merge dos dados
      const transformedData = profiles.map(profile => ({
        ...profile,
        roles: rolesMap[profile.id] || [],
        hasStore: storeOwnersSet.has(profile.id),
      }));

      console.log('✅ Dados transformados:', transformedData);
      setUsers(transformedData as UnifiedUser[]);
    } catch (error: any) {
      console.error('❌ Erro geral ao buscar usuários:', error);
      toast.error(`Erro ao carregar usuários: ${error.message || 'Desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeInfo = (user: UnifiedUser) => {
    // 1. Status de sistema (prioridade máxima)
    if (user.is_deleted) {
      return {
        label: 'Excluído',
        variant: 'secondary' as const,
        icon: UserX,
        color: 'text-gray-600'
      };
    }

    if (user.is_blocked) {
      return {
        label: 'Bloqueado',
        variant: 'destructive' as const,
        icon: Ban,
        color: 'text-red-600'
      };
    }

    // 2. Master Admin (máxima prioridade de tipo)
    if (user.user_type === 'master_admin') {
      return {
        label: 'Super Admin',
        variant: 'default' as const,
        icon: Crown,
        color: 'text-purple-600'
      };
    }

    // 3. Verificar roles específicos (ANTES de verificar store_admin)
    const hasDeliveryDriver = user.roles?.some(r => r.role === 'delivery_driver');
    const hasCustomer = user.roles?.some(r => r.role === 'customer');

    if (hasDeliveryDriver) {
      return {
        label: 'Entregador',
        variant: 'outline' as const,
        icon: Truck,
        color: 'text-orange-600'
      };
    }

    // 4. Dono de Loja (só se realmente tiver uma loja)
    if (user.user_type === 'store_admin' && user.hasStore) {
      return {
        label: 'Dono de Loja',
        variant: 'default' as const,
        icon: Store,
        color: 'text-blue-600'
      };
    }

    // 5. Cliente (baixa prioridade)
    if (hasCustomer) {
      return {
        label: 'Cliente',
        variant: 'outline' as const,
        icon: ShoppingCart,
        color: 'text-green-600'
      };
    }

    // 6. Usuário genérico (fallback)
    return {
      label: 'Usuário',
      variant: 'secondary' as const,
      icon: UserIcon,
      color: 'text-gray-600'
    };
  };

  const filteredUsers = users.filter(user => {
    const hasDeliveryDriver = user.roles?.some(r => r.role === 'delivery_driver');
    const hasCustomer = user.roles?.some(r => r.role === 'customer');
    const isMasterAdmin = user.user_type === 'master_admin';
    const isStoreOwner = user.user_type === 'store_admin' && user.hasStore;
    
    // Se é APENAS cliente (não é admin, não é dono de loja, não é entregador)
    const isOnlyCustomer = hasCustomer && !isMasterAdmin && !isStoreOwner && !hasDeliveryDriver;
    
    // Só excluir clientes SE o filtro NÃO for "customer"
    if (isOnlyCustomer && typeFilter !== 'customer') {
      return false; // Não mostrar clientes quando filtro não é específico para eles
    }

    // FILTRO 2: Busca por texto
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // FILTRO 3: Tipo de usuário
    let matchesType = true;
    if (typeFilter !== 'all') {
      if (typeFilter === 'master_admin') {
        matchesType = user.user_type === 'master_admin';
      } else if (typeFilter === 'store_admin') {
        matchesType = user.user_type === 'store_admin' && user.hasStore;
      } else if (typeFilter === 'delivery_driver') {
        matchesType = user.roles?.some(r => r.role === 'delivery_driver') || false;
      } else if (typeFilter === 'customer') {
        // Cliente: deve ter role 'customer' e ser "apenas cliente"
        matchesType = isOnlyCustomer;
      }
    }
    
    return matchesSearch && matchesType;
  });

  // Paginação
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const startIndex = filteredUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredUsers.length);

  const statsCards = [
    {
      title: 'Total de Usuários',
      value: users.filter(u => !u.is_deleted).length,
      description: 'Usuários ativos e bloqueados',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Usuários Ativos',
      value: users.filter(u => !u.is_blocked && !u.is_deleted).length,
      description: 'Com acesso ao sistema',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Bloqueados',
      value: users.filter(u => u.is_blocked).length,
      description: 'Sem acesso temporário',
      icon: Ban,
      color: 'text-red-600'
    },
    {
      title: 'Donos de Loja',
      value: users.filter(u => u.user_type === 'store_admin' && u.hasStore).length,
      description: 'Com lojas ativas',
      icon: Store,
      color: 'text-blue-600'
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gerenciar Usuários</h1>
        <p className="text-muted-foreground mt-2">
          Visualize, edite e gerencie todos os usuários da plataforma
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <div className="text-2xl font-bold">{card.value}</div>
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
                placeholder="Buscar por email ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="blocked">Bloqueados</SelectItem>
                    <SelectItem value="deleted">Excluídos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="master_admin">Master Admin</SelectItem>
                    <SelectItem value="store_admin">Dono de Loja</SelectItem>
                    <SelectItem value="delivery_driver">Entregador</SelectItem>
                    <SelectItem value="customer">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Exibir</label>
                <Select value={String(itemsPerPage)} onValueChange={(value) => setItemsPerPage(Number(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 por página</SelectItem>
                    <SelectItem value="20">20 por página</SelectItem>
                    <SelectItem value="50">50 por página</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários ({filteredUsers.length})</CardTitle>
          <CardDescription>
            {filteredUsers.length > 0 
              ? `Mostrando ${startIndex}-${endIndex} de ${filteredUsers.length} usuários`
              : 'Nenhum usuário encontrado'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros ou termos de busca.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedUsers.map((user) => {
                const userTypeInfo = getUserTypeInfo(user);
                const TypeIcon = userTypeInfo.icon;

                return (
                  <div
                    key={user.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`p-2 rounded-full bg-muted ${userTypeInfo.color} shrink-0`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <h4 className="font-semibold truncate">
                            {user.full_name || 'Nome não informado'}
                          </h4>
                          <Badge variant={userTypeInfo.variant}>
                            {userTypeInfo.label}
                          </Badge>
                          {user.roles && user.roles.length > 0 && (
                            user.roles.map((role: any, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {role.role === 'delivery_driver' ? 'Entregador' : 'Cliente'}
                                {role.store_name && ` (${role.store_name})`}
                              </Badge>
                            ))
                          )}
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 text-sm text-muted-foreground mt-1 gap-1">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>
                              {new Date(user.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>

                        {user.blocked_reason && (
                          <p className="text-xs text-destructive mt-1">
                            Motivo: {user.blocked_reason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!user.is_blocked && !user.is_deleted && (
                        <ImpersonationButton 
                          user={{
                            id: user.id,
                            email: user.email,
                            full_name: user.full_name || '',
                            user_type: user.user_type,
                            roles: user.roles,
                            avatar_url: user.avatar_url || undefined
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
                          <DropdownMenuItem onClick={() => setEditUser(user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => setResetPasswordUser(user)}>
                            <Key className="h-4 w-4 mr-2" />
                            Resetar Senha
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => setFixLoginEmail(user.email)}>
                            <Wrench className="h-4 w-4 mr-2" />
                            Diagnosticar Login
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={() => setBlockUser(user)}>
                            {user.is_blocked ? (
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
                          
                          {!user.is_deleted && (
                            <DropdownMenuItem onClick={() => setDeleteUser(user)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={() => setAuditUserId(user.id)}>
                            <History className="h-4 w-4 mr-2" />
                            Ver Histórico
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Controles de Paginação */}
          {filteredUsers.length > 0 && totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                
                {/* Números de página */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className="w-9 h-9 p-0"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <UserEditDialog
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
        user={editUser}
        onSuccess={fetchUsers}
      />

      <UserBlockDialog
        open={!!blockUser}
        onOpenChange={(open) => !open && setBlockUser(null)}
        user={blockUser}
        onSuccess={fetchUsers}
      />

      <UserDeleteDialog
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
        user={deleteUser}
        onSuccess={fetchUsers}
      />

      <UserAuditLogDialog
        open={!!auditUserId}
        onOpenChange={(open) => !open && setAuditUserId(null)}
        userId={auditUserId}
      />

      <UserPasswordResetDialog
        open={!!resetPasswordUser}
        onOpenChange={(open) => !open && setResetPasswordUser(null)}
        userId={resetPasswordUser?.id || ''}
        userEmail={resetPasswordUser?.email || ''}
        userName={resetPasswordUser?.full_name || resetPasswordUser?.email || ''}
      />

      <FixUserLoginDialog
        open={!!fixLoginEmail}
        onOpenChange={(open) => !open && setFixLoginEmail(null)}
        userEmail={fixLoginEmail || undefined}
      />
    </div>
  );
};

export default UsersPage;
