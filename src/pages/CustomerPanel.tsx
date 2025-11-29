import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, LogOut } from 'lucide-react';
import CustomerOrderCard from '@/components/admin/CustomerOrderCard';
import CustomerOrderDetailModal from '@/components/admin/CustomerOrderDetailModal';
import BottomNavigation from '@/components/BottomNavigation';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  delivery_type: string;
  customer_address?: string;
  store_id: string;
  stores?: {
    name: string;
    slug: string;
  };
}

export default function CustomerPanel() {
  const { storeSlug } = useParams();
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    if (!authLoading) {
      loadCustomerData();
    }
  }, [user, authLoading]);

  const loadCustomerData = async () => {
    // Só verificar user quando auth terminou de carregar
    if (authLoading) return;
    
    if (!user) {
      navigate(`/cliente/${storeSlug}`);
      return;
    }

    try {
      setLoading(true);

      // Buscar dados do cliente
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id, name')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (customerError) throw customerError;

      if (customerData) {
        setCustomerName(customerData.name);

        // Buscar pedidos do cliente
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            status,
            total,
            created_at,
            delivery_type,
            customer_address,
            store_id,
            stores:store_id (
              name,
              slug
            )
          `)
          .eq('customer_id', customerData.id)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        setOrders(ordersData || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar seus dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      toast({
        title: 'Até logo!',
        description: 'Você saiu da sua conta com sucesso',
      });
      
      await signOut(`/loja/${storeSlug}`);
    } catch (error) {
      console.error('Erro ao sair:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível sair da conta',
        variant: 'destructive',
      });
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header Simplificado */}
      <header className="sticky top-0 z-10 bg-card border-b">
        <div className="flex items-center gap-4 px-4 py-3">
          {storeSlug && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(`/loja/${storeSlug}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Meus Pedidos</h1>
            <p className="text-sm text-muted-foreground">
              Olá, {customerName}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Lista de Pedidos */}
      <main className="container mx-auto px-4 py-4">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Você ainda não fez nenhum pedido
            </p>
            {storeSlug && (
              <Button onClick={() => navigate(`/loja/${storeSlug}`)}>
                Fazer Primeiro Pedido
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id}>
                {order.stores && (
                  <p className="text-xs text-muted-foreground mb-1 px-1">
                    {order.stores.name}
                  </p>
                )}
                <CustomerOrderCard
                  order={order}
                  onViewDetails={() => {
                    // Se pedido está em andamento, redireciona para tracking
                    if (!['concluido', 'cancelado'].includes(order.status)) {
                      navigate(`/pedido/${order.id}`);
                    } else {
                      // Se concluído/cancelado, abre modal normal
                      setSelectedOrderId(order.id);
                    }
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de Detalhes */}
      {selectedOrderId && (
        <CustomerOrderDetailModal
          orderId={selectedOrderId}
          open={!!selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNavigation 
        currentRoute="orders" 
        storeSlug={storeSlug}
      />
    </div>
  );
}
