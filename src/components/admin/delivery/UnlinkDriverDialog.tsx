import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Loader2, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

interface UnlinkDriverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: {
    id: string;
    full_name: string;
  };
  storeId: string;
  onSuccess: () => void;
}

export function UnlinkDriverDialog({ open, onOpenChange, driver, storeId, onSuccess }: UnlinkDriverDialogProps) {
  const [loading, setLoading] = useState(false);
  const [activeDeliveries, setActiveDeliveries] = useState<number | null>(null);

  const checkActiveDeliveries = async () => {
    const { count } = await supabase
      .from('delivery_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('delivery_driver_id', driver.id)
      .eq('store_id', storeId)
      .in('status', ['assigned', 'accepted', 'picked_up']);

    setActiveDeliveries(count || 0);
  };

  const handleUnlink = async () => {
    setLoading(true);

    try {
      // Verificar entregas ativas da loja específica
      await checkActiveDeliveries();

      if (activeDeliveries && activeDeliveries > 0) {
        toast.error(`Não é possível desvincular. Este entregador tem ${activeDeliveries} entrega(s) ativa(s) nesta loja.`);
        setLoading(false);
        return;
      }

      // Remover role APENAS da loja específica
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', driver.id)
        .eq('role', 'delivery_driver')
        .eq('store_id', storeId);

      if (error) throw error;

      toast.success('Entregador desvinculado da loja com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao desvincular entregador:', error);
      toast.error(error.message || 'Erro ao desvincular entregador');
    } finally {
      setLoading(false);
    }
  };

  // Verificar ao abrir
  if (open && activeDeliveries === null) {
    checkActiveDeliveries();
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <UserMinus className="w-5 h-5 text-amber-600" />
            Desvincular Entregador
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            {activeDeliveries === null ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Verificando entregas ativas...
              </div>
            ) : activeDeliveries > 0 ? (
              <div className="space-y-2">
                <p className="font-semibold text-destructive">
                  ⚠️ Este entregador tem {activeDeliveries} entrega(s) ativa(s) nesta loja.
                </p>
                <p>Não é possível desvincular um entregador com entregas em andamento.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p>
                  Tem certeza que deseja desvincular <strong>{driver.full_name}</strong> da sua loja?
                </p>
                <p className="text-xs">
                  O entregador continuará tendo acesso a outras lojas vinculadas. O histórico de entregas desta loja será mantido para auditoria.
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          {activeDeliveries !== null && activeDeliveries === 0 && (
            <AlertDialogAction
              onClick={handleUnlink}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Desvincular da Loja
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
