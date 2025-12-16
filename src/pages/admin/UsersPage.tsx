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
  ChevronRight,
  Briefcase
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
    const hasSalesperson = user.roles?.some(r => r.role === 'salesperson');

    // Vendedor (alta prioridade)
    if (hasSalesperson) {
      return {
        label: 'Vendedor',
        variant: 'outline' as const,
        icon: Briefcase,
        color: 'text-yellow-600'
      };
    }

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
    const hasSalesperson = user.roles?.some(r => r.role === 'salesperson');
    const isMasterAdmin = user.user_type === 'master_admin';
    const isStoreOwner = user.user_type === 'store_admin' && user.hasStore;
    
    // Se é APENAS cliente (não é admin, não é dono de loja, não é entregador, não é vendedor)
    const isOnlyCustomer = hasCustomer && !isMasterAdmin && !isStoreOwner && !hasDeliveryDriver && !hasSalesperson;
    
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
      } else if (typeFilter === 'salesperson') {
        matchesType = hasSalesperson;
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
      title: 'Total',
      value: users.filter(u => !u.is_deleted).length,
      description: 'Ativos + bloqueados',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Ativos',
      value: users.filter(u => !u.is_blocked && !u.is_deleted).length,
      description: 'Com acesso',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Bloqueados',
      value: users.filter(u => u.is_blocked).length,
      description: 'Sem acesso',
      icon: Ban,
      color: 'text-red-600'
    },
    {
      title: 'Lojas',
      value: users.filter(u => u.user_type === 'store_admin' && u.hasStore).length,
      description: 'Donos de loja',
      icon: Store,
      color: 'text-blue-600'
    },
    {
      title: 'Vendedores',
      value: users.filter(u => u.roles?.some(r => r.role === 'salesperson')).length,
      description: 'Afiliados',
      icon: Briefcase,
      color: 'text-yellow-600'
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
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          <span className="hidden sm:inline">Gerenciar </span>Usuários
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-2">
          <span className="hidden sm:inline">Visualize, edite e gerencie todos os usuários da plataforma</span>
          <span className="sm:hidden">Gerencie todos os usuários</span>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-2 md:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {statsCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Card key={index} className="p-3 md:p-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-1 md:pb-2">
                <CardTitle className="text-xs md:text-sm font-medium truncate">
                  {card.title}
                </CardTitle>
                <IconComponent className={`h-3.5 w-3.5 md:h-4 md:w-4 ${card.color} shrink-0`} />
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-xl md:text-2xl font-bold">{card.value}</div>
                <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
          <CardTitle className="text-sm md:text-lg flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 md:h-10 text-sm"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              <div className="space-y-1 md:space-y-2">
                <label className="text-xs md:text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm">
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

              <div className="space-y-1 md:space-y-2">
                <label className="text-xs md:text-sm font-medium">Tipo</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="master_admin">Master</SelectItem>
                    <SelectItem value="store_admin">Lojista</SelectItem>
                    <SelectItem value="delivery_driver">Entregador</SelectItem>
                    <SelectItem value="salesperson">Vendedor</SelectItem>
                    <SelectItem value="customer">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 md:space-y-2">
                <label className="text-xs md:text-sm font-medium">Exibir</label>
                <Select value={String(itemsPerPage)} onValueChange={(value) => setItemsPerPage(Number(value))}>
                  <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm">
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
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
          <CardTitle className="text-sm md:text-lg">Lista de Usuários ({filteredUsers.length})</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            {filteredUsers.length > 0 
              ? `Mostrando ${startIndex}-${endIndex} de ${filteredUsers.length}`
              : 'Nenhum usuário encontrado'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-6 md:py-8">
              <Users className="mx-auto h-10 w-10 md:h-12 md:w-12 text-muted-foreground mb-3 md:mb-4" />
              <h3 className="text-base md:text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Tente ajustar os filtros ou termos de busca.
              </p>
            </div>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {paginatedUsers.map((user) => {
                const userTypeInfo = getUserTypeInfo(user);
                const TypeIcon = userTypeInfo.icon;
                const isSalesperson = user.roles?.some(r => r.role === 'salesperson');

                return (
                  <div
                    key={user.id}
                    className={`flex flex-col gap-2 md:gap-3 p-3 md:p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                      isSalesperson ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : ''
                    }`}
                  >
                    {/* Header: Ícone + Nome + Badge + Ações */}
                    <div className="flex items-start gap-2 md:gap-3">
                      <div className={`p-1.5 md:p-2 rounded-full bg-muted ${userTypeInfo.color} shrink-0`}>
                        <TypeIcon className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm md:text-base truncate">
                            {user.full_name || 'Nome não informado'}
                          </h4>
                          <Badge variant={userTypeInfo.variant} className="text-[10px] md:text-xs shrink-0">
                            {userTypeInfo.label}
                          </Badge>
                        </div>
                        
                        {/* Email e Data */}
                        <div className="flex flex-col text-xs md:text-sm text-muted-foreground mt-1 gap-0.5">
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>{new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Ações */}
                      <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
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
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                    
                    {/* Roles Extras - Scroll Horizontal */}
                    {user.roles && user.roles.length > 0 && (
                      <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
                        <div className="flex gap-1.5 pb-1">
                          {user.roles.map((role: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-[10px] md:text-xs shrink-0">
                              {role.role === 'delivery_driver' ? 'Entregador' : 
                               role.role === 'salesperson' ? 'Vendedor' : 'Cliente'}
                              {role.store_name && (
                                <span className="hidden sm:inline ml-1">({role.store_name})</span>
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Motivo do bloqueio */}
                    {user.blocked_reason && (
                      <p className="text-xs text-destructive line-clamp-2">
                        Motivo: {user.blocked_reason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Controles de Paginação */}
          {filteredUsers.length > 0 && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 md:mt-6 pt-3 md:pt-4 border-t">
              <p className="text-xs md:text-sm text-muted-foreground order-2 sm:order-1">
                Pág. {currentPage}/{totalPages}
              </p>
              
              <div className="flex items-center gap-1.5 md:gap-2 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2 md:px-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Anterior</span>
                </Button>
                
                {/* Números de página - Menos no mobile */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages <= 3 ? totalPages : 3, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage <= 2) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 1) {
                      pageNum = totalPages - 2 + i;
                    } else {
                      pageNum = currentPage - 1 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0 text-xs md:text-sm"
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
                  className="h-8 px-2 md:px-3"
                >
                  <span className="hidden sm:inline mr-1">Próximo</span>
                  <ChevronRight className="h-4 w-4" />
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
