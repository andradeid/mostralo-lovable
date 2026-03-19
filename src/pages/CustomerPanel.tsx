import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, LogOut } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CustomerOrderCard from '@/components/admin/CustomerOrderCard';
import CustomerOrderDetailModal from '@/components/admin/CustomerOrderDetailModal';
import CustomerBookings from '@/components/customer/CustomerBookings';
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
  const { storeSlug, tab } = useParams();
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [hasBookingModule, setHasBookingModule] = useState(false);

  // Tab ativa: pedidos ou agendamentos
  const activeTab = tab === 'agendamentos' ? 'agendamentos' : 'pedidos';

  useEffect(() => {
    if (!authLoading) {
      loadCustomerData();
    }
  }, [user, authLoading]);

  const loadCustomerData = async () => {
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
        setCustomerId(customerData.id);

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

      // Verificar se a loja tem módulo de agendamento (booking_settings)
      if (storeSlug) {
        const { data: storeData } = await supabase
          .from('stores')
          .select('id')
          .eq('slug', storeSlug)
          .single();

        if (storeData) {
          const { data: bookingSettings } = await supabase
            .from('booking_settings')
            .select('id')
            .eq('store_id', storeData.id)
            .maybeSingle();

          setHasBookingModule(!!bookingSettings);
        }
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

  const handleTabChange = (value: string) => {
    if (value === 'pedidos') {
      navigate(`/painel-cliente/${storeSlug}`, { replace: true });
    } else {
      navigate(`/painel-cliente/${storeSlug}/${value}`, { replace: true });
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
      {/* Header */}
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
            <h1 className="text-lg font-semibold">Meu Painel</h1>
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

      {/* Conteúdo com Tabs */}
      <main className="container mx-auto px-4 py-4">
        {hasBookingModule ? (
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="pedidos" className="flex-1">
                Pedidos
              </TabsTrigger>
              <TabsTrigger value="agendamentos" className="flex-1">
                Agendamentos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pedidos">
              <OrdersList
                orders={orders}
                storeSlug={storeSlug}
                onViewDetails={(order) => {
                  if (!['concluido', 'cancelado'].includes(order.status)) {
                    navigate(`/pedido/${order.id}`);
                  } else {
                    setSelectedOrderId(order.id);
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="agendamentos">
              {customerId && (
                <CustomerBookings
                  customerId={customerId}
                  storeSlug={storeSlug}
                />
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <OrdersList
            orders={orders}
            storeSlug={storeSlug}
            onViewDetails={(order) => {
              if (!['concluido', 'cancelado'].includes(order.status)) {
                navigate(`/pedido/${order.id}`);
              } else {
                setSelectedOrderId(order.id);
              }
            }}
          />
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

// Componente interno extraído para evitar duplicação
function OrdersList({
  orders,
  storeSlug,
  onViewDetails,
}: {
  orders: Order[];
  storeSlug?: string;
  onViewDetails: (order: Order) => void;
}) {
  const navigate = useNavigate();

  if (orders.length === 0) {
    return (
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
    );
  }

  return (
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
            onViewDetails={() => onViewDetails(order)}
          />
        </div>
      ))}
    </div>
  );
}
