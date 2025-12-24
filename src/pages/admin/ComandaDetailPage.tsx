import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useComandas } from '@/hooks/useComandas';
import { PDVProductGrid } from '@/components/pdv/PDVProductGrid';
import { CloseComandaModal } from '@/components/comandas/CloseComandaModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Plus, Trash2, Loader2, X, Printer } from 'lucide-react';
import { printComanda } from '@/utils/printComanda';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function ComandaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { storeId } = useStoreAccess();
  const { useComandaDetail, addItem, removeItem, closeComanda, isAddingItem, isRemovingItem, isClosing } = useComandas();
  const { data, isLoading } = useComandaDetail(id);
  
  const [showProducts, setShowProducts] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);

  // Buscar nome da loja para impressão
  const { data: storeData } = useQuery({
    queryKey: ['store-name', storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const { data, error } = await supabase
        .from('stores')
        .select('name')
        .eq('id', storeId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!storeId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Comanda não encontrada</p>
        <Button variant="link" onClick={() => navigate('/dashboard/comandas')}>
          Voltar para comandas
        </Button>
      </div>
    );
  }

  const { comanda, items } = data;

  const handleAddProduct = async (product: { product_id: string; product_name: string; unit_price: number; quantity: number }) => {
    await addItem({ comanda_id: comanda.id, ...product });
  };

  const handleRemoveItem = async (itemId: string) => {
    await removeItem({ itemId, comandaId: comanda.id });
  };

  const handleCloseComanda = async (paymentMethod: string, discount: number, serviceFee: number, paymentDetails?: Record<string, any>) => {
    await closeComanda({ 
      comanda_id: comanda.id, 
      payment_method: paymentMethod, 
      discount, 
      service_fee: serviceFee,
      payment_details: paymentDetails 
    });
    setCloseModalOpen(false);
    navigate('/dashboard/comandas');
  };

  const handlePrint = () => {
    printComanda(comanda, items, storeData?.name || 'Estabelecimento');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/comandas')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Comanda #{comanda.number}</h1>
              <Badge className={comanda.status === 'open' ? 'bg-green-500' : 'bg-gray-500'}>
                {comanda.status === 'open' ? 'Aberta' : 'Fechada'}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {comanda.type === 'mesa' ? `Mesa ${comanda.table_number}` : 'Balcão'}
              {comanda.customer_name && ` • ${comanda.customer_name}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          {comanda.status === 'open' && (
            <>
              <Button variant="outline" onClick={() => setShowProducts(!showProducts)}>
                {showProducts ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                {showProducts ? 'Fechar' : 'Adicionar Item'}
              </Button>
              <Button onClick={() => setCloseModalOpen(true)}>
                Fechar Comanda
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Itens da comanda */}
        <Card>
          <CardHeader>
            <CardTitle>Itens ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum item adicionado</p>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity}x {formatCurrency(item.unit_price)}
                        </p>
                        {item.notes && <p className="text-xs italic mt-1">Obs: {item.notes}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-primary">{formatCurrency(item.total_price)}</span>
                        {comanda.status === 'open' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={isRemovingItem}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Total */}
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(comanda.subtotal)}</span>
              </div>
              {comanda.service_fee > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Taxa de Serviço ({comanda.subtotal > 0 ? ((comanda.service_fee / comanda.subtotal) * 100).toFixed(0) : '10'}%)</span>
                  <span>+{formatCurrency(comanda.service_fee)}</span>
                </div>
              )}
              {comanda.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto</span>
                  <span>-{formatCurrency(comanda.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(comanda.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grid de produtos (quando ativo) */}
        {showProducts && comanda.status === 'open' && (
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <PDVProductGrid onAddProduct={handleAddProduct} />
            </CardContent>
          </Card>
        )}
      </div>

      <CloseComandaModal
        open={closeModalOpen}
        onOpenChange={setCloseModalOpen}
        subtotal={comanda.subtotal}
        onConfirm={handleCloseComanda}
        isProcessing={isClosing}
        onPrint={handlePrint}
      />
    </div>
  );
}
