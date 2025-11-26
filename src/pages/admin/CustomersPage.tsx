import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CustomerCard } from '@/components/admin/CustomerCard';
import { CustomerDetailsModal } from '@/components/admin/CustomerDetailsModal';
import { CustomerFormDialog } from '@/components/admin/CustomerFormDialog';
import { Users, Search, TrendingUp, Calendar, Loader2, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { toast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  total_orders: number;
  total_spent: number;
  last_order_at?: string;
  created_at: string;
}

const CustomersPage = () => {
  const { user } = useAuth();
  const { storeId: validatedStoreId, isLoading: storeAccessLoading, hasAccess } = useStoreAccess();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    newThisMonth: 0,
  });

  useEffect(() => {
    if (!storeAccessLoading && hasAccess && validatedStoreId) {
      loadCustomers();
    }
  }, [validatedStoreId, storeAccessLoading, hasAccess]);

  useEffect(() => {
    filterAndSortCustomers();
  }, [customers, searchQuery, sortBy]);

  const loadCustomers = async () => {
    if (!validatedStoreId) return;

    setLoading(true);
    try {
      // Buscar clientes através de customer_stores com totais específicos da loja
      // Usando validatedStoreId do useStoreAccess (funciona para store_admin e attendant)
      const { data: customerStoresData, error } = await supabase
        .from('customer_stores')
        .select(`
          total_orders,
          total_spent,
          last_order_at,
          customers!inner(
            id,
            name,
            phone,
            email,
            address,
            created_at
          )
        `)
        .eq('store_id', validatedStoreId);
      
      const data = customerStoresData?.map(cs => ({
        ...cs.customers,
        total_orders: cs.total_orders,
        total_spent: cs.total_spent,
        last_order_at: cs.last_order_at,
      })).filter(Boolean) || [];

      if (error) throw error;

      setCustomers(data || []);

      // Calcular estatísticas
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const newThisMonth = data?.filter(
        (c) => new Date(c.created_at) >= firstDayOfMonth
      ).length || 0;

      setStats({
        total: data?.length || 0,
        newThisMonth,
      });
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os clientes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCustomers = () => {
    let filtered = [...customers];

    // Filtrar por busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.phone.includes(query) ||
          c.email?.toLowerCase().includes(query)
      );
    }

    // Ordenar
    switch (sortBy) {
      case 'orders':
        filtered.sort((a, b) => b.total_orders - a.total_orders);
        break;
      case 'spent':
        filtered.sort((a, b) => Number(b.total_spent) - Number(a.total_spent));
        break;
      case 'recent':
      default:
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
    }

    setFilteredCustomers(filtered);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie os clientes da sua loja
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Cliente
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Novos este Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newThisMonth}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Crescimento</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total > 0
                ? `${((stats.newThisMonth / stats.total) * 100).toFixed(1)}%`
                : '0%'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, telefone ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais Recentes</SelectItem>
                <SelectItem value="orders">Mais Pedidos</SelectItem>
                <SelectItem value="spent">Maior Gasto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                {searchQuery
                  ? 'Nenhum cliente encontrado com esse termo de busca'
                  : 'Nenhum cliente cadastrado ainda'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCustomers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onViewDetails={setSelectedCustomerId}
            />
          ))}
        </div>
      )}

      {/* Modal de Detalhes */}
      {selectedCustomerId && (
        <CustomerDetailsModal
          open={!!selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
          customerId={selectedCustomerId}
        />
      )}

      {/* Modal de Adicionar Cliente */}
      <CustomerFormDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={loadCustomers}
      />
    </div>
  );
};

export default CustomersPage;
