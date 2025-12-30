import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, QrCode, UtensilsCrossed } from 'lucide-react';
import { TableCustomerAuth } from '@/components/table/TableCustomerAuth';
import { useTableComanda } from '@/hooks/useTableComanda';
import { useSEO } from '@/hooks/useSEO';
import { useCheckSalesChannel } from '@/hooks/useCheckSalesChannel';
import { SalesChannelPausedBanner } from '@/components/shared/SalesChannelPausedBanner';

interface Store {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  theme_colors: Record<string, unknown> | null;
}

export default function TableAccessPage() {
  const { storeSlug, tableNumber } = useParams<{ storeSlug: string; tableNumber: string }>();
  const navigate = useNavigate();
  const { customerData } = useTableComanda();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Buscar dados da loja
  const { data: store, isLoading: storeLoading, error: storeError } = useQuery({
    queryKey: ['store-by-slug', storeSlug],
    queryFn: async () => {
      if (!storeSlug) return null;

      const { data, error } = await supabase
        .from('stores')
        .select('id, name, slug, logo_url, theme_colors')
        .eq('slug', storeSlug)
        .single();

      if (error) throw error;
      return data as Store;
    },
    enabled: !!storeSlug
  });

  // Verificar se o canal de mesa está ativo
  const { isEnabled: isMesaEnabled, isLoading: channelLoading, message: channelMessage } = 
    useCheckSalesChannel(store?.id, 'mesa_enabled');

  // SEO
  useSEO({
    title: store ? `Mesa ${tableNumber} - ${store.name}` : 'Cardápio na Mesa',
    description: store ? `Faça seu pedido diretamente da mesa ${tableNumber} em ${store.name}` : undefined
  });

  // Verificar se já está autenticado e redirecionar para cardápio
  useEffect(() => {
    if (customerData?.comandaId && store) {
      setIsAuthenticated(true);
      // Redirecionar para o cardápio em modo mesa
      navigate(`/mesa/${storeSlug}/${tableNumber}/cardapio`);
    }
  }, [customerData, store, storeSlug, tableNumber, navigate]);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    navigate(`/mesa/${storeSlug}/${tableNumber}/cardapio`);
  };

  if (storeLoading || channelLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (storeError || !store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <QrCode className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Loja não encontrada</h1>
        <p className="text-muted-foreground">
          O QR Code pode estar incorreto ou a loja não está disponível.
        </p>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="bg-primary/5 border-b py-6 px-4">
        <div className="max-w-md mx-auto text-center">
          {store.logo_url ? (
            <img 
              src={store.logo_url} 
              alt={store.name} 
              className="h-16 w-16 rounded-full mx-auto mb-3 object-cover border-2 border-primary/20"
            />
          ) : (
            <div className="h-16 w-16 rounded-full mx-auto mb-3 bg-primary/10 flex items-center justify-center">
              <UtensilsCrossed className="h-8 w-8 text-primary" />
            </div>
          )}
          <h1 className="text-xl font-bold">{store.name}</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <QrCode className="h-4 w-4" />
              Mesa {tableNumber}
            </span>
          </div>
        </div>
      </div>

      {/* Banner de canal pausado */}
      {!isMesaEnabled && (
        <div className="max-w-md mx-auto px-4 pt-4">
          <SalesChannelPausedBanner message={channelMessage} />
        </div>
      )}

      {/* Auth Form ou mensagem de indisponível */}
      <div className="max-w-md mx-auto p-6">
        {isMesaEnabled ? (
          <TableCustomerAuth
            storeId={store.id}
            tableNumber={tableNumber || ''}
            onSuccess={handleAuthSuccess}
          />
        ) : (
          <div className="text-center p-6 bg-muted/50 rounded-lg">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              O serviço de pedidos pela mesa está temporariamente indisponível.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Por favor, aguarde ou chame um atendente.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 text-center text-xs text-muted-foreground bg-background/80 backdrop-blur">
        Pedido via celular • Pagamento com garçom
      </div>
    </div>
  );
}
