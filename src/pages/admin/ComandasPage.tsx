import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useComandas, Comanda } from '@/hooks/useComandas';
import { ComandaCard } from '@/components/comandas/ComandaCard';
import { NewComandaDialog } from '@/components/comandas/NewComandaDialog';
import { CloseComandaModal } from '@/components/comandas/CloseComandaModal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Loader2, Receipt } from 'lucide-react';
import { printComanda } from '@/utils/printComanda';
import { supabase } from '@/integrations/supabase/client';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useQuery } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';
import { ModuleGate } from '@/components/admin/ModuleGate';

export default function ComandasPage() {
  const navigate = useNavigate();
  const { storeId } = useStoreAccess();
  const { comandas, openComandas, loadingComandas, createComanda, closeComanda, cancelComanda, isCreating, isClosing, pendingApprovalsByComanda } = useComandas();
  const isMobile = useIsMobile();
  
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [selectedComanda, setSelectedComanda] = useState<Comanda | null>(null);

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

  const todayComandas = comandas.filter(c => {
    const today = new Date().toDateString();
    return new Date(c.opened_at).toDateString() === today;
  });

  const handleNewComanda = async (type: 'balcao' | 'mesa', tableNumber?: string, customerName?: string) => {
    const comanda = await createComanda({ type, table_number: tableNumber, customer_name: customerName });
    setNewDialogOpen(false);
    if (comanda) {
      navigate(`/dashboard/comandas/${comanda.id}`);
    }
  };

  const handleCloseComanda = (comanda: Comanda) => {
    setSelectedComanda(comanda);
    setCloseModalOpen(true);
  };

  const handleConfirmClose = async (paymentMethod: string, discount: number, serviceFee: number, paymentDetails?: Record<string, any>) => {
    if (selectedComanda) {
      await closeComanda({ 
        comanda_id: selectedComanda.id, 
        payment_method: paymentMethod, 
        discount, 
        service_fee: serviceFee,
        payment_details: paymentDetails 
      });
      setCloseModalOpen(false);
      setSelectedComanda(null);
    }
  };

  const handleCancelComanda = async (comanda: Comanda) => {
    if (confirm('Tem certeza que deseja cancelar esta comanda?')) {
      await cancelComanda(comanda.id);
    }
  };

  const handlePrintComanda = async (comanda: Comanda) => {
    const { data: items } = await supabase
      .from('comanda_items')
      .select('*')
      .eq('comanda_id', comanda.id);
    
    printComanda(comanda, (items || []) as any, storeData?.name || 'Estabelecimento');
  };

  if (loadingComandas) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ModuleGate moduleKey="pdv_comandas" storeId={storeId}>
      <div className={`space-y-4 ${isMobile ? 'pb-24' : 'space-y-6'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between ${isMobile ? 'px-1' : ''}`}>
        <div>
          <h1 className={`font-bold ${isMobile ? 'text-xl' : 'text-2xl'}`}>Comandas</h1>
          {!isMobile && <p className="text-muted-foreground">Gerencie comandas de mesa e balcão</p>}
        </div>
        {!isMobile && (
          <Button onClick={() => setNewDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Comanda
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="open" className="w-full">
        <TabsList className={`${isMobile ? 'w-full h-12' : ''}`}>
          <TabsTrigger value="open" className={isMobile ? 'flex-1 h-10 text-base' : ''}>
            Abertas ({openComandas.length})
          </TabsTrigger>
          <TabsTrigger value="today" className={isMobile ? 'flex-1 h-10 text-base' : ''}>
            Hoje ({todayComandas.length})
          </TabsTrigger>
          <TabsTrigger value="all" className={isMobile ? 'flex-1 h-10 text-base' : ''}>
            Todas ({comandas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-4">
          {openComandas.length === 0 ? (
            <div className={`text-center text-muted-foreground ${isMobile ? 'py-16' : 'py-12'}`}>
              <Receipt className={`mx-auto mb-4 opacity-20 ${isMobile ? 'h-16 w-16' : 'h-12 w-12'}`} />
              <p className={isMobile ? 'text-lg' : ''}>Nenhuma comanda aberta</p>
            </div>
          ) : (
            <div className={`grid gap-4 ${
              isMobile 
                ? 'grid-cols-1' 
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}>
              {openComandas.map((comanda) => (
                <ComandaCard
                  key={comanda.id}
                  comanda={comanda}
                  pendingApprovalCount={pendingApprovalsByComanda[comanda.id] || 0}
                  onClick={() => navigate(`/dashboard/comandas/${comanda.id}`)}
                  onClose={() => handleCloseComanda(comanda)}
                  onCancel={() => handleCancelComanda(comanda)}
                  onPrint={() => handlePrintComanda(comanda)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="today" className="mt-4">
          <div className={`grid gap-4 ${
            isMobile 
              ? 'grid-cols-1' 
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
            {todayComandas.map((comanda) => (
              <ComandaCard
                key={comanda.id}
                comanda={comanda}
                pendingApprovalCount={pendingApprovalsByComanda[comanda.id] || 0}
                onClick={() => navigate(`/dashboard/comandas/${comanda.id}`)}
                onClose={() => handleCloseComanda(comanda)}
                onCancel={() => handleCancelComanda(comanda)}
                onPrint={() => handlePrintComanda(comanda)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <div className={`grid gap-4 ${
            isMobile 
              ? 'grid-cols-1' 
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
            {comandas.map((comanda) => (
              <ComandaCard
                key={comanda.id}
                comanda={comanda}
                pendingApprovalCount={pendingApprovalsByComanda[comanda.id] || 0}
                onClick={() => navigate(`/dashboard/comandas/${comanda.id}`)}
                onClose={() => handleCloseComanda(comanda)}
                onCancel={() => handleCancelComanda(comanda)}
                onPrint={() => handlePrintComanda(comanda)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* FAB para nova comanda no mobile */}
      {isMobile && (
        <Button
          size="lg"
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-50"
          onClick={() => setNewDialogOpen(true)}
        >
          <Plus className="h-7 w-7" />
        </Button>
      )}

      <NewComandaDialog 
        open={newDialogOpen} 
        onOpenChange={setNewDialogOpen} 
        onConfirm={handleNewComanda} 
        isLoading={isCreating} 
      />
      
        {selectedComanda && (
          <CloseComandaModal
            open={closeModalOpen}
            onOpenChange={setCloseModalOpen}
            subtotal={selectedComanda.total}
            onConfirm={handleConfirmClose}
            isProcessing={isClosing}
          />
        )}
      </div>
    </ModuleGate>
  );
}
