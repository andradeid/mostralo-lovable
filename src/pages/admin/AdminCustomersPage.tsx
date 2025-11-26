import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, KeyRound, Phone, Mail, MapPin, Calendar, ShoppingBag } from 'lucide-react';
import { formatPhone } from '@/lib/utils';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  auth_user_id: string | null;
  created_at: string;
  order_count?: number;
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

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Buscando clientes...');
      
      // Buscar store_id do usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ Usuário não autenticado');
        toast.error('Usuário não autenticado');
        return;
      }

      console.log('✅ Usuário:', user.id);

      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Erro ao buscar perfil:', profileError);
        throw profileError;
      }

      // Buscar store_id do user_roles
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('store_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      console.log('✅ Perfil:', { store_id: roleData?.store_id, user_type: profile?.user_type });

      const storeId = roleData?.store_id;
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
            const { count } = await supabase
              .from('orders')
              .select('id', { count: 'exact', head: true })
              .eq('customer_id', customer.id);

            return {
              ...customer,
              order_count: count || 0
            };
          })
        );

        console.log('✅ Total de clientes:', customersWithOrders.length);
        setCustomers(customersWithOrders);
        setFilteredCustomers(customersWithOrders);
        return;
      }

      // Para store_admin, filtra por loja
      if (!storeId) {
        console.error('❌ Loja não identificada');
        toast.error('Loja não identificada');
        return;
      }

      console.log('🏪 Store admin - buscando clientes da loja:', storeId);

      // Buscar pedidos da loja
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('customer_id')
        .eq('store_id', storeId);

      if (ordersError) {
        console.error('❌ Erro ao buscar pedidos:', ordersError);
        throw ordersError;
      }

      console.log('✅ Pedidos encontrados:', orders?.length || 0);

      // Extrair IDs únicos de clientes
      const uniqueCustomerIds = [...new Set(orders?.map(o => o.customer_id).filter(Boolean))];

      console.log('✅ Clientes únicos:', uniqueCustomerIds.length);

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

      // Buscar contagem de pedidos para cada cliente (apenas da loja)
      const customersWithOrders = await Promise.all(
        (data || []).map(async (customer) => {
          const { count } = await supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('customer_id', customer.id)
            .eq('store_id', storeId);

          return {
            ...customer,
            order_count: count || 0
          };
        })
      );

      console.log('✅ Total final:', customersWithOrders.length);
      setCustomers(customersWithOrders);
      setFilteredCustomers(customersWithOrders);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gerenciamento de Clientes</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todos os clientes cadastrados
        </p>
      </div>

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome, telefone ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => setSearchTerm('')}>
              Limpar
            </Button>
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
      <div className="grid gap-4">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{customer.name}</h3>
                    {customer.auth_user_id ? (
                      <Badge variant="default" className="bg-green-600">
                        ✓ Com Senha
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-orange-600 text-white">
                        ⚠ Sem Senha
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {formatPhone(customer.phone)}
                    </div>

                    {customer.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {customer.email}
                      </div>
                    )}

                    {customer.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {customer.address.substring(0, 50)}
                        {customer.address.length > 50 && '...'}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Cliente desde {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                    </div>

                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      {customer.order_count} {customer.order_count === 1 ? 'pedido' : 'pedidos'}
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openResetDialog(customer)}
                  className="ml-4"
                  disabled={!customer.auth_user_id}
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Resetar Senha
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredCustomers.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Nenhum cliente encontrado
            </CardContent>
          </Card>
        )}
      </div>

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

