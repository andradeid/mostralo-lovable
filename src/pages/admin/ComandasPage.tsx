import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useComandas } from '@/hooks/useComandas';
import { ComandaCard } from '@/components/comandas/ComandaCard';
import { NewComandaDialog } from '@/components/comandas/NewComandaDialog';
import { CloseComandaModal } from '@/components/comandas/CloseComandaModal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Loader2, Receipt } from 'lucide-react';

export default function ComandasPage() {
  const navigate = useNavigate();
  const { comandas, openComandas, loadingComandas, createComanda, closeComanda, cancelComanda, isCreating, isClosing, isCancelling } = useComandas();
  
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [selectedComanda, setSelectedComanda] = useState<any>(null);

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

  const handleCloseComanda = (comanda: any) => {
    setSelectedComanda(comanda);
    setCloseModalOpen(true);
  };

  const handleConfirmClose = async (paymentMethod: string, discount: number, paymentDetails?: Record<string, any>) => {
    if (selectedComanda) {
      await closeComanda({ comanda_id: selectedComanda.id, payment_method: paymentMethod, discount, payment_details: paymentDetails });
      setCloseModalOpen(false);
      setSelectedComanda(null);
    }
  };

  const handleCancelComanda = async (comanda: any) => {
    if (confirm('Tem certeza que deseja cancelar esta comanda?')) {
      await cancelComanda(comanda.id);
    }
  };

  if (loadingComandas) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Comandas</h1>
          <p className="text-muted-foreground">Gerencie comandas de mesa e balcão</p>
        </div>
        <Button onClick={() => setNewDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Comanda
        </Button>
      </div>

      <Tabs defaultValue="open" className="w-full">
        <TabsList>
          <TabsTrigger value="open">Abertas ({openComandas.length})</TabsTrigger>
          <TabsTrigger value="today">Hoje ({todayComandas.length})</TabsTrigger>
          <TabsTrigger value="all">Todas ({comandas.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-4">
          {openComandas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nenhuma comanda aberta</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {openComandas.map((comanda) => (
                <ComandaCard
                  key={comanda.id}
                  comanda={comanda}
                  onClick={() => navigate(`/dashboard/comandas/${comanda.id}`)}
                  onClose={() => handleCloseComanda(comanda)}
                  onCancel={() => handleCancelComanda(comanda)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="today" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {todayComandas.map((comanda) => (
              <ComandaCard
                key={comanda.id}
                comanda={comanda}
                onClick={() => navigate(`/dashboard/comandas/${comanda.id}`)}
                onClose={() => handleCloseComanda(comanda)}
                onCancel={() => handleCancelComanda(comanda)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {comandas.map((comanda) => (
              <ComandaCard
                key={comanda.id}
                comanda={comanda}
                onClick={() => navigate(`/dashboard/comandas/${comanda.id}`)}
                onClose={() => handleCloseComanda(comanda)}
                onCancel={() => handleCancelComanda(comanda)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <NewComandaDialog open={newDialogOpen} onOpenChange={setNewDialogOpen} onConfirm={handleNewComanda} isLoading={isCreating} />
      
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
  );
}
