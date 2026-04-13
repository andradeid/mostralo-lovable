import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  ShoppingBag,
  Clock,
  ChevronRight,
  Loader2,
  RefreshCw,
  Phone,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CustomerAuthDialog = lazy(
  () =>
    import('@/components/checkout/CustomerAuthDialog').then((m) => ({
      default: m.CustomerAuthDialog,
    }))
);

interface OrderSummary {
  id: string;
  order_number: string;
  status: string;
  total: number;
  delivery_type: string;
  payment_method: string;
  created_at: string;
  estimated_delivery_minutes: number | null;
  stores: {
    slug: string;
    name: string;
    logo_url: string | null;
  } | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  entrada: { label: 'Recebido', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: '📥' },
  em_preparo: { label: 'Em Preparo', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: '👨‍🍳' },
  aguarda_retirada: { label: 'Pronto', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: '📦' },
  em_transito: { label: 'Saiu p/ Entrega', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', icon: '🚴' },
  concluido: { label: 'Entregue', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: '✅' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: '❌' },
};

export default function CustomerOrdersPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string>('');
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [storeLoading, setStoreLoading] = useState(true);

  // 1. Buscar store_id pelo slug
  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from('public_stores')
        .select('id, name')
        .eq('slug', slug)
        .maybeSingle();
      if (data) {
        setStoreId(data.id);
        setStoreName(data.name);
      }
      setStoreLoading(false);
    })();
  }, [slug]);

  // 2. Verificar token no localStorage
  useEffect(() => {
    if (!storeId) return;
    const raw = localStorage.getItem(`customer_${storeId}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setHasToken(!!parsed?.token);
      } catch {
        setHasToken(false);
      }
    } else {
      setHasToken(false);
    }
    setLoading(false);
  }, [storeId]);

  // 3. Buscar pedidos via Edge Function
  const fetchOrders = useCallback(
    async (p = 1, isRefresh = false) => {
      if (!storeId) return;
      const raw = localStorage.getItem(`customer_${storeId}`);
      if (!raw) return;

      let token: string | null = null;
      try {
        const parsed = JSON.parse(raw);
        token = parsed?.token;
      } catch {
        return;
      }
      if (!token) return;

      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const { data, error } = await supabase.functions.invoke('customer-orders', {
          body: { customer_token: token, store_id: storeId, page: p, limit: 20 },
        });

        if (error || data?.error) {
          if (data?.code === 'INVALID_TOKEN') {
            // Token expirado — limpar e pedir re-identificação
            localStorage.removeItem(`customer_${storeId}`);
            setHasToken(false);
          }
          console.error('Erro ao buscar pedidos:', error || data?.error);
          return;
        }

        setOrders(data.orders || []);
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [storeId]
  );

  useEffect(() => {
    if (hasToken && storeId) {
      fetchOrders(1);
    }
  }, [hasToken, storeId, fetchOrders]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleAuthSuccess = () => {
    setShowAuthDialog(false);
    setHasToken(true);
  };

  // Loading da loja
  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Loja não encontrada
  if (!storeId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 gap-4">
        <h2 className="text-xl font-bold text-foreground">Loja não encontrada</h2>
        <Button variant="outline" onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>
    );
  }

  // Sem token — tela de identificação
  if (!hasToken) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/loja/${slug}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold text-lg">Meus Pedidos</h1>
          </div>
        </header>

        <main className="container max-w-2xl mx-auto px-4 py-12">
          <Card className="p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Phone className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Identifique-se</h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Para ver seus pedidos, informe o número de WhatsApp que você usou para fazer seus pedidos.
            </p>
            <Button size="lg" onClick={() => setShowAuthDialog(true)} className="mt-2">
              Informar meu WhatsApp
            </Button>
          </Card>
        </main>

        <Suspense fallback={null}>
          {showAuthDialog && (
            <CustomerAuthDialog
              open={showAuthDialog}
              onOpenChange={setShowAuthDialog}
              storeId={storeId}
              storeSlug={slug || ''}
              onAuthSuccess={handleAuthSuccess}
            />
          )}
        </Suspense>
      </div>
    );
  }

  // Com token — lista de pedidos
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/loja/${slug}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg">Meus Pedidos</h1>
              {storeName && (
                <p className="text-xs text-muted-foreground">{storeName}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchOrders(page, true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-4 space-y-3">
        {/* Resumo */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShoppingBag className="h-4 w-4" />
          <span>{total} {total === 1 ? 'pedido' : 'pedidos'}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <Card className="p-8 text-center space-y-3">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhum pedido encontrado</p>
            <Button variant="outline" onClick={() => navigate(`/loja/${slug}`)}>
              Ver cardápio
            </Button>
          </Card>
        ) : (
          <>
            <div className="space-y-2">
              {orders.map((order) => {
                const status = statusConfig[order.status] || {
                  label: order.status,
                  color: 'bg-muted text-muted-foreground',
                  icon: '📋',
                };
                return (
                  <Card
                    key={order.id}
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.99]"
                    onClick={() => navigate(`/pedido/${order.id}`)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            #{order.order_number}
                          </span>
                          <Badge variant="secondary" className={`text-xs ${status.color}`}>
                            {status.icon} {status.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                          <span>•</span>
                          <span>
                            {order.delivery_type === 'delivery' ? '🛵 Entrega' : '🏪 Retirada'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary whitespace-nowrap">
                          {formatCurrency(order.total)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <>
                <Separator />
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => fetchOrders(page - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => fetchOrders(page + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
