import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTableComanda } from '@/hooks/useTableComanda';
import { useCheckSalesChannel } from '@/hooks/useCheckSalesChannel';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';
import { TableMenuHeader } from '@/components/table/TableMenuHeader';
import { TableCategoryFilter } from '@/components/table/TableCategoryFilter';
import { TableProductCard } from '@/components/table/TableProductCard';
import { TableSummaryPanel } from '@/components/table/TableSummaryPanel';
import { TableBottomBar } from '@/components/table/TableBottomBar';
import { TablePendingWarning } from '@/components/table/TablePendingWarning';
import { UpsellModal } from '@/components/upsell/UpsellModal';
import { SalesChannelPausedBanner } from '@/components/shared/SalesChannelPausedBanner';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  is_available: boolean;
}

interface Category {
  id: string;
  name: string;
  display_order: number;
}

interface ComandaItem {
  id: string;
  product_name: string;
  quantity: number;
  total_price: number;
  requires_approval: boolean;
  approved_at: string | null;
  preparation_status: string | null;
}

export default function TableMenuPage() {
  const { storeSlug, tableNumber } = useParams<{ storeSlug: string; tableNumber: string }>();
  const navigate = useNavigate();
  const { customerData, addItemToComanda, isLoading: isAddingItem, clearSession } = useTableComanda();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [upsellTriggerProductId, setUpsellTriggerProductId] = useState<string | null>(null);

  useEffect(() => {
    if (!customerData?.comandaId) {
      navigate(`/mesa/${storeSlug}/${tableNumber}`);
    }
  }, [customerData, storeSlug, tableNumber, navigate]);

  const { data: store } = useQuery({
    queryKey: ['store-by-slug', storeSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, slug, logo_url, theme_colors')
        .eq('slug', storeSlug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!storeSlug
  });

  const primaryColor = (store?.theme_colors as any)?.primary || '#3B82F6';

  // Verificar se o canal mesa está ativo
  const { isEnabled: isMesaEnabled, message: channelMessage } = useCheckSalesChannel(store?.id, 'mesa_enabled');
  const salesPaused = !isMesaEnabled;

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', store?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, display_order')
        .eq('store_id', store!.id)
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as Category[];
    },
    enabled: !!store?.id
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', store?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, price, image_url, category_id, is_available')
        .eq('store_id', store!.id)
        .eq('is_available', true)
        .order('name');
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!store?.id
  });

  const { data: comandaItems = [], refetch: refetchItems } = useQuery({
    queryKey: ['comanda-items', customerData?.comandaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comanda_items')
        .select('id, product_name, quantity, total_price, requires_approval, approved_at, preparation_status')
        .eq('comanda_id', customerData!.comandaId)
        .order('added_at', { ascending: false });
      if (error) throw error;
      return data as ComandaItem[];
    },
    enabled: !!customerData?.comandaId,
    refetchInterval: 10000
  });

  useSEO({
    title: store ? `Cardápio - ${store.name}` : 'Cardápio'
  });

  const handleAddItem = async (product: Product) => {
    const success = await addItemToComanda({
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      quantity: 1
    });

    if (success) {
      toast.success(`${product.name} adicionado!`, {
        description: customerData?.requireApproval 
          ? 'Aguardando aprovação do garçom' 
          : 'Enviado para a cozinha'
      });
      refetchItems();
      
      // Mostrar modal de upsell
      setUpsellTriggerProductId(product.id);
      setShowUpsellModal(true);
    }
  };

  const handleUpsellAccept = async (upsellProduct: { id: string; name: string; price: number; image_url: string | null; quantity: number }) => {
    const success = await addItemToComanda({
      productId: upsellProduct.id,
      productName: upsellProduct.name,
      unitPrice: upsellProduct.price,
      quantity: upsellProduct.quantity
    });

    if (success) {
      toast.success(`${upsellProduct.name} adicionado!`);
      refetchItems();
    }
  };

  const handleUpsellDecline = () => {
    setShowUpsellModal(false);
    setUpsellTriggerProductId(null);
  };

  const handleLogout = () => {
    clearSession();
    navigate(`/mesa/${storeSlug}/${tableNumber}`);
  };

  const filteredProducts = activeCategory 
    ? products.filter(p => p.category_id === activeCategory)
    : products;

  const totalComanda = comandaItems.reduce((sum, item) => sum + item.total_price, 0);
  const pendingItems = comandaItems.filter(item => item.requires_approval && !item.approved_at);

  if (!customerData?.comandaId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Banner de vendas pausadas */}
      {salesPaused && (
        <SalesChannelPausedBanner message={channelMessage} className="rounded-none border-x-0 border-t-0" />
      )}

      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <TableMenuHeader
          storeName={store?.name}
          logoUrl={store?.logo_url}
          tableNumber={tableNumber || ''}
          customerName={customerData.customerName}
          comandaNumber={customerData.comandaNumber}
          itemsCount={comandaItems.length}
          showSummary={showSummary}
          onToggleSummary={() => setShowSummary(!showSummary)}
          onLogout={handleLogout}
        />
        <TableCategoryFilter
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      <TablePendingWarning count={pendingItems.length} />

      {showSummary && (
        <TableSummaryPanel items={comandaItems} total={totalComanda} />
      )}

      {/* Products Grid */}
      <div className="p-4 grid gap-3">
        {filteredProducts.map((product) => (
          <TableProductCard
            key={product.id}
            product={product}
            onAdd={() => handleAddItem(product)}
            isLoading={isAddingItem}
            disabled={salesPaused}
          />
        ))}
      </div>

      <TableBottomBar
        total={totalComanda}
        itemsCount={comandaItems.length}
        onViewComanda={() => setShowSummary(!showSummary)}
      />

      {/* Upsell Modal */}
      {store?.id && (
        <UpsellModal
          open={showUpsellModal}
          onOpenChange={(open) => {
            setShowUpsellModal(open);
            if (!open) setUpsellTriggerProductId(null);
          }}
          storeId={store.id}
          triggerProductId={upsellTriggerProductId || ''}
          onAccept={handleUpsellAccept}
          onDecline={handleUpsellDecline}
          themeColor={primaryColor}
        />
      )}
    </div>
  );
}
