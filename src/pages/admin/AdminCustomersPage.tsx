import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Search, KeyRound, Phone, Mail, MapPin, Calendar, ShoppingBag, Tags, Users, UserPlus, Loader2, Eye, Pencil } from 'lucide-react';
import { formatPhone } from '@/lib/utils';
import { useCustomerLabels, useCustomerLabelAssignments } from '@/hooks/useCustomerLabels';
import { CustomerLabelBadge } from '@/components/customers/CustomerLabelBadge';
import { LabelFilterDropdown } from '@/components/customers/LabelFilterDropdown';
import { LeadsList } from '@/components/customers/LeadsList';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useAuth } from '@/hooks/use-auth';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  auth_user_id: string | null;
  created_at: string;
  order_count?: number;
  booking_count?: number;
}

// Componente separado para a lista de clientes com etiquetas
function CustomerList({ 
  customers, 
  storeId,
  onResetPassword 
}: { 
  customers: Customer[]; 
  storeId?: string | null;
  onResetPassword: (customer: Customer) => void;
}) {
  const customerIds = useMemo(() => customers.map(c => c.id), [customers]);
  const { assignments } = useCustomerLabelAssignments(customerIds, storeId);

  if (customers.length === 0) return null;

  return (
    <div className="grid gap-4">
      {customers.map((customer) => {
        const customerLabels = assignments[customer.id] || [];
        
        return (
          <Card key={customer.id}>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3 flex-1 min-w-0">
                  {/* Nome e badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{customer.name}</h3>
                    {customer.auth_user_id ? (
                      <Badge variant="default" className="bg-green-600 shrink-0">
                        ✓ Com Senha
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-orange-600 text-white shrink-0">
                        ⚠ Sem Senha
                      </Badge>
                    )}
                  </div>

                  {/* Etiquetas do cliente */}
                  {customerLabels.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {customerLabels.map((label) => (
                        <CustomerLabelBadge
                          key={label.id}
                          name={label.name}
                          color={label.color}
                        />
                      ))}
                    </div>
                  )}

                  {/* Informações do cliente */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span className="truncate">{formatPhone(customer.phone)}</span>
                    </div>

                    {customer.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}

                    {customer.address && (
                      <div className="flex items-center gap-2 col-span-1 sm:col-span-2">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {customer.address.substring(0, 50)}
                          {customer.address.length > 50 && '...'}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>Cliente desde {new Date(customer.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 shrink-0" />
                      <span>{customer.order_count} {customer.order_count === 1 ? 'pedido' : 'pedidos'}</span>
                    </div>

                    {(customer.booking_count ?? 0) > 0 && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0 text-primary" />
                        <span>{customer.booking_count} {customer.booking_count === 1 ? 'agendamento' : 'agendamentos'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botão de ação */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onResetPassword(customer)}
                  className="w-full md:w-auto shrink-0"
                  disabled={!customer.auth_user_id}
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Resetar Senha
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  // ✅ Usar useStoreAccess para obter o storeId validado
  const { storeId: validatedStoreId, isLoading: storeAccessLoading } = useStoreAccess();
  const { profile } = useAuth();

  // Hook para buscar etiquetas disponíveis da loja
  const { labels: availableLabels } = useCustomerLabels(validatedStoreId);

  // Hook para buscar etiquetas dos clientes (para filtro)
  const customerIds = useMemo(() => customers.map(c => c.id), [customers]);
  const { assignments: allAssignments } = useCustomerLabelAssignments(customerIds, validatedStoreId);

  // ✅ Buscar clientes quando storeId estiver disponível
  useEffect(() => {
    if (!storeAccessLoading) {
      fetchCustomers();
    }
  }, [storeAccessLoading, validatedStoreId]);

  useEffect(() => {
    let result = customers;
    
    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(customer =>
        customer.name.toLowerCase().includes(term) ||
        customer.phone.includes(searchTerm) ||
        customer.email?.toLowerCase().includes(term)
      );
    }
    
    // Filtro por etiquetas
    if (selectedLabelIds.length > 0) {
      result = result.filter(customer => {
        const customerLabels = allAssignments[customer.id] || [];
        return selectedLabelIds.some(labelId => 
          customerLabels.some(l => l.id === labelId)
        );
      });
    }
    
    setFilteredCustomers(result);
  }, [searchTerm, customers, selectedLabelIds, allAssignments]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Buscando clientes...', { validatedStoreId, userType: profile?.user_type });
      
      const userType = profile?.user_type;

      // Se for master_admin, mostra todos os clientes
      if (userType === 'master_admin') {
        console.log('👑 Master admin - buscando TODOS os clientes');
        
        const { data, error } = await supabase
          .from('customers')
          .select(`
            id,
            name,
            phone,
            email,
            address,
            auth_user_id,
            created_at
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const customersWithOrders = await Promise.all(
          (data || []).map(async (customer) => {
            const [orderCountResult, lastOrderResult] = await Promise.all([
              supabase
                .from('orders')
                .select('id', { count: 'exact', head: true })
                .eq('customer_id', customer.id),
              !customer.address
                ? supabase
                    .from('orders')
                    .select('customer_address')
                    .eq('customer_id', customer.id)
                    .not('customer_address', 'is', null)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()
                : Promise.resolve({ data: null })
            ]);

            return {
              ...customer,
              address: customer.address || (lastOrderResult.data as any)?.customer_address || null,
              order_count: orderCountResult.count || 0
            };
          })
        );

        console.log('✅ Total de clientes:', customersWithOrders.length);
        setCustomers(customersWithOrders);
        setFilteredCustomers(customersWithOrders);
        return;
      }

      // Para store_admin, filtra por loja
      if (!validatedStoreId) {
        console.error('❌ Loja não identificada');
        toast.error('Loja não identificada');
        return;
      }

      console.log('🏪 Store admin - buscando clientes da loja:', validatedStoreId);

      // Buscar clientes de pedidos da loja
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('customer_id')
        .eq('store_id', validatedStoreId);

      if (ordersError) {
        console.error('❌ Erro ao buscar pedidos:', ordersError);
        throw ordersError;
      }

      console.log('✅ Pedidos encontrados:', orders?.length || 0);

      // Buscar clientes de agendamentos da loja
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('customer_id')
        .eq('store_id', validatedStoreId)
        .not('customer_id', 'is', null);

      if (bookingsError) {
        console.error('❌ Erro ao buscar agendamentos:', bookingsError);
        throw bookingsError;
      }

      console.log('✅ Agendamentos encontrados:', bookings?.length || 0);

      // Extrair IDs únicos de clientes (pedidos + agendamentos)
      const orderCustomerIds = orders?.map(o => o.customer_id).filter(Boolean) || [];
      const bookingCustomerIds = bookings?.map(b => b.customer_id).filter(Boolean) || [];
      const uniqueCustomerIds = [...new Set([...orderCustomerIds, ...bookingCustomerIds])];

      console.log('✅ Clientes únicos (pedidos + agendamentos):', uniqueCustomerIds.length);

      if (uniqueCustomerIds.length === 0) {
        console.log('⚠️ Nenhum cliente encontrado para esta loja');
        setCustomers([]);
        setFilteredCustomers([]);
        toast.info('Nenhum cliente encontrado para esta loja');
        return;
      }

      // Buscar dados dos clientes
      const { data, error } = await supabase
        .from('customers')
        .select(`
          id,
          name,
          phone,
          email,
          address,
          auth_user_id,
          created_at
        `)
        .in('id', uniqueCustomerIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('✅ Dados de clientes carregados:', data?.length || 0);

      // Buscar contagem de pedidos e agendamentos para cada cliente (apenas da loja)
      const customersWithCounts = await Promise.all(
        (data || []).map(async (customer) => {
          const [ordersResult, bookingsResult, lastOrderResult] = await Promise.all([
            supabase
              .from('orders')
              .select('id', { count: 'exact', head: true })
              .eq('customer_id', customer.id)
              .eq('store_id', validatedStoreId),
            supabase
              .from('bookings')
              .select('id', { count: 'exact', head: true })
              .eq('customer_id', customer.id)
              .eq('store_id', validatedStoreId),
            // Se o cliente não tem endereço, buscar do último pedido
            !customer.address
              ? supabase
                  .from('orders')
                  .select('customer_address')
                  .eq('customer_id', customer.id)
                  .eq('store_id', validatedStoreId)
                  .not('customer_address', 'is', null)
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .maybeSingle()
              : Promise.resolve({ data: null })
          ]);

          return {
            ...customer,
            address: customer.address || (lastOrderResult.data as any)?.customer_address || null,
            order_count: ordersResult.count || 0,
            booking_count: bookingsResult.count || 0
          };
        })
      );

      console.log('✅ Total final:', customersWithCounts.length);
      setCustomers(customersWithCounts);
      setFilteredCustomers(customersWithCounts);
    } catch (error) {
      console.error('❌ Erro ao buscar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedCustomer || !newPassword) {
      toast.error('Preencha a nova senha');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    setResetting(true);
    try {
      console.log('🔐 Resetando senha do cliente:', selectedCustomer.name);

      // Verificar se há sessão ativa
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.error('❌ Nenhuma sessão ativa');
        toast.error('Você precisa estar logado para resetar senhas. Faça login novamente.');
        return;
      }

      console.log('✅ Sessão ativa encontrada:', { 
        userId: sessionData.session.user.id,
        expiresAt: new Date(sessionData.session.expires_at * 1000).toISOString()
      });

      const { data, error } = await supabase.functions.invoke('reset-customer-password', {
        body: {
          customerId: selectedCustomer.id,
          newPassword: newPassword
        }
      });

      console.log('🔐 Resposta:', { data, error });

      if (error) {
        console.error('❌ Erro HTTP:', error);
        // Tentar extrair mensagem mais específica
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          toast.error('Não autorizado. Verifique se você tem permissão de administrador.');
        } else {
          toast.error(error.message || 'Erro ao resetar senha. Tente novamente.');
        }
        return;
      }

      if (data?.error) {
        console.error('❌ Erro retornado pela função:', data.error);
        toast.error(data.error);
        return;
      }

      toast.success(data.message || 'Senha resetada com sucesso!');
      setResetDialogOpen(false);
      setNewPassword('');
      setSelectedCustomer(null);

    } catch (error: any) {
      console.error('❌ Exceção ao resetar senha:', error);
      toast.error('Erro inesperado ao resetar senha. Tente novamente.');
    } finally {
      setResetting(false);
    }
  };

  const openResetDialog = (customer: Customer) => {
    if (!customer.auth_user_id) {
      toast.error('Este cliente não possui autenticação configurada. O cliente precisa criar uma conta com senha primeiro.');
      return;
    }
    setSelectedCustomer(customer);
    setNewPassword('');
    setResetDialogOpen(true);
  };

  if (loading || storeAccessLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gerenciamento de Clientes</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie clientes e leads da sua loja
        </p>
      </div>

      <Tabs defaultValue="customers" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clientes ({customers.length})
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Leads
          </TabsTrigger>
        </TabsList>

        {/* Aba Clientes */}
        <TabsContent value="customers" className="space-y-6 mt-6">
          {/* Busca */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Buscar Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar por nome, telefone ou e-mail..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <LabelFilterDropdown
                    labels={availableLabels}
                    selectedLabelIds={selectedLabelIds}
                    onSelectionChange={setSelectedLabelIds}
                  />
                  <Button variant="outline" onClick={() => {
                    setSearchTerm('');
                    setSelectedLabelIds([]);
                  }}>
                    Limpar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total de Clientes</CardDescription>
                <CardTitle className="text-3xl">{customers.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Com Autenticação</CardDescription>
                <CardTitle className="text-3xl text-green-600">
                  {customers.filter(c => c.auth_user_id).length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Sem Autenticação</CardDescription>
                <CardTitle className="text-3xl text-orange-600">
                  {customers.filter(c => !c.auth_user_id).length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Lista de Clientes */}
          <CustomerList 
            customers={filteredCustomers} 
            storeId={validatedStoreId}
            onResetPassword={openResetDialog} 
          />

          {filteredCustomers.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhum cliente encontrado
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba Leads */}
        <TabsContent value="leads" className="mt-6">
          <LeadsList storeId={validatedStoreId} />
        </TabsContent>
      </Tabs>

      {/* Dialog de Reset de Senha */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetar Senha do Cliente</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para {selectedCustomer?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="text"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                O cliente poderá fazer login com esta senha
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetDialogOpen(false)}
              disabled={resetting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={resetting || !newPassword || newPassword.length < 6}
            >
              {resetting ? 'Resetando...' : 'Resetar Senha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

