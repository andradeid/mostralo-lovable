import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Phone, MapPin, Bell } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { OrderStatusTimeline } from '@/components/customer/OrderStatusTimeline';
import { OrderConfettiAnimation } from '@/components/customer/OrderConfettiAnimation';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { order, loading, error } = useOrderTracking(orderId || '');
  const [showConfetti, setShowConfetti] = useState(true);

  // Log quando order muda
  useEffect(() => {
    if (order) {
      console.log('📦 OrderTracking: Order atualizado', {
        orderId: order.id,
        status: order.status,
        deliveryType: order.delivery_type,
        orderNumber: order.order_number
      });
    }
  }, [order?.status, order?.id]);

  useEffect(() => {
    // Esconder confetti após 3 segundos
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Pedido não encontrado</h2>
          <p className="text-muted-foreground">{error || 'Não foi possível carregar o pedido'}</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const elapsedTime = formatDistanceToNow(new Date(order.created_at), {
    locale: ptBR,
    addSuffix: true
  });

  const handleCallStore = () => {
    if (order.customer_phone) {
      window.location.href = `tel:${order.customer_phone}`;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {showConfetti && <OrderConfettiAnimation />}
      
      {/* Header Sticky */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Confirmação do Pedido */}
        <Card className="p-6 text-center space-y-2">
          <div className="text-4xl mb-2">
            {order.status === 'entrada' ? '🔔' : order.status === 'cancelado' ? '❌' : '🎉'}
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Pedido #{order.order_number}
          </h1>
          {order.status === 'entrada' ? (
            <>
              <p className="text-lg text-yellow-600 font-semibold">Aguardando aceitação</p>
              <p className="text-xs text-muted-foreground mt-1">
                Seu pedido foi recebido e está aguardando confirmação da loja
              </p>
            </>
          ) : order.status === 'cancelado' ? (
            <p className="text-lg text-red-600 font-semibold">Cancelado</p>
          ) : (
            <p className="text-lg text-primary font-semibold">Confirmado!</p>
          )}
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            {elapsedTime}
          </p>
        </Card>

        {/* Timeline de Status */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Acompanhe seu Pedido</h2>
          <OrderStatusTimeline
            currentStatus={order.status}
            deliveryType={order.delivery_type}
            createdAt={order.created_at}
            completedAt={order.completed_at}
            assignedDriverName={order.profiles?.full_name}
          />
        </Card>

        {/* Itens do Pedido */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            📦 Seus Itens
          </h2>
          <div className="space-y-3">
            {order.order_items?.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-foreground">
                  {item.quantity}x {item.product_name}
                </span>
                <span className="text-muted-foreground font-medium">
                  R$ {item.subtotal.toFixed(2)}
                </span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span className="text-primary">R$ {order.total.toFixed(2)}</span>
            </div>
          </div>
          </Card>

          {/* Informações do Entregador */}
          {order.assigned_driver_id && order.profiles && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                🚴 Entregador
              </h2>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  {order.profiles.avatar_url && (
                    <AvatarImage 
                      src={order.profiles.avatar_url} 
                      alt={order.profiles.full_name} 
                    />
                  )}
                  <AvatarFallback className="text-lg">
                    {order.profiles.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-base">{order.profiles.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.status === 'em_transito' 
                      ? 'A caminho do endereço de entrega' 
                      : 'Entregador atribuído'}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Informações da Loja */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🏪 Informações do Pedido
          </h2>
          <div className="space-y-3">
            {order.customer_phone && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleCallStore}
              >
                <Phone className="mr-2 h-4 w-4" />
                {order.customer_phone}
              </Button>
            )}
            {order.customer_address && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{order.customer_address}</span>
              </div>
            )}
            {order.notes && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-1">Observações:</p>
                <p className="text-sm text-foreground">{order.notes}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Informações de Pagamento */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">💳 Pagamento</h2>
            <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Método:</span>
              <span className="font-medium text-foreground">
                {order.payment_method === 'pix' && 'PIX'}
                {order.payment_method === 'card' && 'Cartão'}
                {order.payment_method === 'cash' && 'Dinheiro'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className={`font-medium ${
                order.payment_status === 'paid' ? 'text-green-600' :
                order.payment_status === 'pending' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {order.payment_status === 'paid' && 'Pago'}
                {order.payment_status === 'pending' && 'Pendente'}
                {order.payment_status === 'cancelled' && 'Cancelado'}
              </span>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
