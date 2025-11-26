import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, DollarSign, CheckCircle2, Package, Eye, User, Navigation, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MyOrderDetailDialog } from './MyOrderDetailDialog';
import { calculateDriverEarnings, type EarningsConfig } from '@/utils/driverEarnings';
import { truncateAddress, formatOrderNumber } from '@/utils/addressFormatter';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total: number;
  subtotal: number;
  delivery_fee: number;
  status: string;
  delivery_type: string;
  created_at: string;
  notes?: string;
  store_id: string;
}

interface Assignment {
  id: string;
  order_id: string;
  status: string;
  accepted_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  orders: Order;
}

interface MyOrderCardProps {
  assignment: Assignment;
  onUpdate: () => void;
  driverEarningsConfig?: EarningsConfig;
}

export function MyOrderCard({ assignment, onUpdate, driverEarningsConfig }: MyOrderCardProps) {
  const { orders: order } = assignment;
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [storeLocation, setStoreLocation] = useState<{
    address?: string;
    latitude?: number;
    longitude?: number;
    name?: string;
  } | null>(null);
  
  const earnings = calculateDriverEarnings(order.delivery_fee, driverEarningsConfig);

  // Buscar localização da loja quando o componente montar
  useEffect(() => {
    const fetchStoreLocation = async () => {
      if (!order.store_id) {
        console.warn('⚠️ MyOrderCard: Sem store_id no pedido');
        return;
      }

      try {
        console.log('🔍 MyOrderCard: Buscando localização da loja para store_id:', order.store_id);
        const { data: store, error: storeError } = await supabase
          .from('stores')
          .select('address, latitude, longitude, name')
          .eq('id', order.store_id)
          .single();

        if (storeError) {
          console.error('❌ MyOrderCard: Erro ao buscar loja:', storeError);
          return;
        }

        if (store) {
          console.log('✅ MyOrderCard: Localização da loja carregada:', {
            name: store.name,
            address: store.address,
            latitude: store.latitude,
            longitude: store.longitude,
            hasAddress: !!store.address,
            hasCoords: !!(store.latitude && store.longitude),
            willRender: !!(store.address || (store.latitude && store.longitude))
          });
          setStoreLocation(store);
        } else {
          console.warn('⚠️ MyOrderCard: Loja não encontrada para store_id:', order.store_id);
          setStoreLocation(null);
        }
      } catch (error) {
        console.error('❌ MyOrderCard: Erro ao buscar localização da loja:', error);
      }
    };

    fetchStoreLocation();
  }, [order.store_id]);

  // Debug: Log quando storeLocation mudar
  useEffect(() => {
    console.log('🔄 MyOrderCard: storeLocation atualizado:', {
      hasStoreLocation: !!storeLocation,
      address: storeLocation?.address,
      latitude: storeLocation?.latitude,
      longitude: storeLocation?.longitude,
      name: storeLocation?.name,
      willRender: !!(storeLocation && (storeLocation.address || (storeLocation.latitude && storeLocation.longitude)))
    });
  }, [storeLocation]);
  
  // Debug temporário para verificar cálculo de ganhos
  console.log('🔍 Debug Ganhos:', {
    delivery_fee: order.delivery_fee,
    config: driverEarningsConfig,
    calculated_earnings: earnings
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  // ✅ STATUS MESTRE: Atualizar orders.status para 'em_transito' quando entregador retirar
  const handleMarkAsPickedUp = async () => {
    try {
      // 1. Atualizar order.status para 'em_transito' (status mestre)
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'em_transito',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (orderError) throw orderError;

      // 2. Atualizar assignment.status para 'picked_up' (controle interno)
      const { error: assignmentError } = await supabase
        .from('delivery_assignments')
        .update({
          status: 'picked_up',
          picked_up_at: new Date().toISOString()
        })
        .eq('id', assignment.id);

      if (assignmentError) throw assignmentError;

      toast.success('Pedido marcado como retirado!');
      onUpdate();
    } catch (error: any) {
      console.error('Erro ao marcar como retirado:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleMarkAsDelivered = async () => {
    try {
      // Atualizar assignment
      const { error: assignmentError } = await supabase
        .from('delivery_assignments')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', assignment.id);

      if (assignmentError) throw assignmentError;

      // Atualizar order
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'concluido',
          completed_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (orderError) throw orderError;

      toast.success('Pedido entregue com sucesso!');
      onUpdate();
    } catch (error: any) {
      console.error('Erro ao marcar como entregue:', error);
      toast.error('Erro ao finalizar entrega');
    }
  };

  // Navegação para o cliente
  const openGoogleMapsToCustomer = () => {
    const address = encodeURIComponent(order.customer_address || '');
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
  };

  const openWazeToCustomer = () => {
    const address = encodeURIComponent(order.customer_address || '');
    window.open(`https://waze.com/ul?q=${address}`, '_blank');
  };

  // Navegação para a loja
  const openGoogleMapsToStore = () => {
    if (!storeLocation) {
      toast.error('Localização da loja não configurada');
      return;
    }
    
    // Priorizar coordenadas, depois endereço
    if (storeLocation.latitude && storeLocation.longitude) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${storeLocation.latitude},${storeLocation.longitude}`, '_blank');
    } else if (storeLocation.address) {
      const address = encodeURIComponent(storeLocation.address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    } else {
      toast.error('Localização da loja não configurada');
    }
  };

  const openWazeToStore = () => {
    if (!storeLocation) {
      toast.error('Localização da loja não configurada');
      return;
    }
    
    // Priorizar coordenadas, depois endereço
    if (storeLocation.latitude && storeLocation.longitude) {
      window.open(`https://waze.com/ul?ll=${storeLocation.latitude},${storeLocation.longitude}&navigate=yes`, '_blank');
    } else if (storeLocation.address) {
      const address = encodeURIComponent(storeLocation.address);
      window.open(`https://waze.com/ul?q=${address}`, '_blank');
    } else {
      toast.error('Localização da loja não configurada');
    }
  };

  // ✅ STATUS MESTRE: Usar order.status do lojista ao invés de assignment.status
  const getStatusBadge = () => {
    switch (order.status) {
      case 'entrada':
        return <Badge variant="default" className="bg-blue-500">Pedido Recebido</Badge>;
      case 'em_preparo':
        return <Badge variant="default" className="bg-orange-500">Em Preparo</Badge>;
      case 'aguarda_retirada':
        return <Badge variant="secondary" className="bg-yellow-500">Aguardando Retirada</Badge>;
      case 'em_transito':
        return <Badge variant="secondary" className="bg-blue-500">Em Trânsito</Badge>;
      case 'concluido':
        return <Badge className="bg-green-600">Entregue</Badge>;
      case 'cancelado':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{order.status}</Badge>;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{formatOrderNumber(order.order_number)}</h3>
            <div className="flex items-center gap-2">
              <User className="w-3 h-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {getFirstName(order.customer_name)}
              </p>
              <span className="text-xs text-yellow-600">(dados protegidos)</span>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">{getFirstName(order.customer_name)}</span>
        </div>

        {/* Localização da Loja - Sempre visível se configurada */}
        {storeLocation && (storeLocation.address || (storeLocation.latitude && storeLocation.longitude)) ? (
          <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
              <span className="text-xs font-semibold text-orange-700 dark:text-orange-300">
                📍 Localização da Loja
              </span>
            </div>
            {storeLocation.name && (
              <p className="text-xs font-medium text-muted-foreground">{storeLocation.name}</p>
            )}
            {storeLocation.address ? (
              <p className="text-xs text-muted-foreground">{truncateAddress(storeLocation.address, 45)}</p>
            ) : storeLocation.latitude && storeLocation.longitude ? (
              <p className="text-xs text-muted-foreground">Coordenadas: {storeLocation.latitude.toFixed(6)}, {storeLocation.longitude.toFixed(6)}</p>
            ) : null}
            {/* Mostrar botões de navegação para loja quando status for 'aguarda_retirada' ou 'em_preparo' */}
            {(order.status === 'aguarda_retirada' || order.status === 'em_preparo') && (
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <Button 
                  onClick={openGoogleMapsToStore}
                  variant="outline" 
                  size="sm"
                  className="h-7 text-xs gap-1"
                >
                  <Navigation className="w-3 h-3" />
                  Maps
                </Button>
                <Button 
                  onClick={openWazeToStore}
                  variant="outline" 
                  size="sm"
                  className="h-7 text-xs gap-1"
                >
                  <Navigation className="w-3 h-3" />
                  Waze
                </Button>
              </div>
            )}
          </div>
        ) : null}

        {/* Localização do Cliente - Sempre visível */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              🏠 Localização do Cliente
            </span>
          </div>
          {order.customer_address ? (
            <>
              <p className="text-xs text-muted-foreground">{truncateAddress(order.customer_address, 45)}</p>
              {/* Mostrar botões de navegação para cliente quando status for 'em_transito' */}
              {order.status === 'em_transito' && (
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <Button 
                    onClick={openGoogleMapsToCustomer} 
                    variant="outline" 
                    size="sm"
                    className="h-7 text-xs gap-1"
                  >
                    <Navigation className="w-3 h-3" />
                    Maps
                  </Button>
                  <Button 
                    onClick={openWazeToCustomer} 
                    variant="outline" 
                    size="sm"
                    className="h-7 text-xs gap-1"
                  >
                    <Navigation className="w-3 h-3" />
                    Waze
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Endereço não informado</p>
          )}
        </div>

        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-sm text-muted-foreground">Você ganha:</span>
          </div>
          <span className="font-bold text-lg text-green-600">
            {formatCurrency(earnings)}
          </span>
        </div>

        {order.notes && (
          <div className="p-2 bg-muted rounded text-sm">
            <p className="text-muted-foreground">
              <strong>Obs:</strong> {order.notes}
            </p>
          </div>
        )}

        <div className="space-y-2 pt-2">
          <Button 
            onClick={() => setDetailDialogOpen(true)} 
            variant="outline" 
            className="w-full gap-2"
          >
            <Eye className="w-4 h-4" />
            Ver Detalhes Completos
          </Button>


          {/* ✅ STATUS MESTRE: Mostrar botão "Retirado" quando lojista colocar "aguarda_retirada" */}
          {order.status === 'aguarda_retirada' && (
            <Button 
              onClick={handleMarkAsPickedUp} 
              className="w-full gap-2 bg-orange-500 hover:bg-orange-600"
            >
              <Package className="w-4 h-4" />
              Marcar como Retirado
            </Button>
          )}

          {/* Mostrar botão "Entregue" quando status for 'em_transito' */}
          {order.status === 'em_transito' && (
            <Button 
              onClick={handleMarkAsDelivered} 
              className="w-full gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Marcar como Entregue
            </Button>
          )}
        </div>
      </CardContent>

      <MyOrderDetailDialog
        assignment={assignment}
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
      />
    </Card>
  );
}
