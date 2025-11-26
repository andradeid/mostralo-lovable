import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteDriverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: {
    id: string;
    full_name: string;
  };
  onSuccess: () => void;
}

export function DeleteDriverDialog({ open, onOpenChange, driver, onSuccess }: DeleteDriverDialogProps) {
  const [loading, setLoading] = useState(false);
  const [activeDeliveries, setActiveDeliveries] = useState<number | null>(null);

  const checkActiveDeliveries = async () => {
    const { count } = await supabase
      .from('delivery_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('delivery_driver_id', driver.id)
      .in('status', ['assigned', 'accepted', 'picked_up']);

    setActiveDeliveries(count || 0);
  };

  const handleDelete = async () => {
    setLoading(true);

    try {
      // Verificar entregas ativas
      await checkActiveDeliveries();

      if (activeDeliveries && activeDeliveries > 0) {
        toast.error(`Não é possível excluir. Este entregador tem ${activeDeliveries} entrega(s) ativa(s).`);
        setLoading(false);
        return;
      }

      // Remover role (remove acesso, mas mantém histórico)
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', driver.id)
        .eq('role', 'delivery_driver');

      if (error) throw error;

      toast.success('Entregador removido com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao remover entregador:', error);
      toast.error(error.message || 'Erro ao remover entregador');
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
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Confirmar Exclusão
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
                  ⚠️ Este entregador tem {activeDeliveries} entrega(s) ativa(s).
                </p>
                <p>Não é possível remover um entregador com entregas em andamento.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p>
                  Tem certeza que deseja remover <strong>{driver.full_name}</strong>?
                </p>
                <p className="text-xs">
                  O acesso será removido mas o histórico de entregas será mantido.
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          {activeDeliveries !== null && activeDeliveries === 0 && (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Remover Entregador
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
